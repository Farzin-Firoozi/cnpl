import type { HistoryEntry } from '../store/history'

interface HistoryPanelProps {
  history: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onClear: () => void
  onClose: () => void
}

export function HistoryPanel({
  history,
  onSelect,
  onClear,
  onClose,
}: HistoryPanelProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-black/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 pt-6 pb-2">
        <span className="text-lg font-semibold text-white">History</span>
        <button
          type="button"
          className="rounded-full px-3 py-1 duration-100 transition-all text-sm text-orange-500 hover:bg-white/10 cursor-pointer active:scale-95"
          onClick={onClose}
        >
          Done
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {history.length === 0 ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            No calculations yet
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-end gap-0.5 py-3 text-right hover:bg-white/5 duration-100 transition-all cursor-pointer active:scale-95"
                  onClick={() => onSelect(entry)}
                >
                  <span className="truncate text-sm text-zinc-500">
                    {entry.expression}
                  </span>
                  <span className="truncate text-xl text-white">
                    = {entry.result}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {history.length > 0 && (
        <button
          type="button"
          className="m-4 rounded-xl bg-white/10 py-3 text-sm text-red-400 hover:bg-white/15"
          onClick={onClear}
        >
          Clear history
        </button>
      )}
    </div>
  )
}
