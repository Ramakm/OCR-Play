export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-400 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-200">Running OCR pipeline...</p>
        <p className="text-xs text-slate-500 mt-1">Tesseract OCR → Rule-based Parser → JSON</p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
