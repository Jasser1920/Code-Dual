import { useState, useEffect } from 'react'
import { api } from '../../api/axios'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type Report = {
  id: string
  reporterId: string
  reportedId: string | null
  type: string
  description: string
  status: 'PENDING' | 'RESOLVED'
  createdAt: string
}

export default function ReportsManager() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchReports = async () => {
    try {
      const response = await api.get('/admin/reports')
      setReports(response.data.reports)
    } catch (error) {
      console.error('Failed to fetch reports', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleResolve = async (id: string) => {
    try {
      await api.put(`/admin/reports/${id}/resolve`)
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'RESOLVED' } : r))
      )
    } catch (error) {
      console.error('Failed to resolve report', error)
    }
  }

  if (isLoading)
    return (
      <div className="text-muted-foreground font-['JetBrains_Mono']">
        Loading reports...
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-widest uppercase text-foreground">
          Platform Reports
        </h1>
        <p className="text-muted-foreground font-['JetBrains_Mono'] text-sm">
          Active Tickets: {reports.filter((r) => r.status === 'PENDING').length}
        </p>
      </div>

      <div className="space-y-4">
        {reports.length === 0 && (
          <div className="p-8 border border-border bg-card text-center text-muted-foreground font-['JetBrains_Mono']">
            No reports found. The arena is quiet.
          </div>
        )}

        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-border bg-card p-4 rounded-sm flex flex-col md:flex-row gap-4 md:items-start justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {report.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-sm text-xs font-bold font-['JetBrains_Mono']">
                    <AlertCircle size={14} /> PENDING
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-sm text-xs font-bold font-['JetBrains_Mono']">
                    <CheckCircle2 size={14} /> RESOLVED
                  </span>
                )}
                <span className="font-['JetBrains_Mono'] text-sm text-accent font-bold">
                  [{report.type}]
                </span>
                <span className="text-xs text-muted-foreground font-['JetBrains_Mono']">
                  {new Date(report.createdAt).toLocaleString()}
                </span>
              </div>

              <p className="text-foreground text-sm font-['JetBrains_Mono']">
                {report.description}
              </p>

              <div className="text-xs text-muted-foreground font-['JetBrains_Mono'] pt-2">
                <div>Reporter ID: {report.reporterId}</div>
                {report.reportedId && (
                  <div>Reported User ID: {report.reportedId}</div>
                )}
              </div>
            </div>

            <div>
              {report.status === 'PENDING' && (
                <button
                  onClick={() => handleResolve(report.id)}
                  className="px-4 py-2 bg-accent text-white font-['Barlow_Condensed'] uppercase tracking-widest font-bold rounded-sm hover:bg-accent/80 transition-colors"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
