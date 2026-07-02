import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    const { socket } = get()
    if (socket?.connected) return

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      set({ isConnected: true })
    })

    newSocket.on('disconnect', () => {
      set({ isConnected: false })
    })

    set({ socket: newSocket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },
}))
