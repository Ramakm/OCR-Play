"""
OCR microservice — Tesseract OCR + rule-based JSON extractor (no external API needed)
- POST /ocr     → extract raw text from image
- POST /convert → full pipeline: OCR text → structured JSON
"""

import io
import re

import pytesseract
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

def run_ocr(image_bytes: bytes, mime_type: str) -> str:
    if mime_type == "application/pdf":
        try:
            from pdf2image import convert_from_bytes
        except ImportError:
            raise HTTPException(
                status_code=422,
                detail="pdf2image not installed. Run: pip install pdf2image",
            )
        pages = convert_from_bytes(image_bytes, first_page=1, last_page=1, dpi=200)
        img = pages[0]
    else:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    return pytesseract.image_to_string(img).strip()


# ---------------------------------------------------------------------------
# Rule-based structured extractor
# ---------------------------------------------------------------------------

def _find(patterns: list[str], text: str) -> str | None:
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return None


def _parse_amount(s: str | None) -> float | None:
    if not s:
        return None
    cleaned = re.sub(r"[^\d.]", "", s)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _extract_items(text: str) -> list[dict]:
    """
    Heuristic: look for lines that have a description + a money amount.
    e.g. "Web Design  1  500.00  500.00"
    """
    items = []
    money_re = r"\d[\d,]*\.\d{2}"
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        amounts = re.findall(money_re, line)
        if not amounts:
            continue
        # Remove all numbers / amounts from the line to get the description
        desc = re.sub(money_re, "", line)
        desc = re.sub(r"\s{2,}", " ", desc).strip(" :-|")
        if not desc:
            continue
        total_str = amounts[-1]
        unit_price_str = amounts[-2] if len(amounts) >= 2 else amounts[0]
        qty_m = re.search(r"\b(\d+)\b", re.sub(money_re, "", line))
        qty = int(qty_m.group(1)) if qty_m else 1
        items.append({
            "description": desc,
            "quantity": qty,
            "unit_price": _parse_amount(unit_price_str),
            "total": _parse_amount(total_str),
        })
    return items


def ocr_text_to_json(text: str) -> dict:
    invoice_number = _find([
        r"invoice\s*(?:#|no\.?|number)?\s*[:\-]?\s*([A-Z0-9\-/]+)",
        r"inv\s*[:\-]?\s*([A-Z0-9\-/]+)",
        r"bill\s*(?:#|no\.?)?\s*[:\-]?\s*([A-Z0-9\-/]+)",
    ], text)

    date = _find([
        r"(?:invoice\s+)?date\s*[:\-]?\s*([\d]{1,2}[\/\-\.][\d]{1,2}[\/\-\.][\d]{2,4})",
        r"(?:invoice\s+)?date\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})",
        r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b",
    ], text)

    total = _parse_amount(_find([
        r"(?:grand\s+)?total\s*(?:due|amount)?\s*[:\-]?\s*[\$£€]?\s*([\d,]+\.\d{2})",
        r"amount\s+due\s*[:\-]?\s*[\$£€]?\s*([\d,]+\.\d{2})",
        r"balance\s+due\s*[:\-]?\s*[\$£€]?\s*([\d,]+\.\d{2})",
    ], text))

    subtotal = _parse_amount(_find([
        r"sub\s*total\s*[:\-]?\s*[\$£€]?\s*([\d,]+\.\d{2})",
    ], text))

    tax = _parse_amount(_find([
        r"(?:tax|vat|gst|hst)\s*(?:\([\d.]+%\))?\s*[:\-]?\s*[\$£€]?\s*([\d,]+\.\d{2})",
    ], text))

    currency_m = re.search(r"(\$|£|€|USD|EUR|GBP|INR|CAD|AUD)", text)
    currency = currency_m.group(1) if currency_m else None

    vendor = _find([
        r"(?:from|vendor|seller|billed\s+by|company)\s*[:\-]\s*(.+)",
        r"^([A-Z][A-Za-z\s&.,]+(?:LLC|Inc|Ltd|Co|Corp|GmbH)[\.\,]?)",
    ], text)

    recipient = _find([
        r"(?:bill\s+to|to|client|customer|recipient)\s*[:\-]\s*(.+)",
    ], text)

    payment_method = _find([
        r"(?:payment\s+method|paid\s+via|pay\s+by)\s*[:\-]?\s*(.+)",
    ], text)

    items = _extract_items(text)

    notes = _find([
        r"(?:notes?|remarks?|comments?)\s*[:\-]\s*(.+)",
    ], text)

    return {
        "invoice_number": invoice_number,
        "date": date,
        "vendor": vendor,
        "recipient": recipient,
        "currency": currency,
        "subtotal": subtotal,
        "tax": tax,
        "total": total,
        "payment_method": payment_method,
        "items": items if items else None,
        "notes": notes,
        "raw_fields": _extract_all_key_values(text),
    }


def _extract_all_key_values(text: str) -> dict:
    """Catch-all: extract any 'Label: Value' pairs found in the document."""
    result = {}
    for m in re.finditer(r"^([A-Za-z][A-Za-z\s]{1,30})\s*[:\-]\s*(.+)$", text, re.MULTILINE):
        key = re.sub(r"\s+", "_", m.group(1).strip().lower())
        result[key] = m.group(2).strip()
    return result


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "ocr_engine": "tesseract", "parser": "rule-based"}


@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    image_bytes = await file.read()
    text = run_ocr(image_bytes, file.content_type or "image/jpeg")
    return {"text": text}


@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    allowed = {"image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")

    image_bytes = await file.read()
    ocr_text = run_ocr(image_bytes, file.content_type)

    if not ocr_text:
        raise HTTPException(status_code=422, detail="No text could be extracted from the image.")

    structured = ocr_text_to_json(ocr_text)
    return {"data": structured, "ocr_text": ocr_text}
