import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, X, CheckCircle2, Flag } from 'lucide-react'
import { api } from '../api/axios'

interface ReportModalProps {
  onClose: () => void
  reportedId?: string
  defaultType?: string
}

export default function ReportModal({
  onClose,
  reportedId,
  defaultType = 'General Bug',
}: ReportModalProps) {
  const [type, setType] = useState(defaultType)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setIsSubmitting(true)
    try {
      await api.post('/users/reports', {
        type,
        description,
        reportedId,
      })
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to submit report', error)
      alert('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-sm w-full max-w-lg overflow-hidden relative zoom-in-95 animate-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/50">
          <h2 className="font-['Barlow_Condensed'] font-bold text-2xl tracking-wider text-foreground flex items-center gap-2 uppercase">
            <Flag className="text-red-500" size={24} />
            Submit a Report
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="font-['Barlow_Condensed'] font-bold text-2xl uppercase tracking-widest text-foreground">
              Report Submitted
            </h3>
            <p className="font-['Barlow'] text-muted-foreground">
              Thank you for helping keep the arena clean. Our admins will review
              this shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
                Type of Report
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-sm p-3 text-foreground font-['JetBrains_Mono'] text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
              >
                {reportedId && (
                  <option value="Player Behavior">Player Behavior</option>
                )}
                <option value="Problem Issue">Problem Issue</option>
                <option value="General Bug">General Bug</option>
              </select>
            </div>

            {reportedId && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-sm flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5" />
                <div className="font-['JetBrains_Mono'] text-xs text-red-500">
                  <span className="font-bold">Target User ID:</span>{' '}
                  {reportedId}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-['JetBrains_Mono'] text-xs text-muted-foreground uppercase tracking-widest">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                className="w-full h-32 bg-black/40 border border-white/20 rounded-sm p-3 text-foreground font-['JetBrains_Mono'] text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all resize-none"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-border rounded-sm hover:bg-secondary/50 transition-colors font-['Barlow_Condensed'] uppercase font-bold tracking-widest text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors font-['Barlow_Condensed'] uppercase font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
