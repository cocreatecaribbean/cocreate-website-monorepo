import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'

export const maxDuration = 30

const SYSTEM_PROMPT = `You are the CoCreate Caribbean contact assistant on the marketing website.
Help visitors learn about services, work, and how to get in touch.
Be warm, concise, and professional. If you do not know something, suggest they email the team rather than inventing facts.`

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error:
          'Chat is not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY in apps/web/.env.local.',
      },
      { status: 503 },
    )
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
