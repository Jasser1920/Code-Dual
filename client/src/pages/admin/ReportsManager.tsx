import { useState, useEffect } from 'react'
import { api } from '../../api/axios'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type Report = {
  id: string
  reporterId: string
  reportedId: string | null
  type: string
  description: string
  status: 'PENDING' | 'HANDLING' | 'REJECTED' | 'RESOLVED'
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

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.put(`/admin/reports/${id}/status`, { status })
      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: status as Report['status'] } : r
        )
      )
    } catch (error) {
      console.error('Failed to update report status', error)
      alert('Failed to update report status')
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
                {report.status === 'PENDING' && (
                  <span className="inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-sm text-xs font-bold font-['JetBrains_Mono']">
                    <AlertCircle size={14} /> PENDING
                  </span>
                )}
                {report.status === 'HANDLING' && (
                  <span className="inline-flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-sm text-xs font-bold font-['JetBrains_Mono']">
                    <AlertCircle size={14} /> HANDLING
                  </span>
                )}
                {report.status === 'RESOLVED' && (
                  <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-sm text-xs font-bold font-['JetBrains_Mono']">
                    <CheckCircle2 size={14} /> RESOLVED
                  </span>
                )}
                {report.status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-sm text-xs font-bold font-['JetBrains_Mono']">
                    <AlertCircle size={14} /> REJECTED
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
                  <div className="mt-1 inline-flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-sm font-bold">
                    Target User ID: {report.reportedId}
                  </div>
                )}
              </div>
            </div>

            <div>
              <select
                value={report.status}
                onChange={(e) => handleStatusUpdate(report.id, e.target.value)}
                className="bg-black/40 border border-white/20 rounded-sm p-2 text-foreground font-['JetBrains_Mono'] text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none cursor-pointer"
              >
                <option value="PENDING">PENDING</option>
                <option value="HANDLING">HANDLING</option>
                <option value="REJECTED">REJECTED</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
