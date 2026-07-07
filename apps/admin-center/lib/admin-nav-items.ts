import {
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Radio,
  Settings2,
  Shield,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { AdminNavId } from '@/lib/admin-nav'

export type AdminNavItem = {
  id: AdminNavId
  label: string
  href: string
  description: string
  icon: LucideIcon
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    description: 'Agency overview, activity, and quick actions',
    icon: LayoutDashboard,
  },
  {
    id: 'project-center',
    label: 'Project Center',
    href: '/project-center',
    description: 'Active projects, pipelines, and delivery status',
    icon: FolderKanban,
  },
  {
    id: 'clients',
    label: 'Clients',
    href: '/client-access',
    description: 'Client organizations, access, and workspaces',
    icon: Users,
  },
  {
    id: 'messages',
    label: 'Messages',
    href: '/messages',
    description: 'Team and client conversations across accounts',
    icon: MessageSquare,
  },
  {
    id: 'social-listening',
    label: 'Social Listening',
    href: '/social-listening',
    description: 'Brand mentions, analytics, and listening setups',
    icon: Radio,
  },
  {
    id: 'team',
    label: 'Team',
    href: '/team',
    description: 'Agency members, roles, and permissions',
    icon: Shield,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    description: 'Your account details and preferences',
    icon: UserCircle,
  },
]

export const ADMIN_SUPER_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'agency-profile',
    label: 'Profile options',
    href: '/settings/agency-profile',
    description: 'Agency branding, defaults, and configuration',
    icon: Settings2,
  },
]
