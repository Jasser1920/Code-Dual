import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  language: string
  code: string
  onChange: (value: string | undefined) => void
}

export function CodeEditor({ language, code, onChange }: CodeEditorProps) {
  return (
    <div className="flex-1 w-full h-full relative">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 16 },
        }}
        loading={
          <div className="flex items-center justify-center h-full text-muted-foreground font-['JetBrains_Mono'] text-xs animate-pulse">
            Loading Editor...
          </div>
        }
      />
    </div>
  )
}
