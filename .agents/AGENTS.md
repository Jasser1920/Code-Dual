# UI and Design Rules

When developing frontend components for Code-Dual, adhere STRICTLY to the following design constraints to maintain consistency with the existing hacker/terminal aesthetic:

1. **Strict Color Palette:**
   - NEVER use arbitrary glowing neon colors (e.g., `bg-cyan-500/10` or `text-cyan-400`).
   - ONLY use standard Shadcn/Tailwind CSS variables (`bg-background`, `bg-card`, `bg-secondary`, `bg-accent`, `text-foreground`, `text-muted-foreground`, `text-accent`, `border-border`).
2. **Typography Constraints:**
   - Use `font-['Barlow_Condensed']` (uppercase, `tracking-widest`) exclusively for titles, headers, and major buttons.
   - Use `font-['JetBrains_Mono']` exclusively for monospace text, code blocks, secondary labels, and data points.
3. **No Glows or Heavy Shadows:**
   - AVOID large drop shadows or box shadows (`shadow-[0_0_30px_...]`). The UI should remain flat and stark.
4. **Minimalist Borders and Corners:**
   - Rely heavily on thin flat borders (`border border-border`).
   - Avoid heavily rounded corners (`rounded-xl` or `rounded-full`). Use `rounded-sm` or square corners where possible (unless specifically making a small badge/pill).
5. **No "Flashy" or "Bright" Theme Elements:**
   - The theme is a raw, competitive coding arena. Avoid adding gratuitous gradients, flashing colorful lights, or bright background washes unless explicitly requested by the user.
