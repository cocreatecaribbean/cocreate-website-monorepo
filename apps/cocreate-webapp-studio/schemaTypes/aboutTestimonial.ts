import {defineField, defineType} from 'sanity'

/** Embedded on aboutPage.testimonials — not a standalone document. */
export const aboutTestimonial = defineType({
  name: 'aboutTestimonial',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'jobTitle',
      title: 'Job title',
      type: 'string',
      description: 'Optional role shown under the name (e.g. Brand Manager).',
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'company', media: 'photo', jobTitle: 'jobTitle'},
    prepare({title, subtitle, media, jobTitle}) {
      const role = typeof jobTitle === 'string' ? jobTitle.trim() : ''
      const company = typeof subtitle === 'string' ? subtitle.trim() : ''
      return {
        title: title || 'Testimonial',
        subtitle: [role, company].filter(Boolean).join(' · ') || undefined,
        media,
      }
    },
  },
})
