import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini'
export const DEFAULT_SUMMARY_MODEL = 'gpt-4o'
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small'

function readEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return null
}

export function resolveOpenAiApiKey(): string | null {
  return readEnv('OPENAI_API_KEY', 'AI_GATEWAY_API_KEY')
}

export function resolveChatModelName(): string {
  return process.env.OPENAI_CHAT_MODEL?.trim() || DEFAULT_CHAT_MODEL
}

export function resolveSummaryChatModelName(): string {
  return process.env.OPENAI_SUMMARY_MODEL?.trim() || DEFAULT_SUMMARY_MODEL
}

export function createOpenAiProvider() {
  const apiKey = resolveOpenAiApiKey()
  if (!apiKey) {
    throw new Error(
      'AI is not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY.',
    )
  }
  return createOpenAI({ apiKey })
}

export function getChatModel(): LanguageModel {
  const openai = createOpenAiProvider()
  return openai(resolveChatModelName())
}

export function getSummaryChatModel(): LanguageModel {
  const openai = createOpenAiProvider()
  return openai(resolveSummaryChatModelName())
}
