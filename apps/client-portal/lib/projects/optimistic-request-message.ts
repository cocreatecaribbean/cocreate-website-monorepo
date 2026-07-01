import type { ProjectRequestMessage } from '@/lib/projects/api-types'

export function isPendingRequestMessage(id: string): boolean {
  return id.startsWith('pending-')
}

export function createOptimisticRequestMessage(params: {
  requestId: string
  body: string
  authorRole: 'ADMIN' | 'CLIENT'
  authorUserId?: string
}): ProjectRequestMessage {
  return {
    id: `pending-${crypto.randomUUID()}`,
    requestId: params.requestId,
    authorUserId: params.authorUserId ?? '',
    authorEmail: null,
    authorRole: params.authorRole,
    body: params.body,
    createdAt: new Date().toISOString(),
  }
}
