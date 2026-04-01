'use client'

import { useState, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import ImagePreview from '@/components/ImagePreview'
import JsonViewer from '@/components/JsonViewer'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConversionHistory, { HistoryEntry } from '@/components/ConversionHistory'

type Status = 'idle' | 'loading' | 'success' | 'error'
type OutputTab = 'json' | 'ocr'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [jsonData, setJsonData] = useState<object | null>(null)
  const [ocrText, setOcrText] = useState<string>('')
  const [outputTab, setOutputTab] = useState<OutputTab>('json')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string>()

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setStatus('idle')
    setError('')
    setJsonData(null)
    setOcrText('')
    setActiveHistoryId(undefined)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }, [])

  const handleClear = () => {
    setFile(null)
    setPreview('')
    setStatus('idle')
    setError('')
    setJsonData(null)
    setOcrText('')
    setActiveHistoryId(undefined)
  }

  const handleConvert = async () => {
    if (!file) return
    setStatus('loading')
    setError('')
    setJsonData(null)
    setOcrText('')

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/convert', { method: 'POST', body: form })
      const body = await res.json()

      if (!res.ok) throw new Error(body.error || 'Conversion failed')

      setJsonData(body.data)
      setOcrText(body.ocr_text ?? '')
      setStatus('success')
      setOutputTab('json')

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        fileName: file.name,
        timestamp: new Date(),
        data: body.data,
      }
      setHistory((prev) => [entry, ...prev].slice(0, 5))
      setActiveHistoryId(entry.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  const handleHistorySelect = (entry: HistoryEntry) => {
    setJsonData(entry.data)
    setStatus('success')
    setActiveHistoryId(entry.id)
    setOutputTab('json')
  }

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-100">Image to JSON</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-medium border border-sky-500/20">
              Powered by DeepSeek OCR
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Extract JSON from any document
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Upload invoices, receipts, or forms. DeepSeek OCR extracts the text, then DeepSeek Chat structures it into clean JSON.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
          {/* Left panel */}
          <div className="flex flex-col gap-5">
            {/* Upload card */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col gap-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Upload Document</p>

              {!file ? (
                <UploadZone onFile={handleFile} disabled={status === 'loading'} />
              ) : (
                <ImagePreview src={preview} name={file.name} onClear={handleClear} />
              )}

              {file && (
                <button
                  onClick={handleConvert}
                  disabled={status === 'loading'}
                  className={`
                    w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${status === 'loading'
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-[0.98]'
                    }
                  `}
                >
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Running OCR...
                    </span>
                  ) : (
                    'Convert to JSON'
                  )}
                </button>
              )}

              {status === 'error' && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* Pipeline steps */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Pipeline</p>
              <div className="flex flex-col gap-2">
                {[
                  { step: '1', label: 'DeepSeek-OCR', desc: 'Extracts raw text from image', color: 'text-sky-400', bg: 'bg-sky-500/10' },
                  { step: '2', label: 'DeepSeek Chat', desc: 'Structures text into JSON', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                ].map(({ step, label, desc, color, bg }) => (
                  <div key={step} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${bg}`}>
                    <span className={`w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold ${color}`}>
                      {step}
                    </span>
                    <div>
                      <p className={`text-xs font-semibold ${color}`}>{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
                <ConversionHistory
                  entries={history}
                  onSelect={handleHistorySelect}
                  activeId={activeHistoryId}
                />
              </div>
            )}

            {/* Tag pills */}
            <div className="flex flex-wrap gap-2">
              {['Invoices', 'Receipts', 'Forms', 'Contracts', 'Medical docs'].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-400 text-xs border border-slate-700/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 min-h-[480px] flex flex-col">
            {status === 'loading' && <LoadingSpinner />}

            {status !== 'loading' && !jsonData && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Output will appear here</p>
                  <p className="text-xs text-slate-600 mt-1">Upload a document and click Convert</p>
                </div>
              </div>
            )}

            {status === 'success' && jsonData && (
              <div className="flex flex-col gap-4 flex-1">
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl w-fit">
                  {(['json', 'ocr'] as OutputTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setOutputTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        outputTab === tab
                          ? 'bg-slate-700 text-slate-100'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab === 'json' ? 'Structured JSON' : 'Raw OCR Text'}
                    </button>
                  ))}
                </div>

                {outputTab === 'json' && (
                  <JsonViewer data={jsonData} onDataChange={setJsonData} />
                )}

                {outputTab === 'ocr' && (
                  <div className="flex flex-col gap-3 flex-1">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Raw OCR Text</p>
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 overflow-auto max-h-[500px]">
                      <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {ocrText || '(no OCR text captured)'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
