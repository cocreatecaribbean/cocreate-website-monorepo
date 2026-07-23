import type { ProjectRequestMessage } from '@/lib/projects/types'

export function isPendingRequestMessage(id: string): boolean {
  return id.startsWith('pending-')
}

export type OptimisticAttachmentStub = NonNullable<
  ProjectRequestMessage['attachments']
>[number] & {
  localPreviewUrl?: string
  uploading?: boolean
}

export function buildOptimisticAttachments(params: {
  selectedIds: string[]
  pendingFiles: File[]
  libraryById?: Map<string, { fileName: string; mimeType: string }>
}): { attachments: OptimisticAttachmentStub[]; objectUrls: string[] } {
  const objectUrls: string[] = []
  const libraryAttachments: OptimisticAttachmentStub[] = params.selectedIds.map((id) => {
    const known = params.libraryById?.get(id)
    return {
      id,
      projectId: '',
      requestId: null,
      fileName: known?.fileName ?? 'Attached file',
      mimeType: known?.mimeType ?? 'application/octet-stream',
      sizeBytes: 0,
      createdAt: new Date().toISOString(),
      reviewRequested: false,
      approvedAt: null,
      approvedByUserId: null,
      changesRequestedAt: null,
      uploading: true,
    }
  })

  const pendingAttachments: OptimisticAttachmentStub[] = params.pendingFiles.map(
    (file, index) => {
      const localPreviewUrl = URL.createObjectURL(file)
      objectUrls.push(localPreviewUrl)
      return {
        id: `pending-file-${index}-${crypto.randomUUID()}`,
        projectId: '',
        requestId: null,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
        reviewRequested: false,
        approvedAt: null,
        approvedByUserId: null,
        changesRequestedAt: null,
        localPreviewUrl,
        uploading: true,
      }
    },
  )

  return {
    attachments: [...libraryAttachments, ...pendingAttachments],
    objectUrls,
  }
}

export function revokeOptimisticObjectUrls(urls: string[]) {
  for (const url of urls) {
    URL.revokeObjectURL(url)
  }
}

export function createOptimisticRequestMessage(params: {
  requestId: string
  body: string
  authorRole: 'ADMIN' | 'CLIENT'
  authorUserId?: string
  attachments?: OptimisticAttachmentStub[]
}): ProjectRequestMessage {
  const attachments = params.attachments?.length ? params.attachments : undefined
  return {
    id: `pending-${crypto.randomUUID()}`,
    requestId: params.requestId,
    authorUserId: params.authorUserId ?? '',
    authorEmail: null,
    authorRole: params.authorRole,
    body: params.body,
    createdAt: new Date().toISOString(),
    attachmentIds: attachments?.map((item) => item.id),
    attachments,
  }
}
