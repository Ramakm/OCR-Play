const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL ?? 'http://localhost:8000'

export interface ConvertResult {
  data: object
  ocr_text: string
}

export async function convertImageToJson(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ConvertResult> {
  const form = new FormData()
  const blob = new Blob([fileBuffer.buffer as ArrayBuffer], { type: mimeType })
  form.append('file', blob, fileName)

  let res: Response
  try {
    res = await fetch(`${OCR_SERVICE_URL}/convert`, { method: 'POST', body: form })
  } catch {
    throw new Error(
      `Cannot reach OCR service at ${OCR_SERVICE_URL}. Is it running? (cd ocr-service && uvicorn main:app)`
    )
  }

  if (!res.ok) {
    let detail = 'OCR service error'
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      detail = (await res.text().catch(() => '')) || detail
    }
    throw new Error(detail)
  }

  const body = await res.json()

  return body as ConvertResult
}
