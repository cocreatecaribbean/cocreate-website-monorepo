import {
  formatRetrievedContext,
  MARKETING_RETRIEVE_TOP_K,
  retrieveMarketingContext,
} from '@cocreate/ai-core'
import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import {
  getAssistantSystemPrompt,
  getLatestUserText,
  isPortalAssistantContext,
} from '@/lib/assistant/prompts'

export const maxDuration = 30

type ChatRequestBody = {
  messages: UIMessage[]
  context?: string
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error:
          'Chat is not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY in Doppler.',
      },
      { status: 503 },
    )
  }

  let body: ChatRequestBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const url = new URL(req.url)
  const contextParam =
    body.context ?? url.searchParams.get('context') ?? 'marketing'

  if (isPortalAssistantContext(contextParam)) {
    return Response.json(
      {
        error:
          'This assistant context is not available on the marketing site yet.',
      },
      { status: 501 },
    )
  }

  const messages = body.messages ?? []
  const latestUserText = getLatestUserText(messages)
  const chunks = latestUserText
    ? await retrieveMarketingContext(latestUserText, MARKETING_RETRIEVE_TOP_K)
    : []
  const retrievedContext = formatRetrievedContext(chunks)

  const system = getAssistantSystemPrompt('marketing', retrievedContext)

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
    system,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
