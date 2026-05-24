import type { ReactNode } from 'react'

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
    <header className="relative z-10 shrink-0 border-b border-chambray/8 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5 lg:px-8 xl:px-10">
      <p className="text-xs font-medium uppercase tracking-wide text-sanmarino sm:text-sm sm:normal-case sm:tracking-normal">
        {eyebrow}
      </p>

      {inlineAction ? (
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-xl font-semibold leading-snug text-chambray sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          <div className="shrink-0">{action}</div>
        </div>
      ) : (
        <>
          <h1 className="mt-1 text-xl font-semibold leading-snug text-chambray sm:mt-0.5 sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {description}
            </p>
          ) : null}
          {action ? (
            <div className="mt-4 w-full sm:mt-3 sm:w-auto">{action}</div>
          ) : null}
        </>
      )}
    </header>
  )
}
