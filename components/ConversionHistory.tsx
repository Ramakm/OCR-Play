'use client'

export interface HistoryEntry {
  id: string
  fileName: string
  timestamp: Date
  data: object
}

interface ConversionHistoryProps {
  entries: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  activeId?: string
}

export default function ConversionHistory({ entries, onSelect, activeId }: ConversionHistoryProps) {
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent conversions</p>
      <div className="flex flex-col gap-1">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
              activeId === entry.id
                ? 'bg-indigo-500/20 border border-indigo-500/30'
                : 'bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{entry.fileName}</p>
              <p className="text-xs text-slate-500">
                {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {activeId === entry.id && (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
