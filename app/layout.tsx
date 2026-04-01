import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Image to JSON Converter',
  description: 'Convert invoice, receipt, and form images to structured JSON using Google Gemini AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
