You are an expert full-stack engineer and AI product builder.

Your task is to build a complete MVP SaaS web app called **"Image to JSON Converter"**.

🎯 Goal

Users can upload images (documents like invoices, receipts, forms), and the app converts them into structured JSON using Google Gemini. Users can view, edit, and download the JSON.

---

🧩 Requirements

1. Frontend (Next.js + Tailwind)

* Clean, modern UI
* Drag & drop upload area
* Show uploaded image preview
* "Convert to JSON" button
* Loading state while processing
* Display JSON output in formatted viewer
* Buttons:

  * Copy JSON
  * Download JSON file
* Error handling (invalid file, API errors)

---

2. Backend (Next.js API Routes preferred)

* Endpoint: `/api/convert`
* Accept image file upload (multipart/form-data)
* Validate file type (png, jpg, jpeg, pdf)
* Convert file → base64

---

3. AI Processing (Gemini)

Use Google Gemini API (gemini-1.5-flash or latest multimodal model).

* Send image as base64
* Use structured prompt

#### Prompt to Gemini:

"You are a document parser. Extract structured data from the document and return ONLY valid JSON.

Rules:

* Identify key fields like invoice_number, date, total, vendor, items
* If data is missing, return null
* No explanations
* Strict JSON output"

---

4. Gemini Integration Details

* Use official Google Generative AI SDK (`@google/generative-ai`)
* Initialize with API key
* Use `generateContent` with image + text prompt
* Ensure response parsing extracts only JSON

---

5. Response Handling

* Clean Gemini response (remove markdown if present)
* Parse safely into JSON
* Handle invalid JSON errors gracefully

---

### 6. Download Feature

* Allow user to download JSON as `.json` file
* Filename: `output.json`

---

7. Project Structure

* Clear modular structure:

  * `/app`
  * `/components`
  * `/lib/gemini.ts`
  * `/api/convert/route.ts`
* Reusable components

---

### 8. Bonus (if possible)

* Editable JSON before download
* Store last 5 conversions (local state)
* Simple loading animation

---

## ⚙️ Tech Stack

* Next.js (App Router)
* Tailwind CSS
* Google Gemini API
* No database required for MVP

---

## 🔐 Environment Variables

* GEMINI_API_KEY

---

## 🚀 Output Expectations

* Generate full working code
* Include:

  * Frontend UI
  * API route
  * Gemini integration utility
* Provide setup instructions:

  * Install dependencies
  * Add API key
  * Run locally

---

## ⚠️ Rules

* Keep code clean and production-ready
* Avoid unnecessary complexity
* Ensure everything works end-to-end
* Return only essential explanations

---

Now generate the complete project.
