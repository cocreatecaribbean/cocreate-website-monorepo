export function canSendThreadMessage(
  body: string,
  selectedAttachmentIds: string[],
  pendingFiles: File[],
  uploading: boolean,
): boolean {
  if (uploading) return false
  return (
    body.trim().length > 0 ||
    selectedAttachmentIds.length > 0 ||
    pendingFiles.length > 0
  )
}
