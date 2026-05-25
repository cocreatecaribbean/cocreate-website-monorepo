import CoCreateLogo from '@/components/cocreate-logo'
import OrganizationLogo from '@/components/organization-logo'
import { bricolage_grot600 } from '@/styles/fonts'

type PortalBrandHeaderProps = {
  organizationName?: string | null
  organizationLogoUrl?: string | null
  priority?: boolean
}

export default function PortalBrandHeader({
  organizationName,
  organizationLogoUrl,
  priority = false,
}: PortalBrandHeaderProps) {
  const showClient = Boolean(organizationName?.trim())

  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <CoCreateLogo priority={priority} />
      {showClient ? (
        <>
          <span
            className="hidden h-8 w-px shrink-0 bg-chambray/15 sm:block"
            aria-hidden
          />
          <div className="flex min-w-0 items-center gap-2">
            <OrganizationLogo
              name={organizationName!}
              logoUrl={organizationLogoUrl}
              size="md"
            />
            <span
              className={`hidden truncate text-sm text-chambray lg:inline ${bricolage_grot600.className}`}
            >
              {organizationName}
            </span>
          </div>
        </>
      ) : null}
    </div>
  )
}
