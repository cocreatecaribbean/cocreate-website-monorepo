export type ThreadAttachmentLike = {
  id: string
  fileName?: string
  mimeType?: string
  createdAt?: string
}

export type ThreadMessageLike = {
  id: string
  attachments?: ThreadAttachmentLike[]
}

export type ThreadRequestLike = {
  messages?: ThreadMessageLike[]
  attachments?: ThreadAttachmentLike[]
  messageCount?: number
}

/** Prefer explicit message attachment links; fall back to legacy request-level bucketing. */
export function indexAttachmentsByMessage<
  TMessage extends ThreadMessageLike & { createdAt: string },
  TAttachment extends ThreadAttachmentLike,
>(
  messages: TMessage[],
  attachments?: TAttachment[],
): Map<number, TAttachment[]> {
  const map = new Map<number, TAttachment[]>()
  if (messages.length === 0) return map

  messages.forEach((message, index) => {
    if (message.attachments?.length) {
      map.set(index, message.attachments as TAttachment[])
    }
  })

  if (!attachments?.length) return map

  const linkedIds = new Set(
    [...map.values()].flat().map((attachment) => attachment.id),
  )
  const unlinked = attachments.filter((attachment) => !linkedIds.has(attachment.id))
  if (!unlinked.length) return map

  for (const attachment of unlinked) {
    const at = attachment.createdAt
      ? new Date(attachment.createdAt).getTime()
      : new Date(messages[messages.length - 1]!.createdAt).getTime()

    let index = messages.findIndex((msg, i) => {
      const start = new Date(msg.createdAt).getTime()
      const end = messages[i + 1]
        ? new Date(messages[i + 1]!.createdAt).getTime()
        : Number.POSITIVE_INFINITY
      return at >= start && at < end
    })

    if (index < 0) {
      index = messages.length - 1
    }

    const bucket = map.get(index) ?? []
    bucket.push(attachment)
    map.set(index, bucket)
  }

  return map
}

export function mergeRequestMessageIntoThread<
  TRequest extends ThreadRequestLike,
  TMessage extends ThreadMessageLike,
>(old: TRequest, message: TMessage): TRequest {
  const existingIndex = old.messages?.findIndex((entry) => entry.id === message.id) ?? -1
  const messageAttachments = message.attachments ?? []

  let messages: TMessage[]
  if (existingIndex >= 0) {
    messages = [...(old.messages ?? [])] as TMessage[]
    const existing = messages[existingIndex]!
    messages[existingIndex] = {
      ...existing,
      ...message,
      attachments: messageAttachments.length ? messageAttachments : existing.attachments,
    }
  } else {
    messages = [...(old.messages ?? []), message] as TMessage[]
  }

  const requestAttachments = [...(old.attachments ?? [])]
  for (const attachment of messageAttachments) {
    if (!requestAttachments.some((entry) => entry.id === attachment.id)) {
      requestAttachments.push(attachment)
    }
  }

  return {
    ...old,
    messages,
    attachments: requestAttachments.length ? requestAttachments : old.attachments,
    messageCount: messages.length,
  }
}

export function canRemoveThreadAttachment(input: {
  messageId: string
  messageAuthorRole: string
  attachmentUploadedByUserId?: string
  currentUserId?: string | null
  viewerRole: 'ADMIN' | 'CLIENT'
  isCoreTeam?: boolean
  readOnly?: boolean
}): boolean {
  if (input.readOnly) return false
  if (input.messageId === 'initial' || input.messageId.startsWith('pending-')) return false

  if (input.viewerRole === 'CLIENT') {
    if (input.messageAuthorRole !== 'CLIENT') return false
    if (input.attachmentUploadedByUserId && input.currentUserId) {
      return input.attachmentUploadedByUserId === input.currentUserId
    }
    return true
  }

  if (input.isCoreTeam) return true
  return Boolean(
    input.currentUserId &&
      input.attachmentUploadedByUserId &&
      input.attachmentUploadedByUserId === input.currentUserId,
  )
}
