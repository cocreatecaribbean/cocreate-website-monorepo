function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

type OrganizationLogoProps = {
  name: string
  logoUrl?: string | null
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: { box: 'h-8 w-8 text-xs', img: 'h-8 max-w-[120px]' },
  md: { box: 'h-10 w-10 text-sm', img: 'h-10 max-w-[160px]' },
}

export default function OrganizationLogo({
  name,
  logoUrl,
  size = 'md',
}: OrganizationLogoProps) {
  const sizes = sizeClasses[size]

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- client logos are arbitrary external URLs
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={`${sizes.img} w-auto object-contain`}
      />
    )
  }

  const initials = initialsFromName(name) || '?'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-chambray/10 font-semibold text-chambray dark:bg-casablanca dark:text-chambray ${sizes.box}`}
      title={name}
      aria-label={`${name} (no logo uploaded)`}
    >
      {initials}
    </span>
  )
}
