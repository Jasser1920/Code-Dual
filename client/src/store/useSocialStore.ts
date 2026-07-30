import { create } from 'zustand'

export interface Friend {
  id: string
  username: string
  elo: number
  rankTier: string
  avatarUrl?: string
  preferredLang?: string
  isOnline: boolean
}

export interface FriendRequest {
  id: string
  sender?: {
    id: string
    username: string
    elo: number
    rankTier: string
    avatarUrl?: string
  }
  receiver?: {
    id: string
    username: string
    elo: number
    rankTier: string
    avatarUrl?: string
  }
  createdAt: string
}

export interface BlockedUser {
  id: string
  username: string
  avatarUrl?: string
}

export interface DirectMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: string
}

export interface DuelInvite {
  challengeId: string
  challengerId: string
  challengerName: string
  difficulty: string
  language: string
  expiresAt: number
}

interface SocialState {
  isOpen: boolean
  activeTab: 'friends' | 'requests' | 'blocked' | 'chat'
  activeChatFriend: Friend | null
  friends: Friend[]
  incomingRequests: FriendRequest[]
  outgoingRequests: FriendRequest[]
  blocked: BlockedUser[]
  messages: DirectMessage[]
  invites: DuelInvite[]
  unreadMessagesCount: number

  setIsOpen: (isOpen: boolean) => void
  toggleOpen: () => void
  setActiveTab: (tab: 'friends' | 'requests' | 'blocked' | 'chat') => void
  setActiveChatFriend: (friend: Friend | null) => void
  setSocialData: (data: {
    friends: Friend[]
    incomingRequests: FriendRequest[]
    outgoingRequests: FriendRequest[]
    blocked: BlockedUser[]
  }) => void
  addMessage: (msg: DirectMessage, currentUserId?: string) => void
  setMessages: (msgs: DirectMessage[]) => void
  addInvite: (invite: DuelInvite) => void
  removeInvite: (challengeId: string) => void
  updateFriendOnlineStatus: (userId: string, isOnline: boolean) => void
  clearUnreadCount: () => void
}

export const useSocialStore = create<SocialState>((set) => ({
  isOpen: false,
  activeTab: 'friends',
  activeChatFriend: null,
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  blocked: [],
  messages: [],
  invites: [],
  unreadMessagesCount: 0,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveChatFriend: (activeChatFriend) =>
    set({
      activeChatFriend,
      activeTab: activeChatFriend ? 'chat' : 'friends',
      unreadMessagesCount: 0,
    }),

  setSocialData: ({ friends, incomingRequests, outgoingRequests, blocked }) =>
    set({ friends, incomingRequests, outgoingRequests, blocked }),

  addMessage: (msg, currentUserId) =>
    set((state) => {
      const isFromActiveFriend =
        state.activeChatFriend &&
        (msg.senderId === state.activeChatFriend.id ||
          msg.receiverId === state.activeChatFriend.id)
      const isIncoming = msg.senderId !== currentUserId

      return {
        messages: isFromActiveFriend
          ? [...state.messages, msg]
          : state.messages,
        unreadMessagesCount:
          isIncoming && (!state.isOpen || !isFromActiveFriend)
            ? state.unreadMessagesCount + 1
            : state.unreadMessagesCount,
      }
    }),

  setMessages: (messages) => set({ messages }),

  addInvite: (invite) =>
    set((state) => ({
      invites: [
        ...state.invites.filter((i) => i.challengeId !== invite.challengeId),
        invite,
      ],
      isOpen: true, // Auto-open social panel so user sees the 2-minute invite!
    })),

  removeInvite: (challengeId) =>
    set((state) => ({
      invites: state.invites.filter((i) => i.challengeId !== challengeId),
    })),

  updateFriendOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === userId ? { ...f, isOnline } : f
      ),
    })),

  clearUnreadCount: () => set({ unreadMessagesCount: 0 }),
}))
