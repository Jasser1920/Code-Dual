// Mock problem type
export interface Problem {
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
}

export function ProblemPanel({ problem }: { problem: Problem }) {
  const getDiffColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'text-green-500'
      case 'Medium':
        return 'text-yellow-500'
      case 'Hard':
        return 'text-red-500'
      default:
        return 'text-foreground'
    }
  }

  return (
    <div className="h-full bg-card overflow-y-auto p-6 border-r border-border custom-scrollbar">
      <div className="mb-6">
        <h1 className="font-['Barlow_Condensed'] font-extrabold text-3xl uppercase tracking-wider text-foreground">
          {problem.title}
        </h1>
        <div
          className={`font-['JetBrains_Mono'] text-xs mt-2 ${getDiffColor(problem.difficulty)}`}
        >
          {problem.difficulty}
        </div>
      </div>

      <div className="prose prose-invert prose-sm max-w-none font-['Barlow'] text-muted-foreground mb-8">
        <p>{problem.description}</p>
      </div>

      <div className="space-y-6">
        {problem.examples.map((ex, idx) => (
          <div key={idx}>
            <h3 className="font-['Barlow_Condensed'] font-bold text-foreground text-lg mb-2">
              Example {idx + 1}:
            </h3>
            <div className="bg-secondary/30 rounded p-4 border border-border/50 font-['JetBrains_Mono'] text-xs text-foreground/80 space-y-2">
              <div>
                <span className="text-muted-foreground font-bold">Input:</span>{' '}
                {ex.input}
              </div>
              <div>
                <span className="text-muted-foreground font-bold">Output:</span>{' '}
                {ex.output}
              </div>
              {ex.explanation && (
                <div>
                  <span className="text-muted-foreground font-bold">
                    Explanation:
                  </span>{' '}
                  {ex.explanation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="font-['Barlow_Condensed'] font-bold text-foreground text-lg mb-2">
          Constraints:
        </h3>
        <ul className="list-disc list-inside font-['JetBrains_Mono'] text-xs text-muted-foreground space-y-1">
          {problem.constraints.map((constraint, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: constraint }} />
          ))}
        </ul>
      </div>
    </div>
  )
}
