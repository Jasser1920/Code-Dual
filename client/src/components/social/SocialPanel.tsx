import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSocialStore } from '../../store/useSocialStore'
import { useAuthStore } from '../../store/useAuthStore'
import { api } from '../../api/axios'
import { useSocketStore } from '../../lib/socket'
import { showTerminalToast } from '../ui/terminal-toast'
import {
  X,
  MessageSquare,
  Swords,
  UserPlus,
  Check,
  Ban,
  Send,
  ArrowLeft,
  Circle,
  Clock,
  UserMinus,
  Search,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

export const SocialPanel: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { socket } = useSocketStore()
  const {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    activeChatFriend,
    setActiveChatFriend,
    friends,
    incomingRequests,
    outgoingRequests,
    blocked,
    messages,
    invites,
    setSocialData,
    addMessage,
    setMessages,
    removeInvite,
    updateFriendOnlineStatus,
    addInvite,
  } = useSocialStore()

  const [addUsername, setAddUsername] = useState('')
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [challengeDiff, setChallengeDiff] = useState('Medium')
  const [now, setNow] = useState(Date.now())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // 1. Auto-hide during active duel matches!
  const isDuelRoute = location.pathname.startsWith('/duel')

  // 2. Timer tick for 2-minute invite countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
      // Auto-expire invites past their expiration
      invites.forEach((inv) => {
        if (Date.now() >= inv.expiresAt) {
          removeInvite(inv.challengeId)
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [invites, removeInvite])

  // 3. Fetch social lists on open or auth change
  const fetchSocialList = async () => {
    if (!isAuthenticated) return
    try {
      const res = await api.get('/social/list')
      if (res.data.success) {
        setSocialData({
          friends: res.data.friends,
          incomingRequests: res.data.incomingRequests,
          outgoingRequests: res.data.outgoingRequests,
          blocked: res.data.blocked,
        })
      }
    } catch (err) {
      console.error('Failed to fetch social list:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSocialList()
    }
  }, [isAuthenticated])

  // Search effect for autocomplete friend requests
  useEffect(() => {
    if (!addUsername.trim() || addUsername.trim().length < 1) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await api.get(
          `/social/search?q=${encodeURIComponent(addUsername.trim())}`
        )
        if (res.data.success) {
          setSearchResults(res.data.users || [])
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [addUsername])

  // Handlers moved up for socket event listeners
  const handleAcceptRequest = async (id: string) => {
    try {
      await api.post(`/social/accept/${id}`)
      fetchSocialList()
      showTerminalToast({
        title: 'Success',
        description: 'Friend request accepted!',
        icon: <Check className="w-4 h-4 text-green-500" />,
      })
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === id || u.isRequestReceived
            ? { ...u, isFriend: true, isRequestReceived: false }
            : u
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleRejectRequest = async (id: string) => {
    try {
      await api.post(`/social/reject/${id}`)
      fetchSocialList()
      showTerminalToast({
        title: 'Info',
        description: 'Friend request rejected.',
        icon: <Circle className="w-4 h-4 text-muted-foreground" />,
      })
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === id || u.isRequestReceived
            ? { ...u, isRequestReceived: false }
            : u
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendRequestUsername = async (username: string) => {
    setAddError('')
    setAddSuccess('')
    try {
      const res = await api.post('/social/request', { username })
      if (res.data.success) {
        setAddSuccess(res.data.message || `Request sent to @${username}!`)
        fetchSocialList()
        setSearchResults((prev) =>
          prev.map((u) =>
            u.username === username ? { ...u, isRequestSent: true } : u
          )
        )
        showTerminalToast({
          title: 'Request Sent',
          description: `Friend request sent to @${username}!`,
          icon: <Send className="w-4 h-4 text-accent" />,
        })
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to send request'
      setAddError(errMsg)
      showTerminalToast({
        title: 'Error',
        description: errMsg,
        icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
      })
    }
  }

  const handleBlockUser = async (targetId: string) => {
    try {
      await api.post(`/social/block/${targetId}`)
      fetchSocialList()
      showTerminalToast({
        title: 'Blocked',
        description: 'User has been blocked.',
        icon: <Ban className="w-4 h-4 text-destructive" />,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleBlockUserPrompt = (f: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Block User?',
      message: `Are you sure you want to block @${f.username}? They will no longer be able to message or challenge you.`,
      onConfirm: () => handleBlockUser(f.id),
    })
  }

  const handleRemoveFriendPrompt = (f: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Friend?',
      message: `Are you sure you want to remove @${f.username} from your friends list?`,
      onConfirm: async () => {
        try {
          await api.delete(`/social/friend/${f.id}`)
          fetchSocialList()
          showTerminalToast({
            title: 'Removed',
            description: `Removed @${f.username} from friends list.`,
            icon: <UserMinus className="w-4 h-4 text-muted-foreground" />,
          })
        } catch (err) {
          console.error(err)
          showTerminalToast({
            title: 'Error',
            description: 'Failed to remove friend',
            icon: <AlertTriangle className="w-4 h-4 text-destructive" />,
          })
        }
      },
    })
  }

  const handleOpenChat = async (friend: any) => {
    setActiveChatFriend(friend)
    try {
      const res = await api.get(`/social/messages/${friend.id}`)
      if (res.data.success) {
        setMessages(res.data.messages)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  // 4. Socket event listeners for real-time social updates
  useEffect(() => {
    if (!socket || !user) return

    // Notify server we are online
    socket.emit('presence:online', { userId: user.id })

    const handleStatusChange = ({
      userId,
      isOnline,
    }: {
      userId: string
      isOnline: boolean
    }) => {
      updateFriendOnlineStatus(userId, isOnline)
    }

    const handleMessageReceive = (msg: any) => {
      addMessage(msg, user.id)
      if (msg.senderId !== user.id) {
        const state = useSocialStore.getState()
        const isCurrentChat =
          state.isOpen &&
          state.activeTab === 'chat' &&
          state.activeChatFriend?.id === msg.senderId
        if (!isCurrentChat) {
          const senderName = msg.sender?.username || 'A friend'
          showTerminalToast({
            title: `New Message from @${senderName}`,
            description: msg.content,
            icon: <MessageSquare className="w-4 h-4 text-accent" />,
            action: {
              label: 'Open Chat',
              onClick: () => {
                const friendObj = state.friends.find(
                  (f) => f.id === msg.senderId
                )
                if (friendObj) {
                  state.setIsOpen(true)
                  state.setActiveTab('chat')
                  state.setActiveChatFriend(friendObj)
                }
              },
            },
          })
        }
      }
    }

    const handleRequestReceive = (data?: any) => {
      fetchSocialList()
      if (data && data.sender) {
        showTerminalToast({
          title: 'New Friend Request!',
          description: `@${data.sender.username} wants to be your friend.`,
          icon: <UserPlus className="w-4 h-4 text-accent animate-pulse" />,
          action: {
            label: 'Accept',
            onClick: () => handleAcceptRequest(data.id),
          },
          cancel: {
            label: 'Reject',
            onClick: () => handleRejectRequest(data.id),
          },
        })
      } else {
        showTerminalToast({
          title: 'Friend Request',
          description: 'You received a new friend request!',
          icon: <UserPlus className="w-4 h-4 text-accent" />,
        })
      }
    }

    const handleRequestAccepted = () => {
      fetchSocialList()
      showTerminalToast({
        title: 'Request Accepted',
        description: 'Your friend request was accepted!',
        icon: <Check className="w-4 h-4 text-green-500" />,
      })
    }

    const handleChallengeReceive = (inv: any) => {
      addInvite(inv)
      showTerminalToast({
        title: 'Duel Challenge!',
        description: `@${inv.challengerName} invited you to a ${inv.difficulty} (${inv.language}) duel!`,
        icon: <Swords className="w-4 h-4 text-accent animate-bounce" />,
      })
    }

    const handleChallengeAccepted = ({ roomId }: { roomId: string }) => {
      setIsOpen(false)
      navigate(`/?invite=${roomId}`)
    }

    socket.on('friend:status_change', handleStatusChange)
    socket.on('message:receive', handleMessageReceive)
    socket.on('friend:request_receive', handleRequestReceive)
    socket.on('friend:request_accepted', handleRequestAccepted)
    socket.on('duel:challenge_receive', handleChallengeReceive)
    socket.on('duel:challenge_accepted', handleChallengeAccepted)

    return () => {
      socket.off('friend:status_change', handleStatusChange)
      socket.off('message:receive', handleMessageReceive)
      socket.off('friend:request_receive', handleRequestReceive)
      socket.off('friend:request_accepted', handleRequestAccepted)
      socket.off('duel:challenge_receive', handleChallengeReceive)
      socket.off('duel:challenge_accepted', handleChallengeAccepted)
    }
  }, [
    socket,
    user,
    updateFriendOnlineStatus,
    addMessage,
    addInvite,
    setIsOpen,
    navigate,
  ])

  // 5. Scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTab])

  if (isDuelRoute || !isAuthenticated) {
    return null
  }

  // Handlers
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addUsername.trim()) return
    handleSendRequestUsername(addUsername.trim())
  }

  const handleUnblockUser = async (targetId: string) => {
    try {
      await api.delete(`/social/block/${targetId}`)
      fetchSocialList()
      showTerminalToast({
        title: 'Unblocked',
        description: 'User unblocked.',
        icon: <Check className="w-4 h-4 text-green-500" />,
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeChatFriend || !chatInput.trim()) return

    const content = chatInput.trim()
    setChatInput('')

    try {
      const res = await api.post(`/social/messages/${activeChatFriend.id}`, {
        content,
      })
      if (res.data.success && res.data.message) {
        addMessage(res.data.message, user?.id)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleSendChallenge = (targetId: string) => {
    if (!socket || !user) return
    socket.emit('duel:challenge', {
      challengerId: user.id,
      challengerName: user.username,
      targetId,
      difficulty: challengeDiff,
      language: user.preferredLang || 'javascript',
    })
    alert(`Challenge sent! Waiting up to 2 minutes for response...`)
  }

  const handleRespondChallenge = (inv: any, accepted: boolean) => {
    if (!socket || !user) return
    socket.emit('duel:challenge_res', {
      challengeId: inv.challengeId,
      challengerId: inv.challengerId,
      targetId: user.id,
      accepted,
      difficulty: inv.difficulty,
      language: inv.language,
    })
    removeInvite(inv.challengeId)
  }

  return (
    <>
      {/* Fixed Vertical Rectangle Button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-card hover:bg-secondary/80 text-foreground border border-border border-r-0 rounded-none py-6 px-2.5 flex flex-col items-center justify-center shadow-2xl transition-all duration-300 group cursor-pointer"
          style={{ writingMode: 'vertical-rl' }}
          title="Open Friends & Requests"
        >
          <div className="flex items-center gap-2.5 font-['Barlow_Condensed'] font-extrabold uppercase tracking-widest text-sm text-foreground group-hover:text-accent transition-colors select-none">
            <span className="inline-block transform rotate-180">
              FRIENDS & REQUESTS
            </span>
            {(incomingRequests.length > 0 || invites.length > 0) && (
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            )}
          </div>
        </button>
      )}

      {/* Side Panel in Document Flow (Sits beside main screen, never overlays) */}
      {isOpen && (
        <div className="w-[380px] shrink-0 bg-card border-l border-border shadow-2xl flex flex-col font-['JetBrains_Mono'] text-sm h-[calc(100vh-4rem)] sticky top-16 z-40 animate-in slide-in-from-right-10 duration-200 relative">
          {/* Vertical Close Button attached to left edge of panel */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -left-[37px] top-1/2 -translate-y-1/2 z-50 bg-card hover:bg-secondary/80 text-foreground border border-border border-r-0 rounded-none py-6 px-2.5 flex flex-col items-center justify-center shadow-2xl transition-all duration-300 group cursor-pointer"
            style={{ writingMode: 'vertical-rl' }}
            title="Close Friends & Requests"
          >
            <div className="flex items-center gap-2.5 font-['Barlow_Condensed'] font-extrabold uppercase tracking-widest text-sm text-foreground group-hover:text-accent transition-colors select-none">
              <span className="inline-block transform rotate-180">
                FRIENDS & REQUESTS
              </span>
              {(incomingRequests.length > 0 || invites.length > 0) && (
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              )}
            </div>
          </button>

          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/50 shrink-0">
            <div className="flex items-center gap-2 font-['Barlow_Condensed'] font-extrabold text-lg uppercase tracking-widest text-foreground">
              <MessageSquare className="w-5 h-5 text-accent" />
              <span>Global Social Hub</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-sm cursor-pointer transition-colors"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2-Minute Invites Section (Top Priority) */}
          {invites.length > 0 && (
            <div className="p-3 bg-accent/10 border-b border-accent/30 space-y-2">
              {invites.map((inv) => {
                const secondsLeft = Math.max(
                  0,
                  Math.floor((inv.expiresAt - now) / 1000)
                )
                return (
                  <div
                    key={inv.challengeId}
                    className="p-3 bg-background border border-accent rounded-sm shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between font-['Barlow_Condensed'] text-base uppercase font-bold text-accent">
                      <span className="flex items-center gap-1.5">
                        <Swords className="w-4 h-4 animate-bounce" /> Duel
                        Challenge!
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-['JetBrains_Mono'] font-normal">
                        <Clock className="w-3.5 h-3.5" /> {secondsLeft}s left
                      </span>
                    </div>
                    <p className="text-xs text-foreground">
                      <span className="font-bold text-accent">
                        @{inv.challengerName}
                      </span>{' '}
                      invited you to a{' '}
                      <span className="font-semibold text-foreground">
                        {inv.difficulty}
                      </span>{' '}
                      ({inv.language}) duel!
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleRespondChallenge(inv, true)}
                        className="flex-1 py-1 px-2 bg-accent text-accent-foreground font-['Barlow_Condensed'] font-bold uppercase text-xs rounded-sm hover:opacity-90 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleRespondChallenge(inv, false)}
                        className="flex-1 py-1 px-2 bg-secondary text-muted-foreground hover:text-foreground font-['Barlow_Condensed'] uppercase text-xs rounded-sm border border-border flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Tabs / Chat Navigation */}
          {activeTab === 'chat' && activeChatFriend ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-3 border-b border-border bg-background/50 flex items-center justify-between">
                <button
                  onClick={() => setActiveChatFriend(null)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                  <Circle
                    className={`w-2.5 h-2.5 fill-current ${
                      activeChatFriend.isOnline
                        ? 'text-green-500'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                  <span className="font-bold text-foreground">
                    @{activeChatFriend.username}
                  </span>
                </div>
                <div className="w-12" /> {/* Spacer */}
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-background/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-xs p-4">
                    <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                    <p>
                      No messages yet. Say hello to @{activeChatFriend.username}
                      !
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.id
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-sm text-xs break-words ${
                            isMe
                              ? 'bg-accent text-accent-foreground rounded-tr-none'
                              : 'bg-secondary text-foreground border border-border rounded-tl-none'
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-border bg-background flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary border border-border rounded-sm px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-3 py-1.5 bg-accent text-accent-foreground font-['Barlow_Condensed'] font-bold uppercase rounded-sm hover:opacity-90 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Main Tab Bar */}
              <div className="flex border-b border-border bg-background/50 font-['Barlow_Condensed'] font-extrabold uppercase text-sm tracking-wider">
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`flex-1 py-3 border-b-2 text-center transition-colors cursor-pointer ${
                    activeTab === 'friends'
                      ? 'border-accent text-accent bg-accent/10 font-black'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Friends ({friends.length})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 py-3 border-b-2 text-center transition-colors relative cursor-pointer ${
                    activeTab === 'requests'
                      ? 'border-accent text-accent bg-accent/10 font-black'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Requests
                  {incomingRequests.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-destructive text-destructive-foreground rounded-full text-[11px] font-bold">
                      {incomingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('blocked')}
                  className={`flex-1 py-3 border-b-2 text-center transition-colors cursor-pointer ${
                    activeTab === 'blocked'
                      ? 'border-accent text-accent bg-accent/10 font-black'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Blocked ({blocked.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* TAB: FRIENDS */}
                {activeTab === 'friends' && (
                  <div className="space-y-3">
                    {/* Challenge Difficulty Selector */}
                    <div className="flex items-center justify-between text-xs p-2 bg-secondary/30 rounded-sm border border-border">
                      <span className="text-muted-foreground">
                        Default Challenge Diff:
                      </span>
                      <select
                        value={challengeDiff}
                        onChange={(e) => setChallengeDiff(e.target.value)}
                        className="bg-background border border-border text-foreground px-2 py-0.5 rounded-sm focus:outline-none focus:border-accent"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    {friends.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                        <UserPlus className="w-8 h-8 mx-auto opacity-20" />
                        <p>You haven't added any friends yet.</p>
                        <button
                          onClick={() => setActiveTab('requests')}
                          className="text-accent underline hover:opacity-80"
                        >
                          Send a friend request &rarr;
                        </button>
                      </div>
                    ) : (
                      friends.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 bg-secondary/40 border border-border rounded-sm flex items-center justify-between gap-2 hover:border-border/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Circle
                              className={`w-2.5 h-2.5 shrink-0 fill-current ${
                                f.isOnline
                                  ? 'text-green-500'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                            <div className="truncate">
                              <div className="font-extrabold text-base text-foreground truncate">
                                @{f.username}
                              </div>
                              <div className="text-xs font-bold text-muted-foreground mt-0.5">
                                {f.rankTier} • {f.elo} ELO
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenChat(f)}
                              title="Direct Message"
                              className="p-1.5 bg-background border border-border text-foreground hover:text-accent hover:border-accent rounded-sm transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSendChallenge(f.id)}
                              disabled={!f.isOnline}
                              title={
                                f.isOnline
                                  ? 'Challenge to Duel'
                                  : 'User is offline'
                              }
                              className="px-2 py-1 bg-accent/10 border border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground font-['Barlow_Condensed'] font-bold uppercase text-xs rounded-sm transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                            >
                              <Swords className="w-3.5 h-3.5" /> Duel
                            </button>
                            <button
                              onClick={() => handleRemoveFriendPrompt(f)}
                              title="Remove Friend"
                              className="p-1.5 bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive rounded-sm transition-colors cursor-pointer"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleBlockUserPrompt(f)}
                              title="Block User"
                              className="p-1.5 bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive rounded-sm transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB: REQUESTS */}
                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {/* Add Friend Form & Search Autocomplete */}
                    <form
                      onSubmit={handleSendRequest}
                      className="p-3 bg-secondary/30 border border-border rounded-sm space-y-2"
                    >
                      <label className="block text-xs font-['Barlow_Condensed'] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-accent" /> Search
                        Player to Add Friend
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={addUsername}
                          onChange={(e) => setAddUsername(e.target.value)}
                          placeholder="Type username (e.g. Alex123)..."
                          className="flex-1 bg-background border border-border rounded-sm px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent font-['JetBrains_Mono']"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 bg-accent text-accent-foreground font-['Barlow_Condensed'] font-bold uppercase text-xs rounded-sm hover:opacity-90 cursor-pointer"
                        >
                          Send
                        </button>
                      </div>
                      {addError && (
                        <p className="text-[11px] text-destructive">
                          {addError}
                        </p>
                      )}
                      {addSuccess && (
                        <p className="text-[11px] text-green-500">
                          {addSuccess}
                        </p>
                      )}

                      {/* Search Results Autocomplete Dropdown */}
                      {isSearching ? (
                        <div className="py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-accent" />
                          <span>Searching players...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto border border-border bg-background/80 p-2 rounded-sm shadow-inner">
                          {searchResults.map((u) => (
                            <div
                              key={u.id}
                              className="p-2 bg-secondary/40 border border-border/60 rounded-sm flex items-center justify-between gap-2 hover:bg-secondary/70 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <img
                                  src={
                                    u.avatarUrl ||
                                    `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`
                                  }
                                  alt={u.username}
                                  className="w-8 h-8 rounded-full bg-secondary border border-border shrink-0"
                                />
                                <div className="truncate">
                                  <div className="font-extrabold text-sm text-foreground truncate">
                                    @{u.username}
                                  </div>
                                  <div className="text-[11px] font-bold text-muted-foreground">
                                    {u.rankTier} • {u.elo} ELO
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {u.isBlocked ? (
                                  <span
                                    className="text-[11px] text-destructive font-bold px-2 py-1 bg-destructive/10 rounded-sm border border-destructive/30"
                                    title="You have blocked this user or they blocked you"
                                  >
                                    Blocked 🚫
                                  </span>
                                ) : u.isFriend ? (
                                  <span className="text-[11px] text-green-500 font-bold px-2 py-1 bg-green-500/10 rounded-sm border border-green-500/30">
                                    Friends ✓
                                  </span>
                                ) : u.isRequestSent ? (
                                  <span className="text-[11px] text-muted-foreground font-bold px-2 py-1 bg-secondary rounded-sm border border-border">
                                    Sent ✓
                                  </span>
                                ) : u.isRequestReceived ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptRequest(u.id)}
                                    className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-sm transition-colors cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSendRequestUsername(u.username)
                                    }
                                    className="px-2.5 py-1 bg-accent text-accent-foreground font-bold text-xs rounded-sm hover:opacity-90 flex items-center gap-1 transition-opacity cursor-pointer shadow-sm"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" /> Add
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : addUsername.trim().length > 0 && !isSearching ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          No players found matching "{addUsername}".
                        </p>
                      ) : null}
                    </form>

                    {/* Incoming Requests */}
                    <div className="space-y-2">
                      <div className="text-xs font-['Barlow_Condensed'] font-bold uppercase text-muted-foreground border-b border-border pb-1">
                        Incoming Requests ({incomingRequests.length})
                      </div>
                      {incomingRequests.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 py-2">
                          No pending incoming requests.
                        </p>
                      ) : (
                        incomingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-2.5 bg-secondary/40 border border-border rounded-sm flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-foreground">
                                @{req.sender?.username || 'Unknown'}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {req.sender?.rankTier} • {req.sender?.elo} ELO
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleAcceptRequest(req.id)}
                                title="Accept"
                                className="p-1.5 bg-green-500/10 border border-green-500/40 text-green-500 hover:bg-green-500 hover:text-white rounded-sm transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req.id)}
                                title="Reject"
                                className="p-1.5 bg-destructive/10 border border-destructive/40 text-destructive hover:bg-destructive hover:text-white rounded-sm transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Outgoing Requests */}
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-['Barlow_Condensed'] font-bold uppercase text-muted-foreground border-b border-border pb-1">
                        Sent Requests ({outgoingRequests.length})
                      </div>
                      {outgoingRequests.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 py-2">
                          No pending sent requests.
                        </p>
                      ) : (
                        outgoingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="p-2 bg-secondary/20 border border-border rounded-sm flex items-center justify-between text-xs text-muted-foreground"
                          >
                            <span>@{req.receiver?.username || 'Unknown'}</span>
                            <span className="text-[10px] italic">
                              Pending...
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: BLOCKED */}
                {activeTab === 'blocked' && (
                  <div className="space-y-2">
                    {blocked.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs space-y-2">
                        <Ban className="w-8 h-8 mx-auto opacity-20" />
                        <p>You haven't blocked any users.</p>
                      </div>
                    ) : (
                      blocked.map((b) => (
                        <div
                          key={b.id}
                          className="p-2.5 bg-secondary/40 border border-border rounded-sm flex items-center justify-between gap-2"
                        >
                          <span className="font-bold text-foreground">
                            @{b.username}
                          </span>
                          <button
                            onClick={() => handleUnblockUser(b.id)}
                            className="px-2 py-1 bg-secondary hover:bg-destructive/10 hover:text-destructive border border-border text-muted-foreground font-['Barlow_Condensed'] uppercase text-xs rounded-sm transition-colors"
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Confirmation Popup Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border p-6 rounded-sm max-w-md w-full space-y-4 shadow-2xl font-['JetBrains_Mono']">
            <h3 className="font-['Barlow_Condensed'] font-extrabold uppercase tracking-widest text-xl text-foreground flex items-center gap-2.5">
              <AlertTriangle className="text-destructive w-6 h-6 animate-pulse" />
              {confirmModal.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end pt-3 border-t border-border/50">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-secondary text-muted-foreground hover:text-foreground font-['Barlow_Condensed'] uppercase font-bold text-sm rounded-sm cursor-pointer border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm()
                  setConfirmModal(null)
                }}
                className="px-4 py-2 bg-destructive text-destructive-foreground font-['Barlow_Condensed'] uppercase font-extrabold text-sm rounded-sm hover:opacity-90 cursor-pointer shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
