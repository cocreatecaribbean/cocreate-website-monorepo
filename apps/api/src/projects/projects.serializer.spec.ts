import {
  countPendingCheckpointMessages,
  serializeProject,
  serializeRequest,
} from './projects.serializer'

describe('projects.serializer overview payloads', () => {
  it('counts pending checkpoints from overview request checkpoint metadata', () => {
    const project = {
      id: 'proj-1',
      organizationId: 'org-1',
      title: 'Test',
      description: 'Desc',
      status: 'ACTIVE',
      phase: 'DISCOVERY',
      createdByUserId: 'user-1',
      approvedByUserId: null,
      completedByUserId: null,
      approvedAt: null,
      completedAt: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
      requests: [
        {
          id: 'req-1',
          projectId: 'proj-1',
          type: 'PROGRESS',
          status: 'OPEN',
          title: 'Progress',
          description: null,
          targetPhase: null,
          createdByUserId: 'user-1',
          resolvedByUserId: null,
          resolvedAt: null,
          cancellationOutcome: null,
          cancellationFeeAmount: null,
          cancellationFeeNotes: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          messages: [
            {
              id: 'msg-1',
              messageKind: 'CHECKPOINT',
              requiresClientApproval: true,
              supersededAt: null,
              clientApprovedAt: null,
            },
          ],
        },
      ],
      attachments: [],
      activities: [],
    }

    const serialized = serializeProject(project)
    expect(serialized.hasPendingCheckpoint).toBe(true)
    expect(serialized.pendingCheckpointCount).toBe(1)
    expect(countPendingCheckpointMessages(project)).toBe(1)
  })

  it('serializes overview requests without message bodies', () => {
    const request = serializeRequest({
      id: 'req-1',
      projectId: 'proj-1',
      type: 'ONBOARDING',
      status: 'OPEN',
      title: 'Onboarding',
      description: 'Initial brief',
      targetPhase: null,
      createdByUserId: 'user-1',
      resolvedByUserId: null,
      resolvedAt: null,
      cancellationOutcome: null,
      cancellationFeeAmount: null,
      cancellationFeeNotes: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      messages: undefined,
      attachments: undefined,
    })

    expect(request.messages).toBeUndefined()
    expect(request.messageCount).toBe(0)
    expect(request.title).toBe('Onboarding')
  })
})
