import { isApprovalCommentMine } from '@cocreate/app-ui/approval-comment-message-list-utils'

describe('isApprovalCommentMine', () => {
  it('treats CLIENT comments as mine for client viewers', () => {
    expect(isApprovalCommentMine({ authorRole: 'CLIENT' }, 'CLIENT')).toBe(true)
    expect(isApprovalCommentMine({ authorRole: 'ADMIN' }, 'CLIENT')).toBe(false)
    expect(isApprovalCommentMine({ authorRole: 'COLLABORATOR' }, 'CLIENT')).toBe(false)
  })

  it('treats ADMIN and COLLABORATOR comments as mine for admin viewers', () => {
    expect(isApprovalCommentMine({ authorRole: 'ADMIN' }, 'ADMIN')).toBe(true)
    expect(isApprovalCommentMine({ authorRole: 'COLLABORATOR' }, 'ADMIN')).toBe(true)
    expect(isApprovalCommentMine({ authorRole: 'CLIENT' }, 'ADMIN')).toBe(false)
  })
})
