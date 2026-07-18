import { PgVector } from '@mastra/pg'
import { DEFAULT_EMBEDDING_MODEL } from '../models'

/** pgvector index for marketing About / CoCreate knowledge */
export const MARKETING_ABOUT_INDEX = 'marketing_about'

/** pgvector index for portal how-to help (client + admin corpora) */
export const PORTAL_HELP_INDEX = 'portal_help'

/** OpenAI text-embedding-3-small default dimensions */
export const MARKETING_EMBEDDING_DIMENSIONS = 1536

export const MARKETING_ABOUT_SOURCE_ID = 'about-cocreate-rag-optimized'

/** Curated marketing site pages markdown */
export const MARKETING_SITE_PAGES_SOURCE_ID = 'site-pages'

export const PORTAL_HELP_CLIENT_SOURCE_ID = 'client-portal'
export const PORTAL_HELP_ADMIN_SOURCE_ID = 'admin-center'

export type PortalHelpAudience = 'client-portal' | 'admin-center'

export function portalHelpSourceForAudience(
  audience: PortalHelpAudience,
): string {
  return audience === 'admin-center'
    ? PORTAL_HELP_ADMIN_SOURCE_ID
    : PORTAL_HELP_CLIENT_SOURCE_ID
}

export function resolvePgConnectionString(): string {
  const direct = process.env.DIRECT_URL?.trim()
  const pooled = process.env.DATABASE_URL?.trim()
  const connectionString = direct || pooled
  if (!connectionString) {
    throw new Error(
      'Postgres is not configured. Set DIRECT_URL (preferred) or DATABASE_URL for Mastra RAG.',
    )
  }
  return connectionString
}

export function createMarketingPgVector(id = 'marketing-pg-vector'): PgVector {
  return new PgVector({
    id,
    connectionString: resolvePgConnectionString(),
  })
}

/** Same Postgres store; separate id for portal ingest/retrieve clients. */
export function createPortalPgVector(id = 'portal-pg-vector'): PgVector {
  return new PgVector({
    id,
    connectionString: resolvePgConnectionString(),
  })
}

export function resolveEmbeddingModelName(): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL
}
