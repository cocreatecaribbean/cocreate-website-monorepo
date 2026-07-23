import type { ProjectOverviewSection } from '@cocreate/types'
import * as fonts from '@/styles/fonts'

function TagPills({ labels }: { labels: string[] }) {
  if (!labels.length) return null
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {labels.map((label) => (
        <li
          key={label}
          className={`rounded-full bg-slate-100 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.08em] ${fonts.bricolage_grot500.className}`}
        >
          <span className="text-gradient-chambray-diagonal">{label}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ProjectOverviewBlock({
  section,
}: {
  section: ProjectOverviewSection
}) {
  const categories = section.categories?.filter(Boolean) ?? []
  const industries = section.industries?.filter(Boolean) ?? []

  return (
    <section className="grid gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
      <div className="flex flex-col gap-8">
        {categories.length > 0 ? (
          <div>
            <p
              className={`text-xs uppercase tracking-[0.16em] text-gradient-chambray-diagonal ${fonts.bricolage_grot600.className}`}
            >
              Category
            </p>
            <TagPills labels={categories} />
          </div>
        ) : null}
        {industries.length > 0 ? (
          <div>
            <p
              className={`text-xs uppercase tracking-[0.16em] text-gradient-chambray-diagonal ${fonts.bricolage_grot600.className}`}
            >
              Industry
            </p>
            <TagPills labels={industries} />
          </div>
        ) : null}
      </div>
      <div
        className={`text-lg leading-relaxed md:text-xl ${fonts.bricolage_grot400.className}`}
      >
        <p className="whitespace-pre-line text-gradient-chambray-diagonal">{section.body}</p>
      </div>
    </section>
  )
}
