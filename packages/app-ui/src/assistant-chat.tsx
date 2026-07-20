'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ArrowRight, X } from 'lucide-react'
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react'
import AssistantMessageContent from './assistant-message-content'

export type AssistantContext = 'marketing' | 'client-portal' | 'admin-center'

export type AssistantChatProps = {
  context: AssistantContext
  api: string
  title?: string
  greeting?: string
  placeholder?: string
  /** When true, focus the composer (e.g. panel reopened). */
  open?: boolean
  onClose?: () => void
  /**
   * Extra fields merged into every chat request body (e.g. current path / tab).
   * Read from a ref on send so route changes do not recreate the transport.
   */
  requestExtras?: Record<string, unknown>
}

function messagesStorageKey(context: AssistantContext) {
  return `cocreate.assistant.messages.${context}`
}

function isTextPart(part: unknown): part is { type: 'text'; text: string } {
  return (
    typeof part === 'object' &&
    part !== null &&
    'type' in part &&
    (part as { type: unknown }).type === 'text' &&
    'text' in part &&
    typeof (part as { text: unknown }).text === 'string'
  )
}

function serializeMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: message.parts.filter(isTextPart),
  }))
}

function readStoredMessages(context: AssistantContext): UIMessage[] {
  try {
    const raw = sessionStorage.getItem(messagesStorageKey(context))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is UIMessage => {
      if (typeof item !== 'object' || item === null) return false
      const message = item as Partial<UIMessage>
      return (
        typeof message.id === 'string' &&
        (message.role === 'user' || message.role === 'assistant' || message.role === 'system') &&
        Array.isArray(message.parts)
      )
    })
  } catch {
    return []
  }
}

function writeStoredMessages(context: AssistantContext, messages: UIMessage[]) {
  try {
    sessionStorage.setItem(
      messagesStorageKey(context),
      JSON.stringify(serializeMessages(messages)),
    )
  } catch {
    // ignore
  }
}

function clearStoredMessages(context: AssistantContext) {
  try {
    sessionStorage.removeItem(messagesStorageKey(context))
  } catch {
    // ignore
  }
}

function formatChatErrorMessage(message: string): string {
  const trimmed = message.trim()
  if (
    !trimmed ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('__next_error__') ||
    /<title>\s*500:/i.test(trimmed)
  ) {
    return 'Something went wrong. Please try again.'
  }
  return trimmed
}

export default function AssistantChat({
  context,
  api,
  title = 'Ask CoCreate',
  greeting = 'Hi CoCreator!',
  placeholder = 'Type here for assistance...',
  open = true,
  onClose,
  requestExtras,
}: AssistantChatProps) {
  const inputId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const messagesListRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const extrasRef = useRef(requestExtras)
  extrasRef.current = requestExtras
  const [input, setInput] = useState('')
  const [initialMessages] = useState(() => readStoredMessages(context))

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        prepareSendMessagesRequest: ({
          id,
          messages,
          body,
          headers,
          credentials,
          api: requestApi,
          trigger,
          messageId,
        }) => ({
          api: requestApi,
          headers,
          credentials,
          body: {
            ...(body ?? {}),
            id,
            trigger,
            messageId,
            context,
            ...extrasRef.current,
            // Always last so extras cannot overwrite the chat payload
            messages,
          },
        }),
      }),
    [api, context],
  )

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
    messages: initialMessages,
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    writeStoredMessages(context, messages)
  }, [context, messages])

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      if (!window.matchMedia('(pointer: fine)').matches) return
      inputRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    const list = messagesListRef.current
    if (!list) return
    const inputFocused = document.activeElement === inputRef.current
    const isTouch = !window.matchMedia('(pointer: fine)').matches
    // Avoid fighting the mobile keyboard / visual viewport while typing.
    if (isTouch && inputFocused && !isLoading) return
    list.scrollTop = list.scrollHeight
  }, [messages, isLoading])

  // Keep wheel/trackpad/touch scroll inside the panel so the page behind does not move.
  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (!root) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const list = messagesListRef.current
      if (!list) return
      list.scrollTop += event.deltaY
    }

    let lastTouchY = 0

    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0
    }

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const currentY = event.touches[0]?.clientY ?? lastTouchY
      const list = messagesListRef.current
      if (list) {
        list.scrollTop += lastTouchY - currentY
      }
      lastTouchY = currentY
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
    }
  }, [open])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage({ text })
  }

  const clearChat = () => {
    setMessages([])
    clearStoredMessages(context)
  }

  return (
    <div ref={rootRef} className="assistant-chat flex h-full min-h-0 flex-col">
      <div className="assistant-chat-header flex shrink-0 items-center justify-between gap-3 border-b border-chambray/10 px-4 py-3">
        <p className="assistant-chat-title text-base font-semibold text-chambray">{title}</p>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clearChat}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-chambray/70 transition hover:bg-chambray/8 hover:text-chambray focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sanmarino"
            >
              Clear chat
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close assistant"
              className="assistant-chat-close flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-chambray/70 transition hover:bg-chambray/8 hover:text-chambray focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sanmarino"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="assistant-chat-body flex min-h-0 flex-1 flex-col px-4 py-4">
        <p className="text-sm font-medium text-chambray">{greeting}</p>

        {messages.length > 0 || isLoading ? (
          <div
            ref={messagesListRef}
            className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain pr-1"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-chambray text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {message.parts.map((part, index) =>
                    part.type === 'text' ? (
                      message.role === 'assistant' ? (
                        <AssistantMessageContent
                          key={`${message.id}-${index}`}
                          text={part.text}
                        />
                      ) : (
                        <span key={`${message.id}-${index}`} className="whitespace-pre-wrap">
                          {part.text}
                        </span>
                      )
                    ) : null,
                  )}
                </div>
              </div>
            ))}
            {isLoading ? <p className="text-sm text-slate-400">Thinking…</p> : null}
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {formatChatErrorMessage(error.message)}
          </p>
        ) : null}

        <form
          onSubmit={onSubmit}
          className={`relative shrink-0 ${messages.length > 0 || isLoading || error ? 'mt-3' : 'mt-4'}`}
        >
          <label htmlFor={inputId} className="sr-only">
            {placeholder}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            name="message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="assistant-chat-input w-full rounded-full border border-slate-200 bg-white py-3 pl-4 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sanmarino/50 focus:ring-2 focus:ring-sanmarino/15"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-sanmarino text-casablanca shadow-sm transition hover:bg-chambray disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowRight className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  )
}
