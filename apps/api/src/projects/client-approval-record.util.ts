import type { Prisma } from '@cocreate/database'

type ApprovalRecordCreateInput = Omit<
  Prisma.ClientApprovalRecordUncheckedCreateInput,
  'recordAttachments'
>

export async function createClientApprovalRecord(
  tx: Prisma.TransactionClient,
  data: ApprovalRecordCreateInput,
  attachmentIds: string[] = [],
) {
  const uniqueAttachmentIds = [...new Set(attachmentIds.filter(Boolean))]

  const record = await tx.clientApprovalRecord.create({ data })

  if (uniqueAttachmentIds.length > 0) {
    await tx.clientApprovalRecordAttachment.createMany({
      data: uniqueAttachmentIds.map((attachmentId) => ({
        approvalRecordId: record.id,
        attachmentId,
      })),
      skipDuplicates: true,
    })
  }

  return record
}

export function approvalRecordAttachmentIds(record: {
  approvedAttachmentId?: string | null
  recordAttachments?: Array<{ attachmentId: string }>
}): string[] {
  const fromLinks = record.recordAttachments?.map((link) => link.attachmentId) ?? []
  if (fromLinks.length > 0) {
    return fromLinks
  }
  return record.approvedAttachmentId ? [record.approvedAttachmentId] : []
}
