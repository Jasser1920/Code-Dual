import { useState, useEffect } from 'react'
import { api } from '../../api/axios'
import { Ban, Trash2, CheckCircle2, ShieldCheck, Mail, X } from 'lucide-react'

type User = {
  id: string
  username: string
  email: string
  elo: number
  rankTier: string
  emailVerified: boolean
  createdAt: string
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [profileDetails, setProfileDetails] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data.users)
    } catch (error) {
      console.error('Failed to fetch users', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: string, username: string) => {
    if (
      !window.confirm(
        `Are you absolutely sure you want to permanently delete user @${username}?`
      )
    )
      return

    try {
      await api.delete(`/admin/users/${id}`)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (error) {
      console.error('Failed to delete user', error)
    }
  }

  if (isLoading)
    return (
      <div className="text-muted-foreground font-['JetBrains_Mono']">
        Loading users...
      </div>
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Barlow_Condensed'] tracking-widest uppercase text-foreground">
          User Management
        </h1>
        <p className="text-muted-foreground font-['JetBrains_Mono'] text-sm">
          Total Users: {users.length}
        </p>
      </div>

      <div className="border border-border bg-card rounded-sm overflow-hidden">
        <table className="w-full text-left font-['JetBrains_Mono'] text-sm">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Stats</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-secondary/20 transition-colors cursor-pointer"
                onClick={async () => {
                  setSelectedUser(user)
                  setIsLoadingProfile(true)
                  try {
                    const res = await api.get(`/users/profile/${user.username}`)
                    setProfileDetails(res.data)
                  } catch (err) {
                    console.error('Failed to fetch profile', err)
                  } finally {
                    setIsLoadingProfile(false)
                  }
                }}
              >
                <td className="px-4 py-3">
                  <div className="font-bold text-foreground">
                    @{user.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {user.id.slice(0, 8)}...
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground" />
                    {user.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-accent font-bold">{user.elo}</span>{' '}
                    ELO
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.rankTier}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-sm text-xs">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-sm text-xs">
                      <AlertTriangle size={12} /> Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(user.id, user.username)
                    }}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
                    title="Ban / Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col rounded-sm shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex justify-between items-center z-10">
              <h2 className="font-['Barlow_Condensed'] uppercase tracking-widest text-xl font-bold text-foreground">
                Profile: @{selectedUser.username}
              </h2>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setProfileDetails(null)
                }}
                className="p-2 hover:bg-secondary/50 rounded-sm transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 font-['JetBrains_Mono']">
              {isLoadingProfile ? (
                <div className="text-muted-foreground">
                  Loading deep intel...
                </div>
              ) : profileDetails ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-border p-4 bg-secondary/10">
                      <div className="text-xs text-muted-foreground uppercase mb-1">
                        Rank & ELO
                      </div>
                      <div className="text-lg font-bold text-accent">
                        {profileDetails.profile.rating}
                      </div>
                      <div className="text-sm">{selectedUser.rankTier}</div>
                      <div className="text-xs text-muted-foreground">
                        Global Rank: #{profileDetails.profile.rank}
                      </div>
                    </div>
                    <div className="border border-border p-4 bg-secondary/10">
                      <div className="text-xs text-muted-foreground uppercase mb-1">
                        Level & XP
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        Lvl {profileDetails.profile.level}
                      </div>
                      <div className="text-sm">
                        {profileDetails.profile.xp} /{' '}
                        {profileDetails.profile.nextLevelXp} XP
                      </div>
                    </div>
                    <div className="border border-border p-4 bg-secondary/10">
                      <div className="text-xs text-muted-foreground uppercase mb-1">
                        Match Stats
                      </div>
                      <div className="text-sm">
                        <span className="text-green-500 font-bold">
                          {profileDetails.profile.wins}W
                        </span>{' '}
                        -{' '}
                        <span className="text-red-500 font-bold">
                          {profileDetails.profile.losses}L
                        </span>
                      </div>
                      <div className="text-sm">
                        Winrate:{' '}
                        {profileDetails.profile.wins +
                          profileDetails.profile.losses >
                        0
                          ? Math.round(
                              (profileDetails.profile.wins /
                                (profileDetails.profile.wins +
                                  profileDetails.profile.losses)) *
                                100
                            )
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="border border-border p-4 bg-secondary/10">
                      <div className="text-xs text-muted-foreground uppercase mb-1">
                        Details
                      </div>
                      <div className="text-sm">
                        Country: {profileDetails.profile.country}
                      </div>
                      <div className="text-sm">
                        Language: {profileDetails.profile.lang}
                      </div>
                      <div className="text-sm mt-1 text-muted-foreground">
                        Joined:{' '}
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-['Barlow_Condensed'] uppercase tracking-widest text-lg font-bold mb-3 border-b border-border pb-1">
                      Recent Match History
                    </h3>
                    <div className="space-y-2">
                      {profileDetails.matchHistory.length === 0 ? (
                        <div className="text-muted-foreground text-sm">
                          No matches played yet.
                        </div>
                      ) : (
                        profileDetails.matchHistory.map(
                          (match: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-3 border border-border bg-secondary/5 text-sm"
                            >
                              <div>
                                <span
                                  className={
                                    match.result === 'WIN'
                                      ? 'text-green-500 font-bold'
                                      : match.result === 'LOSS'
                                        ? 'text-red-500 font-bold'
                                        : 'text-yellow-500 font-bold'
                                  }
                                >
                                  {match.result}
                                </span>
                                <span className="mx-2 text-muted-foreground">
                                  vs
                                </span>
                                <span>{match.opponent}</span>
                              </div>
                              <div className="flex gap-4">
                                <span
                                  className={
                                    match.eloChange > 0
                                      ? 'text-green-500'
                                      : 'text-red-500'
                                  }
                                >
                                  {match.eloChange > 0 ? '+' : ''}
                                  {match.eloChange} ELO
                                </span>
                                <span className="text-muted-foreground">
                                  {match.date}
                                </span>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-red-400">Failed to load profile data.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
