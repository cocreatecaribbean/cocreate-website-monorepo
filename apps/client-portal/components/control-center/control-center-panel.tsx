'use client'

import ControlCenterContent from '@/components/control-center/control-center-content'
import ControlCenterLayout from '@/components/control-center/control-center-layout'
import { alkatra600, bricolage_grot600 } from '@/styles/fonts'

type ControlCenterPanelProps = {
  organizationName?: string | null
}

export default function ControlCenterPanel({ organizationName }: ControlCenterPanelProps) {
  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-gradient-hero portal-shine-hover portal-animate-in relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sanmarino/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-casablanca/15 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <p className="portal-eyebrow">Workspace</p>
          <h2
            className={`brand-gradient-text mt-2 bg-linear-to-r from-chambray via-sanmarino to-chambray bg-clip-text text-xl text-transparent sm:text-2xl ${alkatra600.className}`}
          >
            Control Center
          </h2>
          <p
            className={`mt-2 max-w-2xl text-sm leading-relaxed text-app-muted ${bricolage_grot600.className}`}
          >
            Projects, approvals, files, and messages in one place. Use the sidebar to jump
            straight to what you need.
          </p>
        </div>
      </section>

      <section className="portal-sl-frame portal-animate-in portal-animate-in-delay-1 overflow-hidden">
        <ControlCenterLayout organizationName={organizationName}>
          {(activeView, projectsListKey) => (
            <ControlCenterContent activeView={activeView} projectsListKey={projectsListKey} />
          )}
        </ControlCenterLayout>
      </section>
    </div>
  )
}
