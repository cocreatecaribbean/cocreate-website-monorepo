'use client'

import { FormEvent, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import * as fonts from '@/styles/fonts'

/**
 * Contact page chat shell — wire your visual design into this layout.
 * Uses Vercel AI SDK (`useChat`) → POST /api/chat
 */
export default function ContactChat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, error } = useChat()

  const isLoading = status === 'submitted' || status === 'streaming'

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage({ text })
  }

  return (
    <div
      className={`
        mx-auto flex w-[min(100%,42rem)] flex-col overflow-hidden rounded-3xl
        border border-chambray/15 bg-white shadow-[0_24px_60px_rgba(57,65,154,0.12)]
        ${fonts.bricolage_grot400.className}
      `}
    >
      <div className="border-b border-chambray/10 bg-linear-to-r from-sanmarino/10 to-casablanca/10 px-6 py-5">
        <p
          className={`text-xs uppercase tracking-[0.2em] text-chambray/70 ${fonts.bricolage_grot500.className}`}
        >
          CoCreate
        </p>
        <h2
          className={`mt-1 text-xl text-chambray md:text-2xl ${fonts.bricolage_grot600.className}`}
        >
          How can we help?
        </h2>
      </div>

      <div
        className="flex max-h-[min(50svh,28rem)] min-h-[14rem] flex-col gap-4 overflow-y-auto px-5 py-6"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-chambray/60">
            Start a conversation below.
          </p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-chambray text-white'
                  : 'bg-chambray/8 text-chambray'
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

        {isLoading ? (
          <p className="text-sm text-chambray/50">Thinking…</p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error.message}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex gap-2 border-t border-chambray/10 bg-white p-4"
      >
        <label htmlFor="contact-chat-input" className="sr-only">
          Message
        </label>
        <input
          id="contact-chat-input"
          name="message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border border-chambray/20 px-4 py-3 text-base text-chambray outline-none focus:border-sanmarino"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`shrink-0 rounded-full bg-chambray px-5 py-3 text-sm text-white transition-opacity disabled:opacity-40 ${fonts.bricolage_grot600.className}`}
        >
          Send
        </button>
      </form>
    </div>
  )
}
