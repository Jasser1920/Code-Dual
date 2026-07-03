export function LanguageSelector({
  language,
  setLanguage,
  disabled,
}: {
  language: string
  setLanguage: (lang: string) => void
  disabled?: boolean
}) {
  const languages = ['javascript', 'python', 'java', 'cpp', 'go', 'rust']

  return (
    <div className="flex items-center gap-2">
      <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
        Language:
      </label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={disabled}
        className="bg-secondary/50 text-foreground border border-border rounded px-2 py-1 font-['JetBrains_Mono'] text-xs uppercase focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  )
}
