import {defineField, defineType} from 'sanity'

/** Keep in sync with apps/web/site-info/work-page-data.ts */
export const WORK_PAGE_DEFAULT_TITLE_LINE_ONE = 'Our'
export const WORK_PAGE_DEFAULT_TITLE_LINE_TWO = 'Work'

type ProjectSlugRow = {
  _key?: string
  slug?: {current?: string}
}

export const workPage = defineType({
  name: 'workPage',
  title: 'Work page',
  type: 'document',
  fields: [
    defineField({
      name: 'titleLineOne',
      title: 'Title line one',
      description: 'Default Work index headline (first line). Filter views override this.',
      type: 'string',
      initialValue: WORK_PAGE_DEFAULT_TITLE_LINE_ONE,
    }),
    defineField({
      name: 'titleLineTwo',
      title: 'Title line two',
      description: 'Default Work index headline (second line).',
      type: 'string',
      initialValue: WORK_PAGE_DEFAULT_TITLE_LINE_TWO,
    }),
    defineField({
      name: 'projects',
      title: 'Projects',
      description:
        'Each project is a section on this page. Use Add item at the bottom (same as joh FX currencies). Array order = Work grid order.',
      type: 'array',
      of: [
        {
          type: 'workProject',
          initialValue: {
            title: 'Untitled project',
            category: 'Digital',
            featured: false,
          },
        },
      ],
      validation: (rule) =>
        rule.custom((projects) => {
          const rows = (projects ?? []) as ProjectSlugRow[]
          const seen = new Set<string>()
          for (const row of rows) {
            const slug = row?.slug?.current?.trim().toLowerCase()
            if (!slug) continue
            if (seen.has(slug)) {
              return `Duplicate project slug "${slug}" — each project needs a unique slug`
            }
            seen.add(slug)
          }
          return true
        }),
    }),
    defineField({
      name: 'projectsMigratedFromDocuments',
      title: 'Projects migrated',
      type: 'boolean',
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Work page'}
    },
  },
})
