"""
DeepSeek OCR microservice
- POST /ocr   → extract raw text from image using deepseek-ai/DeepSeek-OCR
- POST /convert → full pipeline: OCR text → structured JSON via DeepSeek chat API
"""

import os
import io
import json
import base64
import tempfile
import re

import torch
import requests
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModel, AutoTokenizer

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MODEL_NAME = "deepseek-ai/DeepSeek-OCR"
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_CHAT_URL = "https://api.deepseek.com/chat/completions"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ---------------------------------------------------------------------------
# Model (lazy-load on first request to keep startup fast)
# ---------------------------------------------------------------------------
_model = None
_tokenizer = None


def get_model():
    global _model, _tokenizer
    if _model is None:
        print(f"[OCR] Loading DeepSeek-OCR model on {DEVICE}...")
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
        load_kwargs = dict(trust_remote_code=True, use_safetensors=True)
        if DEVICE == "cuda":
            load_kwargs["_attn_implementation"] = "flash_attention_2"
        _model = AutoModel.from_pretrained(MODEL_NAME, **load_kwargs)
        _model = _model.eval()
        if DEVICE == "cuda":
            _model = _model.cuda().to(torch.bfloat16)
        print("[OCR] Model loaded.")
    return _model, _tokenizer


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="DeepSeek OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def run_ocr(image_bytes: bytes, mime_type: str) -> str:
    """Run DeepSeek-OCR on raw image bytes and return extracted text."""
    model, tokenizer = get_model()

    if mime_type == "application/pdf":
        # Convert first page of PDF to image via pdf2image
        try:
            from pdf2image import convert_from_bytes
        except ImportError:
            raise HTTPException(
                status_code=422,
                detail="pdf2image not installed. Run: pip install pdf2image poppler-utils",
            )
        pages = convert_from_bytes(image_bytes, first_page=1, last_page=1, dpi=200)
        img = pages[0]
    else:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Save to temp file (DeepSeek-OCR model.infer expects a file path)
    suffix = ".jpg" if mime_type != "image/png" else ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        img.save(tmp.name)
        tmp_path = tmp.name

    try:
        response = model.infer(
            tokenizer,
            prompt="<image>\nFree OCR.",
            image_file=tmp_path,
            base_size=1024,
            image_size=640,
            crop_mode=True,
        )
    finally:
        os.unlink(tmp_path)

    return response if isinstance(response, str) else str(response)


def ocr_text_to_json(ocr_text: str) -> dict:
    """Send OCR text to DeepSeek chat API and get back structured JSON."""
    if not DEEPSEEK_API_KEY:
        raise HTTPException(status_code=500, detail="DEEPSEEK_API_KEY not set")

    prompt = (
        "You are a document parser. The following is raw OCR text extracted from a document.\n"
        "Convert it into structured JSON.\n\n"
        "Rules:\n"
        "- Identify key fields: invoice_number, date, total, subtotal, tax, currency, vendor, recipient, "
        "payment_method, items (list with description, quantity, unit_price, total), notes\n"
        "- If a field is missing or unreadable, set it to null\n"
        "- Return ONLY valid JSON — no explanations, no markdown, no code blocks\n\n"
        f"OCR Text:\n{ocr_text}"
    )

    resp = requests.post(
        DEEPSEEK_CHAT_URL,
        headers={"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "max_tokens": 2048,
        },
        timeout=60,
    )
    resp.raise_for_status()

    raw = resp.json()["choices"][0]["message"]["content"].strip()
    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"DeepSeek returned invalid JSON: {e}")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "device": DEVICE}


@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    """Extract raw OCR text from an uploaded image."""
    image_bytes = await file.read()
    text = run_ocr(image_bytes, file.content_type or "image/jpeg")
    return {"text": text}


@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    """Full pipeline: image → OCR text → structured JSON."""
    allowed = {"image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")

    image_bytes = await file.read()
    ocr_text = run_ocr(image_bytes, file.content_type)
    structured = ocr_text_to_json(ocr_text)

    return {"data": structured, "ocr_text": ocr_text}
