# Project Understanding — Image to JSON Converter

## What This Project Does

Users upload a document image (invoice, receipt, form) through a web UI. The app extracts text from the image using Tesseract OCR, then parses the raw text into structured JSON fields using a rule-based extractor. The resulting JSON can be viewed, edited, copied, or downloaded.

---

## Architecture

```
┌─────────────────────────────────┐
│         Browser (port 3000)     │
│  Next.js 14 + Tailwind CSS      │
│  - Drag & drop upload           │
│  - Image preview                │
│  - JSON viewer / editor         │
│  - Conversion history           │
└────────────┬────────────────────┘
             │ POST /api/convert (multipart/form-data)
             ▼
┌─────────────────────────────────┐
│   Next.js API Route             │
│   app/api/convert/route.ts      │
│   - Validates file type & size  │
│   - Forwards to OCR service     │
└────────────┬────────────────────┘
             │ POST /convert (multipart/form-data)
             ▼
┌─────────────────────────────────┐
│   FastAPI OCR Service (port 8000)│
│   ocr-service/main.py           │
│                                 │
│   1. Tesseract OCR              │
│      PIL opens image → pytesseract.image_to_string()
│                                 │
│   2. Rule-based JSON parser     │
│      Regex patterns extract:    │
│      invoice_number, date,      │
│      vendor, recipient,         │
│      currency, subtotal, tax,   │
│      total, payment_method,     │
│      items[], notes,            │
│      raw_fields (catch-all)     │
└─────────────────────────────────┘
```

---

## Key Files and Their Roles

| File | Role |
|---|---|
| `app/page.tsx` | Main page — manages all state, handles upload → convert flow |
| `app/api/convert/route.ts` | Next.js API route — validates input, delegates to `lib/deepseek.ts` |
| `lib/deepseek.ts` | HTTP client — POSTs file to FastAPI service, handles errors |
| `ocr-service/main.py` | FastAPI app — OCR pipeline + JSON extraction logic |
| `components/UploadZone.tsx` | Drag & drop file input with file type validation |
| `components/JsonViewer.tsx` | Syntax-highlighted, editable JSON output panel |
| `components/ConversionHistory.tsx` | In-memory history of last 5 conversions |

---

## Data Flow in Detail

### Frontend State (page.tsx)

```
file (File)         → set on upload
preview (string)    → base64 data URL for image display
status              → 'idle' | 'loading' | 'success' | 'error'
jsonData (object)   → structured JSON returned from API
ocrText (string)    → raw OCR text returned from API
history[]           → last 5 HistoryEntry objects (in-memory)
```

### API Route (route.ts)

- Accepts `multipart/form-data` with a `file` field
- Validates: file present, size ≤ 10 MB, type in `{png, jpg, jpeg, webp, pdf}`
- Passes buffer + filename + MIME type to `convertImageToJson()`
- Returns `{ data, ocr_text }` on success, `{ error }` on failure

### OCR Service (main.py)

**Step 1 — OCR (`run_ocr`)**
- PDF: uses `pdf2image` to rasterise page 1 at 200 DPI, then OCR
- Image: opens with Pillow, converts to RGB, runs `pytesseract.image_to_string()`
- Returns raw text string

**Step 2 — JSON Extraction (`ocr_text_to_json`)**
- Each field uses a prioritised list of regex patterns tried in order
- `_parse_amount()` strips currency symbols and converts to float
- `_extract_items()` scans lines for description + monetary amounts pattern
- `_extract_all_key_values()` is a catch-all that extracts any `Label: Value` pairs into `raw_fields`

---

## OCR Extracted Fields

| Field | How Detected |
|---|---|
| `invoice_number` | Keywords: `invoice #`, `inv:`, `bill no` |
| `date` | Keywords: `date:`, or bare date patterns `dd/mm/yyyy` |
| `vendor` | Keywords: `from:`, `vendor:`, or company name suffix (LLC, Inc, Ltd) |
| `recipient` | Keywords: `bill to:`, `client:`, `customer:` |
| `currency` | Symbol scan: `$`, `£`, `€`, or codes `USD`, `EUR`, `GBP`, etc. |
| `subtotal` | Keyword: `subtotal:` |
| `tax` | Keywords: `tax`, `vat`, `gst`, `hst` |
| `total` | Keywords: `total`, `amount due`, `balance due` |
| `payment_method` | Keywords: `payment method:`, `paid via:` |
| `items` | Lines containing a description + one or more money amounts |
| `notes` | Keywords: `notes:`, `remarks:`, `comments:` |
| `raw_fields` | All `Label: Value` lines not matched above |

---

## Environment Configuration

| Variable | File | Purpose |
|---|---|---|
| `OCR_SERVICE_URL` | `.env` | URL the Next.js API route calls (default: `http://localhost:8000`) |
| `DEEPSEEK_API_KEY` | `ocr-service/.env` | Only needed if switching to an LLM-based parser |

---

## Dependencies

### Frontend
| Package | Purpose |
|---|---|
| `next@14` | App Router, API routes, SSR |
| `tailwindcss` | Utility-first styling |

### OCR Service (Python)
| Package | Purpose |
|---|---|
| `fastapi` | REST API framework |
| `uvicorn` | ASGI server |
| `pytesseract` | Python wrapper for Tesseract OCR engine |
| `Pillow` | Image loading and preprocessing |
| `python-multipart` | Multipart file upload parsing |
| `pdf2image` | PDF → image conversion (optional, for PDF uploads) |

---

## Known Limitations

- **OCR accuracy** depends on image quality — blurry or low-contrast scans will produce poor text
- **Rule-based parser** works best on structured documents (invoices, receipts) with consistent labels; freeform documents may only populate `raw_fields`
- **PDF support** requires `poppler` installed: `brew install poppler`
- **No persistence** — conversion history is in-memory only, cleared on page refresh
- **Single page** — no authentication, no database, no multi-user support (MVP scope)

---

## How to Extend

**Swap in an LLM parser** — replace `ocr_text_to_json()` in `main.py` with an Ollama/Gemini/OpenAI call for smarter field extraction on complex documents.

**Add persistence** — store conversions in SQLite or a JSON file; load history on page mount.

**Improve OCR pre-processing** — add image sharpening, contrast enhancement, or deskewing with Pillow before passing to Tesseract to improve accuracy on low-quality scans.
