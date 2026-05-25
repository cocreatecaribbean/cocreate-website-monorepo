'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import * as fonts from '@/styles/fonts'

/**
 * Contact page chat — uses Vercel AI SDK (`useChat`) → POST /api/chat
 */
export default function ContactChat() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, status, error } = useChat()

  const isLoading = status === 'submitted' || status === 'streaming'

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
    <div
      className={`mx-auto flex w-full max-w-[42rem] flex-col items-center ${fonts.bricolage_grot400.className}`}
    >
      <div className="mb-6 flex justify-center sm:mb-8">
        <Image
          src="/smart-chat-graphic.svg"
          alt=""
          width={222}
          height={216}
          priority
          className="h-auto w-[min(11rem,38vw)] max-w-[222px] select-none sm:w-[min(13rem,32vw)]"
          aria-hidden
        />
      </div>

      <div
        className="
          flex w-full flex-col overflow-hidden rounded-[2.5rem]
          bg-white px-6 py-7 shadow-[0_8px_40px_rgba(57,65,154,0.08)]
          sm:rounded-[2.75rem] sm:px-8 sm:py-8
          md:px-10 md:py-9
        "
      >
        <p
          className={`text-[1.35rem] text-black sm:text-2xl ${fonts.bricolage_grot500.className}`}
        >
          Hi CoCreator!
        </p>

        {messages.length > 0 || isLoading ? (
          <div
            className="mt-5 flex max-h-[min(42svh,22rem)] flex-col gap-3 overflow-y-auto pr-1 sm:mt-6"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:text-[0.9375rem] ${
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

            {isLoading ? (
              <p className="text-sm text-slate-400">Thinking…</p>
            ) : null}

            <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden />
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error.message}
          </p>
        ) : null}

        <form
          onSubmit={onSubmit}
          className={`relative ${messages.length > 0 || isLoading || error ? 'mt-5 sm:mt-6' : 'mt-7 sm:mt-8'}`}
        >
          <label htmlFor="contact-chat-input" className="sr-only">
            Type here for assistance
          </label>
          <input
            id="contact-chat-input"
            name="message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type here for assistance..."
            autoComplete="off"
            className="
              w-full rounded-full border border-slate-200 bg-white py-3.5 pl-5 pr-14
              text-base text-slate-900 outline-none transition
              placeholder:text-slate-400
              focus:border-sanmarino/50 focus:ring-2 focus:ring-sanmarino/15
              sm:py-4 sm:pl-6 sm:pr-16
            "
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="
              absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center
              rounded-full bg-sanmarino text-casablanca shadow-sm transition
              hover:bg-chambray disabled:cursor-not-allowed disabled:opacity-40
              sm:right-2 sm:h-10 sm:w-10
            "
          >
            <ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  )
}
