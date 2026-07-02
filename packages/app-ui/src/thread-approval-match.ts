export type ThreadApprovalMatchItem = {
  requestId: string
  messageId: string
  attachment?: { id: string }
}

export function approvalItemsForMessage<T extends ThreadApprovalMatchItem>(
  messageId: string,
  requestId: string,
  attachmentIds: string[],
  items: T[],
): T[] {
  const byMessage = items.filter(
    (item) => item.requestId === requestId && item.messageId === messageId,
  )
  if (byMessage.length > 0) return byMessage

  const idSet = new Set(attachmentIds)
  return items.filter(
    (item) =>
      item.requestId === requestId &&
      Boolean(item.attachment?.id) &&
      idSet.has(item.attachment!.id),
  )
}

export function nonApprovalMessageAttachments<T extends { id: string }>(
  attachments: T[] | undefined,
  items: Array<{ attachment?: { id: string } }>,
): T[] {
  const pendingIds = new Set(
    items.map((item) => item.attachment?.id).filter(Boolean) as string[],
  )
  return (attachments ?? []).filter((attachment) => !pendingIds.has(attachment.id))
}
