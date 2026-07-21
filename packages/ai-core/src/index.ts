export {
  DEFAULT_CHAT_MODEL,
  DEFAULT_SUMMARY_MODEL,
  DEFAULT_EMBEDDING_MODEL,
  createOpenAiProvider,
  getChatModel,
  getSummaryChatModel,
  resolveChatModelName,
  resolveSummaryChatModelName,
  resolveOpenAiApiKey,
} from './models'
export {
  ASSISTANT_TIMEZONE,
  formatAssistantRuntimeContext,
} from './runtime-context'
export { generateStructured } from './generate-structured'
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
} from './rag/constants'
export {
  retrieveMarketingContext,
  retrievePortalContext,
  formatRetrievedContext,
  embedTexts,
  embedQuery,
  MARKETING_RETRIEVE_TOP_K,
  PORTAL_RETRIEVE_TOP_K,
  type RetrievedChunk,
} from './rag/retrieve'
export { cleanPdfText, isJunkChunkText } from './rag/chunk-quality'
