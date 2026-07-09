'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '@cocreate/api-client'
import type { QueryKey } from '@tanstack/react-query'
import {
  CLIENT_JOIN_INBOX,
  CLIENT_JOIN_THREAD,
  CLIENT_LEAVE_INBOX,
  CLIENT_LEAVE_THREAD,
  MESSAGING_NAMESPACE,
} from './events'

export type MessagingConfig = {
  getAccessToken: () => Promise<string | null>
  threadMessagesQueryKey: (requestId: string) => QueryKey
  inboxMessagesQueryKey: (conversationId: string) => QueryKey
  logLabel?: string
}

type MessagingContextValue = {
  config: MessagingConfig
  connected: boolean
  joinThread: (requestId: string) => void
  leaveThread: (requestId: string) => void
  joinInbox: (conversationId: string) => void
  leaveInbox: (conversationId: string) => void
  subscribe: (event: string, handler: (payload: unknown) => void) => () => void
}

const MessagingContext = createContext<MessagingContextValue | null>(null)

type Listener = (payload: unknown) => void

function attachListener(socket: Socket, event: string, handler: Listener): void {
  socket.on(event, handler)
}

function detachListener(socket: Socket, event: string, handler: Listener): void {
  socket.off(event, handler)
}

function devLog(config: MessagingConfig, message: string, extra?: unknown): void {
  if (process.env.NODE_ENV !== 'development') return
  const label = config.logLabel ?? 'messaging'
  if (extra !== undefined) {
    console.info(`[${label}] ${message}`, extra)
  } else {
    console.info(`[${label}] ${message}`)
  }
}

export function useMessagingContext(): MessagingContextValue {
  const ctx = useContext(MessagingContext)
  if (!ctx) {
    throw new Error('useMessagingContext must be used within MessagingProvider')
  }
  return ctx
}

export function MessagingProvider({
  config,
  children,
}: {
  config: MessagingConfig
  children: ReactNode
}) {
  const socketRef = useRef<Socket | null>(null)
  const listenersRef = useRef(new Map<string, Set<Listener>>())
  const pendingThreadRoomsRef = useRef(new Set<string>())
  const pendingInboxRoomsRef = useRef(new Set<string>())
  const [connected, setConnected] = useState(false)
  const configRef = useRef(config)
  configRef.current = config

  const bindListeners = useCallback((socket: Socket) => {
    for (const [event, handlers] of listenersRef.current) {
      for (const handler of handlers) {
        attachListener(socket, event, handler)
      }
    }
  }, [])

  const unbindListeners = useCallback((socket: Socket) => {
    for (const [event, handlers] of listenersRef.current) {
      for (const handler of handlers) {
        detachListener(socket, event, handler)
      }
    }
  }, [])

  const flushPendingRooms = useCallback((socket: Socket) => {
    for (const requestId of pendingThreadRoomsRef.current) {
      socket.emit(CLIENT_JOIN_THREAD, { requestId })
      devLog(configRef.current, `joinThread emit (flush)`, requestId)
    }
    for (const conversationId of pendingInboxRoomsRef.current) {
      socket.emit(CLIENT_JOIN_INBOX, { conversationId })
      devLog(configRef.current, `joinInbox emit (flush)`, conversationId)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const token = await configRef.current.getAccessToken()
      if (cancelled || !token) return

      const socket = io(`${getApiBaseUrl()}${MESSAGING_NAMESPACE}`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelayMax: 5000,
      })

      socket.on('connect', () => {
        devLog(configRef.current, 'socket connected', { socketId: socket.id })
        bindListeners(socket)
        flushPendingRooms(socket)
        setConnected(true)
      })

      socket.on('disconnect', () => {
        setConnected(false)
      })

      socket.on('connect_error', (err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[${configRef.current.logLabel ?? 'messaging'}] connect error`,
            err.message,
          )
        }
      })

      socketRef.current = socket
    })()

    return () => {
      cancelled = true
      const socket = socketRef.current
      if (socket) {
        unbindListeners(socket)
        socket.disconnect()
      }
      socketRef.current = null
      setConnected(false)
    }
  }, [bindListeners, flushPendingRooms, unbindListeners])

  const joinThread = useCallback((requestId: string) => {
    pendingThreadRoomsRef.current.add(requestId)
    const socket = socketRef.current
    if (socket?.connected) {
      socket.emit(CLIENT_JOIN_THREAD, { requestId })
      devLog(configRef.current, 'joinThread emit', requestId)
    } else {
      devLog(configRef.current, 'joinThread queued (socket not ready)', requestId)
    }
  }, [])

  const leaveThread = useCallback((requestId: string) => {
    pendingThreadRoomsRef.current.delete(requestId)
    socketRef.current?.emit(CLIENT_LEAVE_THREAD, { requestId })
  }, [])

  const joinInbox = useCallback((conversationId: string) => {
    pendingInboxRoomsRef.current.add(conversationId)
    const socket = socketRef.current
    if (socket?.connected) {
      socket.emit(CLIENT_JOIN_INBOX, { conversationId })
      devLog(configRef.current, 'joinInbox emit', conversationId)
    } else {
      devLog(configRef.current, 'joinInbox queued (socket not ready)', conversationId)
    }
  }, [])

  const leaveInbox = useCallback((conversationId: string) => {
    pendingInboxRoomsRef.current.delete(conversationId)
    socketRef.current?.emit(CLIENT_LEAVE_INBOX, { conversationId })
  }, [])

  const subscribe = useCallback((event: string, handler: Listener) => {
    let handlers = listenersRef.current.get(event)
    if (!handlers) {
      handlers = new Set()
      listenersRef.current.set(event, handlers)
    }
    handlers.add(handler)

    const socket = socketRef.current
    if (socket) {
      attachListener(socket, event, handler)
    }

    return () => {
      const current = listenersRef.current.get(event)
      current?.delete(handler)
      if (current?.size === 0) {
        listenersRef.current.delete(event)
      }
      if (socketRef.current) {
        detachListener(socketRef.current, event, handler)
      }
    }
  }, [])

  const value = useMemo<MessagingContextValue>(
    () => ({
      config,
      connected,
      joinThread,
      leaveThread,
      joinInbox,
      leaveInbox,
      subscribe,
    }),
    [config, connected, joinThread, leaveThread, joinInbox, leaveInbox, subscribe],
  )

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
}
