'use client'

interface ImagePreviewProps {
  src: string
  name: string
  onClear: () => void
}

export default function ImagePreview({ src, name, onClear }: ImagePreviewProps) {
  const isPdf = name.toLowerCase().endsWith('.pdf')

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/60">
      {isPdf ? (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-slate-400">
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-sm font-medium">{name}</span>
          <span className="text-xs">PDF document ready</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Uploaded document"
          className="w-full max-h-72 object-contain bg-slate-900"
        />
      )}

      <button
        onClick={onClear}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/80 hover:bg-red-500/80 text-slate-400 hover:text-white transition-colors"
        title="Remove"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-700">
        <p className="text-xs text-slate-400 truncate">{name}</p>
      </div>
    </div>
  )
}
