import type { UserRole, UserStatus } from '@cocreate/database'

export type ClientPrimaryContact = {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}

export type ClientOrganizationRosterItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isSocialListeningSubscriber: boolean
  brand24ProjectId: string | null
  createdAt: Date
  updatedAt: Date
  primaryContact: ClientPrimaryContact | null
}

export type InviteClientResult = {
  organization: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    isSocialListeningSubscriber: boolean
    brand24ProjectId: string | null
  }
  user: ClientPrimaryContact
  invitation: {
    provider: 'supabase-auth'
    status: 'sent' | 'stubbed' | 'dev_link'
    invitationId: string
    devSignInUrl?: string
  }
}
