# Backend & contact chat

## Monorepo layout

| Package / app | Purpose |
|---------------|---------|
| `apps/web` | Next.js marketing site |
| `apps/api` | NestJS 11 REST API |
| `packages/database` | Prisma 7 schema + generated client |

## Local development

1. Copy env files (see root `.env.example`).
2. Generate Prisma client: `pnpm db:generate`
3. Optional DB: `pnpm db:push` (requires Postgres on `DATABASE_URL`)
4. Run everything: `pnpm dev` (Turbo runs web + api + studio)
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - API health: http://localhost:3001/health

### Prisma build scripts (pnpm)

If `prisma generate` fails, approve package builds once:

```bash
pnpm approve-builds
# allow @prisma/engines and prisma
```

## Contact page chat (Vercel AI SDK)

- UI: `apps/web/components/contact/contact-chat.tsx` (placeholder — swap in your design)
- Route: `apps/web/app/api/chat/route.ts` (`streamText` + OpenAI provider)
- Env: `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` in `apps/web/.env.local`

[Vercel AI SDK](https://sdk.vercel.ai/) · [AI Gateway](https://vercel.com/docs/ai-gateway) · [Chat template](https://github.com/vercel/ai-chatbot)

### Next steps (when design is ready)

1. Restyle `ContactChat` — keep `useChat` + `sendMessage({ text })`.
2. Persist threads via Nest: POST `/conversations` from `/api/chat` or a dedicated route using `ContactConversation` / `ContactMessage` in Prisma.
3. On Vercel deploy: add env vars in project settings; Gateway auth can use OIDC on Vercel.

## Versions (catalog: `api` / `ai`)

- NestJS 11.1.x
- Prisma 7.8.x
- `ai` 6.x + `@ai-sdk/react` 3.x
