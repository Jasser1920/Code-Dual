import React from 'react'
import { toast } from 'sonner'
import { X } from 'lucide-react'

export interface TerminalToastProps {
  title: string
  description?: React.ReactNode
  action?: { label: string; onClick: () => void }
  cancel?: { label: string; onClick: () => void }
  icon?: React.ReactNode
}

export const showTerminalToast = (
  titleOrProps: string | TerminalToastProps,
  descriptionArg?: React.ReactNode
) => {
  const { title, description, action, cancel, icon } =
    typeof titleOrProps === 'string'
      ? {
          title: titleOrProps,
          description: descriptionArg,
          action: undefined,
          cancel: undefined,
          icon: undefined,
        }
      : titleOrProps
  toast.custom(
    (t) => (
      <div className="bg-card border border-border text-foreground p-3.5 rounded-sm shadow-2xl w-[360px] font-['JetBrains_Mono'] relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-start gap-2.5">
          {icon && <div className="text-accent shrink-0 mt-0.5">{icon}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-['Barlow_Condensed'] font-extrabold uppercase tracking-widest text-sm text-foreground truncate">
                {title}
              </h4>
              <button
                onClick={() => toast.dismiss(t)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed break-words">
                {description}
              </div>
            )}
            {(action || cancel) && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                {action && (
                  <button
                    onClick={() => {
                      action.onClick()
                      toast.dismiss(t)
                    }}
                    className="px-3 py-1 bg-accent text-accent-foreground font-['Barlow_Condensed'] font-extrabold uppercase text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                  >
                    {action.label}
                  </button>
                )}
                {cancel && (
                  <button
                    onClick={() => {
                      cancel.onClick()
                      toast.dismiss(t)
                    }}
                    className="px-3 py-1 bg-secondary text-muted-foreground hover:text-foreground font-['Barlow_Condensed'] uppercase font-bold text-xs rounded-sm hover:bg-destructive/20 hover:text-destructive border border-border transition-colors cursor-pointer"
                  >
                    {cancel.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {/* 5-second countdown progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-secondary">
          <div className="h-full bg-accent animate-progress-5s" />
        </div>
      </div>
    ),
    { duration: 5000 }
  )
}
