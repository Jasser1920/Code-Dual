import React from 'react'
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface RunPanelProps {
  onRun: () => void
  onSubmit: () => void
  isRunning: boolean
  result: any
}

export function RunPanel({
  onRun,
  onSubmit,
  isRunning,
  result,
}: RunPanelProps) {
  return (
    <div className="h-48 bg-secondary/20 border-t border-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <span className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
          Console
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-1.5 rounded font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            Run Code
          </button>
          <button
            onClick={onSubmit}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded font-['Barlow_Condensed'] font-bold uppercase tracking-wider text-sm transition-colors shadow-[0_0_10px_rgba(34,197,94,0.3)]"
          >
            Submit Final
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 font-['JetBrains_Mono'] text-xs overflow-y-auto custom-scrollbar">
        {!result ? (
          <div className="text-muted-foreground/50 h-full flex items-center justify-center">
            Run your code to see the output here.
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 text-sm font-bold ${result.success ? 'text-green-500' : 'text-destructive'}`}
            >
              {result.success ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {result.status}
            </div>

            {result.output && (
              <div>
                <span className="text-muted-foreground">Output:</span>
                <pre className="mt-1 p-2 bg-black/40 rounded text-foreground/80 whitespace-pre-wrap">
                  {result.output}
                </pre>
              </div>
            )}

            {result.expected && (
              <div>
                <span className="text-muted-foreground">Expected:</span>
                <pre className="mt-1 p-2 bg-black/40 rounded text-foreground/80 whitespace-pre-wrap">
                  {result.expected}
                </pre>
              </div>
            )}

            <div className="text-muted-foreground flex gap-4 mt-2 border-t border-border/50 pt-2">
              <span>
                Time: <span className="text-foreground">{result.time}</span>
              </span>
              <span>
                Memory: <span className="text-foreground">{result.memory}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
