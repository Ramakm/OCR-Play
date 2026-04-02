# Image to JSON Converter

Convert invoices, receipts, and forms into structured JSON — fully local, no external API required.

**Stack:** Next.js 14 + Tailwind CSS (frontend) · FastAPI + Tesseract OCR + Rule-based Parser (backend)

---

## Quick Start

### 1. Frontend (Next.js)

```bash
cd OCR-Play
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### 2. OCR Service (FastAPI)

```bash
cd OCR-Play/ocr-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

> **Requires Tesseract** — install via Homebrew: `brew install tesseract`

---

## Requirements

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| Python | 3.10+ |
| Tesseract | 5.x (`brew install tesseract`) |

---

## Environment Variables

### `/OCR-Play/.env`
```
OCR_SERVICE_URL=http://localhost:8000
```

### `/OCR-Play/ocr-service/.env`
```
# Optional — only needed if you re-enable an LLM-based parser
DEEPSEEK_API_KEY=your_key_here
```

---

## Features

- Drag & drop upload (PNG, JPG, WEBP, PDF — max 10 MB)
- Tesseract OCR extracts raw text from the image
- Rule-based parser structures the text into JSON fields:
  `invoice_number`, `date`, `vendor`, `recipient`, `currency`, `subtotal`, `tax`, `total`, `payment_method`, `items`, `notes`, `raw_fields`
- Syntax-highlighted JSON viewer
- Editable JSON before download
- Copy to clipboard / Download as `output.json`
- Raw OCR text tab to inspect extracted text
- Last 5 conversions history (in-memory)

---

## Project Structure

```
OCR-Play/
├── app/
│   ├── page.tsx                  # Main UI page
│   ├── layout.tsx                # Root layout
│   └── api/convert/route.ts      # Next.js API route — proxies to OCR service
├── components/
│   ├── UploadZone.tsx            # Drag & drop file input
│   ├── ImagePreview.tsx          # Uploaded image preview
│   ├── JsonViewer.tsx            # Editable JSON display
│   ├── ConversionHistory.tsx     # Last 5 conversions sidebar
│   └── LoadingSpinner.tsx        # Animated loading state
├── lib/
│   └── deepseek.ts               # HTTP client — calls OCR service
├── ocr-service/
│   ├── main.py                   # FastAPI app — OCR + JSON extraction
│   └── requirements.txt          # Python dependencies
└── .env                          # OCR_SERVICE_URL
```

---

## How It Works

```
Browser → POST /api/convert (Next.js)
       → POST /convert (FastAPI :8000)
       → Tesseract OCR → raw text
       → Rule-based parser → structured JSON
       → Response back to UI
```
