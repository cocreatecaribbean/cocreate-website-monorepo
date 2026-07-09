import { AsyncLocalStorage } from 'node:async_hooks'

export type TenantContextStore = {
  organizationId: string
}

const storage = new AsyncLocalStorage<TenantContextStore>()

export const tenantContext = {
  run<T>(organizationId: string, fn: () => T): T {
    return storage.run({ organizationId }, fn)
  },

  getOrganizationId(): string | undefined {
    return storage.getStore()?.organizationId
  },
}

/** Models queried with an organizationId column — tenant scope applies when context is set. */
export const TENANT_SCOPED_MODELS = new Set([
  'User',
  'ClientProject',
  'PortalNotification',
  'SocialListeningSnapshot',
  'ClientTeamInviteRequest',
  'OrganizationBrandAsset',
  'OrgInboxConversation',
  'OrgInboxAttachment',
  'SocialListeningSubscription',
  'SocialListeningSetup',
])

export function mergeTenantScope<T extends { where?: Record<string, unknown> }>(
  organizationId: string | undefined,
  model: string,
  args: T,
): T {
  if (!organizationId || !TENANT_SCOPED_MODELS.has(model)) {
    return args
  }

  const where = args.where ?? {}
  if ('organizationId' in where) {
    return args
  }

  return {
    ...args,
    where: {
      ...where,
      organizationId,
    },
  }
}

export function mergeSoftDeleteScope<T extends { where?: Record<string, unknown> }>(
  model: string,
  args: T,
): T {
  const softDeleteModels = new Set(['Organization', 'User', 'ClientProject'])
  if (!softDeleteModels.has(model)) {
    return args
  }

  const where = args.where ?? {}
  if ('deletedAt' in where) {
    return args
  }

  return {
    ...args,
    where: {
      ...where,
      deletedAt: null,
    },
  }
}
