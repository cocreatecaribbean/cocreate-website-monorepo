'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ArrowRight, X } from 'lucide-react'
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react'

export type AssistantContext = 'marketing' | 'client-portal' | 'admin-center'

export type AssistantChatProps = {
  context: AssistantContext
  api: string
  title?: string
  greeting?: string
  placeholder?: string
  onClose?: () => void
}

export default function AssistantChat({
  context,
  api,
  title = 'Ask CoCreate',
  greeting = 'Hi CoCreator!',
  placeholder = 'Type here for assistance...',
  onClose,
}: AssistantChatProps) {
  const inputId = useId()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        body: { context },
      }),
    [api, context],
  )

  const { messages, sendMessage, status, error } = useChat({ transport })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isLoading])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage({ text })
  }

  return (
    <div className="assistant-chat flex h-full min-h-0 flex-col">
      <div className="assistant-chat-header flex shrink-0 items-center justify-between gap-3 border-b border-chambray/10 px-4 py-3">
        <p className="assistant-chat-title text-base font-semibold text-chambray">{title}</p>
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

      <div className="assistant-chat-body flex min-h-0 flex-1 flex-col px-4 py-4">
        <p className="text-sm font-medium text-chambray">{greeting}</p>

        {messages.length > 0 || isLoading ? (
          <div
            className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
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
                      <span key={`${message.id}-${index}`}>{part.text}</span>
                    ) : null,
                  )}
                </div>
              </div>
            ))}
            {isLoading ? <p className="text-sm text-slate-400">Thinking…</p> : null}
            <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error.message}
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
            className="assistant-chat-input w-full rounded-full border border-slate-200 bg-white py-3 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sanmarino/50 focus:ring-2 focus:ring-sanmarino/15"
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
