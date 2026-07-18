export {
  MARKETING_ABOUT_INDEX,
  MARKETING_ABOUT_SOURCE_ID,
  MARKETING_SITE_PAGES_SOURCE_ID,
  MARKETING_EMBEDDING_DIMENSIONS,
  PORTAL_HELP_INDEX,
  PORTAL_HELP_CLIENT_SOURCE_ID,
  PORTAL_HELP_ADMIN_SOURCE_ID,
  createMarketingPgVector,
  createPortalPgVector,
  portalHelpSourceForAudience,
  resolvePgConnectionString,
  resolveEmbeddingModelName,
  type PortalHelpAudience,
} from './constants'
export {
  retrieveMarketingContext,
  retrievePortalContext,
  formatRetrievedContext,
  embedTexts,
  embedQuery,
  MARKETING_RETRIEVE_TOP_K,
  PORTAL_RETRIEVE_TOP_K,
  type RetrievedChunk,
} from './retrieve'
export { cleanPdfText, isJunkChunkText } from './chunk-quality'
