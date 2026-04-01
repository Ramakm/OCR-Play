# Image to JSON Converter

Convert invoices, receipts, and forms into structured JSON using Google Gemini AI.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini API key
cp .env.local.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_key_here

# 3. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features
- Drag & drop upload (PNG, JPG, WEBP, PDF — max 10 MB)
- Gemini 1.5 Flash extracts structured JSON
- Syntax-highlighted JSON viewer
- Editable JSON before download
- Copy to clipboard / Download as `output.json`
- Last 5 conversions history (in-memory)
