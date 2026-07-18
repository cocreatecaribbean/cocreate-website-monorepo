import {
  formatRetrievedContext,
  PORTAL_RETRIEVE_TOP_K,
  retrievePortalContext,
} from '@cocreate/ai-core'
import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import {
  getAdminCenterSystemPrompt,
  getLatestUserText,
  type PortalRouteContext,
} from '@/lib/assistant/prompts'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

export const maxDuration = 30

type ChatRequestBody = {
  messages: UIMessage[]
  context?: string
  pathname?: string
  search?: string
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_GATEWAY_API_KEY
  if (!apiKey) {
    return Response.json(
      {
        error:
          'Chat is not configured. Set OPENAI_API_KEY or AI_GATEWAY_API_KEY.',
      },
      { status: 503 },
    )
  }

  const env = getSupabasePublicEnv()
  if (env) {
    try {
      const supabase = await createSupabaseServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: ChatRequestBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const messages = body.messages ?? []
  const latestUserText = getLatestUserText(messages)
  const chunks = latestUserText
    ? await retrievePortalContext(latestUserText, {
        audience: 'admin-center',
        topK: PORTAL_RETRIEVE_TOP_K,
      })
    : []
  const retrievedContext = formatRetrievedContext(chunks)

  const route: PortalRouteContext = {
    pathname: typeof body.pathname === 'string' ? body.pathname : undefined,
    search: typeof body.search === 'string' ? body.search : undefined,
  }

  const system = getAdminCenterSystemPrompt(retrievedContext, route)

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
    system,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
