import * as React from 'react'

import { cn } from './utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-accent selection:text-accent-foreground flex h-9 w-full min-w-0 rounded-none border-2 border-indigo-foreground/50 bg-background/80 px-3 py-1 text-base text-foreground transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-accent focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_hsl(var(--accent))] hover:border-foreground/70',
        'aria-invalid:border-destructive aria-invalid:shadow-[4px_4px_0px_0px_hsl(var(--destructive))]',
        className
      )}
      {...props}
    />
  )
}

export { Input }
