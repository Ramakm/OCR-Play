'use client'

import { useCallback, useState } from 'react'

interface UploadZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export default function UploadZone({ onFile, disabled }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [disabled, onFile]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    e.target.value = ''
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-3
        w-full min-h-[180px] rounded-2xl border-2 border-dashed
        transition-all duration-200 cursor-pointer select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${dragging
          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
          : 'border-slate-600 bg-slate-800/40 hover:border-indigo-500 hover:bg-indigo-500/5'
        }
      `}
    >
      <input
        type="file"
        className="sr-only"
        accept=".png,.jpg,.jpeg,.webp,.pdf"
        onChange={handleChange}
        disabled={disabled}
      />

      <div className={`p-3 rounded-xl ${dragging ? 'bg-indigo-500/20' : 'bg-slate-700/50'}`}>
        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-slate-200">
          {dragging ? 'Drop it here!' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP, PDF — max 10 MB</p>
      </div>
    </label>
  )
}
