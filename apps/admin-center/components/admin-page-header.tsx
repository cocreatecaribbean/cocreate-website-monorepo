import type { ReactNode } from 'react'
import { alkatra600, bricolage_grot500 } from '@/styles/fonts'

type AdminPageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  const inlineAction = action && !description

  return (
    <header className="admin-surface relative z-10 shrink-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 xl:px-10">
      <p className="admin-eyebrow">{eyebrow}</p>

      {inlineAction ? (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className={`admin-display min-w-0 flex-1 ${alkatra600.className}`}>{title}</h1>
          <div className="w-full shrink-0 sm:w-auto">{action}</div>
        </div>
      ) : (
        <>
          <h1 className={`admin-display mt-2 ${alkatra600.className}`}>{title}</h1>
          {description ? (
            <p
              className={`mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 ${bricolage_grot500.className}`}
            >
              {description}
            </p>
          ) : null}
          {action ? <div className="mt-4 w-full sm:mt-3 sm:w-auto">{action}</div> : null}
        </>
      )}
    </header>
  )
}
