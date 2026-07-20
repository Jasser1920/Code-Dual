import { useState, useEffect } from 'react'
import { api } from '../../api/axios'
import { Plus, Trash2, Edit, Code2, Save, X } from 'lucide-react'
import { cn } from '../../components/ui/utils'

type Problem = {
  id: string
  title: string
  difficulty: string
  tags: string[]
  createdAt: string
  // Full details
  description?: string
  examples?: any[]
  constraints?: string[]
  visibleTests?: any[]
  hiddenTests?: any[]
}

export default function ProblemsManager() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'Easy',
    tags: '',
    description: '',
    examples: '[]',
    constraints: '[]',
    visibleTests: '[]',
    hiddenTests: '[]',
  })

  const fetchProblems = async () => {
    try {
      const response = await api.get('/admin/problems')
      setProblems(response.data.problems)
    } catch (error) {
      console.error('Failed to fetch problems', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProblems()
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      await api.delete(`/admin/problems/${id}`)
      setProblems((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Failed to delete problem', error)
    }
  }

  const openModalForNew = () => {
    setEditingId(null)
    setFormData({
      title: '',
      difficulty: 'Easy',
      tags: '',
      description: '',
      examples: '[]',
      constraints: '[]',
      visibleTests: '[]',
      hiddenTests: '[]',
    })
    setIsModalOpen(true)
  }

  const openModalForEdit = (problem: Problem) => {
    setEditingId(problem.id)
    setFormData({
      title: problem.title,
      difficulty: problem.difficulty,
      tags: problem.tags.join(', '),
      description: problem.description || '',
      examples: JSON.stringify(problem.examples || [], null, 2),
      constraints: JSON.stringify(problem.constraints || [], null, 2),
      visibleTests: JSON.stringify(problem.visibleTests || [], null, 2),
      hiddenTests: JSON.stringify(problem.hiddenTests || [], null, 2),
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) return alert('Error: Title is required.')
    if (!formData.tags.trim()) return alert('Error: Tags are required.')
    if (!formData.description.trim())
      return alert('Error: Description is required.')
    if (!formData.examples.trim() || formData.examples === '[]')
      return alert('Error: Examples are required.')
    if (!formData.constraints.trim() || formData.constraints === '[]')
      return alert('Error: Constraints are required.')

    let parsedExamples, parsedConstraints, parsedVisible, parsedHidden

    try {
      parsedExamples = JSON.parse(formData.examples)
    } catch (e) {
      return alert('Error: Invalid JSON format in "Examples" field.')
    }

    try {
      parsedConstraints = JSON.parse(formData.constraints)
    } catch (e) {
      return alert('Error: Invalid JSON format in "Constraints" field.')
    }

    try {
      parsedVisible = JSON.parse(formData.visibleTests || '[]')
    } catch (e) {
      return alert('Error: Invalid JSON format in "Visible Tests" field.')
    }

    try {
      parsedHidden = JSON.parse(formData.hiddenTests || '[]')
    } catch (e) {
      return alert('Error: Invalid JSON format in "Hidden Tests" field.')
    }

    try {
      const payload = {
        title: formData.title,
        difficulty: formData.difficulty,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        description: formData.description,
        examples: parsedExamples,
        constraints: parsedConstraints,
        visibleTests: parsedVisible,
        hiddenTests: parsedHidden,
      }

      if (editingId) {
        await api.put(`/admin/problems/${editingId}`, payload)
      } else {
        await api.post('/admin/problems', payload)
      }

      setIsModalOpen(false)
      fetchProblems()
    } catch (error) {
      alert(
        'Failed to save to server. Please check the network or server logs.'
      )
      console.error('Save error', error)
    }
  }

  if (isLoading)
    return (
      <div className="text-muted-foreground font-['JetBrains_Mono']">
        Loading problems...
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-widest uppercase text-foreground">
            Problem Manager
          </h1>
          <p className="text-muted-foreground font-['JetBrains_Mono'] text-sm">
            Total Problems: {problems.length}
          </p>
        </div>
        <button
          onClick={openModalForNew}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-sm font-['Barlow_Condensed'] uppercase tracking-widest font-bold hover:bg-accent/80 transition-colors"
        >
          <Plus size={18} /> New Problem
        </button>
      </div>

      <div className="border border-border bg-card rounded-sm overflow-hidden">
        <table className="w-full text-left font-['JetBrains_Mono'] text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Difficulty</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {problems.map((problem) => (
              <tr
                key={problem.id}
                className="hover:bg-secondary/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-bold text-foreground">
                    {problem.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {problem.id.slice(0, 8)}...
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-bold rounded-sm',
                      problem.difficulty === 'Easy'
                        ? 'text-green-400 bg-green-400/10'
                        : problem.difficulty === 'Medium'
                          ? 'text-yellow-400 bg-yellow-400/10'
                          : 'text-red-400 bg-red-400/10'
                    )}
                  >
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-secondary px-1.5 py-0.5 rounded-sm border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openModalForEdit(problem)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-sm transition-colors"
                      title="Edit Problem"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(problem.id, problem.title)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
                      title="Delete Problem"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {problems.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No problems found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col rounded-sm shadow-2xl">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center z-10">
              <h2 className="font-['Barlow_Condensed'] uppercase tracking-widest text-xl font-bold text-foreground">
                {editingId ? 'Edit Problem' : 'Create New Problem'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-secondary/50 rounded-sm text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6 font-['JetBrains_Mono'] text-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase">
                    Title
                  </label>
                  <input
                    className="w-full bg-black/40 border border-white/30 rounded-sm p-2 text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 uppercase">
                      Difficulty
                    </label>
                    <select
                      className="w-full bg-black/40 border border-white/30 rounded-sm p-2 text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      value={formData.difficulty}
                      onChange={(e) =>
                        setFormData({ ...formData, difficulty: e.target.value })
                      }
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 uppercase">
                      Tags (comma separated)
                    </label>
                    <input
                      className="w-full bg-black/40 border border-white/30 rounded-sm p-2 text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData({ ...formData, tags: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase">
                    Description (Markdown)
                  </label>
                  <textarea
                    className="w-full h-64 bg-black/40 border border-white/30 rounded-sm p-2 text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase">
                    Examples (JSON Array)
                  </label>
                  <textarea
                    className="w-full h-24 bg-black/40 border border-white/30 rounded-sm p-2 text-foreground font-mono text-xs focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    value={formData.examples}
                    onChange={(e) =>
                      setFormData({ ...formData, examples: e.target.value })
                    }
                    placeholder='[{"input": "nums=[2,7]", "output": "[0,1]", "explanation": "..."}]'
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase">
                    Constraints (JSON Array)
                  </label>
                  <textarea
                    className="w-full h-24 bg-black/40 border border-white/30 rounded-sm p-2 text-foreground font-mono text-xs focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    value={formData.constraints}
                    onChange={(e) =>
                      setFormData({ ...formData, constraints: e.target.value })
                    }
                    placeholder='["2 <= nums.length <= 10^4"]'
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase">
                    Visible Tests (JSON Array)
                  </label>
                  <textarea
                    className="w-full h-24 bg-black/40 border border-white/30 rounded-sm p-2 text-foreground font-mono text-xs focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    value={formData.visibleTests}
                    onChange={(e) =>
                      setFormData({ ...formData, visibleTests: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 uppercase">
                    Hidden Tests (JSON Array)
                  </label>
                  <textarea
                    className="w-full h-24 bg-black/40 border border-white/30 rounded-sm p-2 text-foreground font-mono text-xs focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                    value={formData.hiddenTests}
                    onChange={(e) =>
                      setFormData({ ...formData, hiddenTests: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4 bg-secondary/30 flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-border rounded-sm hover:bg-secondary transition-colors font-['Barlow_Condensed'] uppercase font-bold tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-accent text-white rounded-sm hover:bg-accent/80 transition-colors font-['Barlow_Condensed'] uppercase font-bold tracking-widest flex items-center gap-2"
              >
                <Save size={16} /> Save Problem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
