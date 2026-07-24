import {defineArrayMember, defineField, type FieldDefinition} from 'sanity'
import {HexColorInput} from '../components/HexColorInput'

const HEX_PATTERN = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/

export function isValidHex(value: unknown): boolean {
  return typeof value === 'string' && HEX_PATTERN.test(value.trim())
}

const FILL_MODE_LIST = [
  {title: 'Default (CoCreate / muted)', value: 'default'},
  {title: 'Solid brand color', value: 'solid'},
  {title: 'Custom gradient', value: 'gradient'},
]

/**
 * Build Default | Solid | Gradient fill fields with HexColorInput.
 * When prefix is '', mode field is `fillMode` and colors are unprefixed (callout headline).
 * When prefix is 'sub', mode is `subFillMode` and colors are `subSolidColor`, etc.
 */
export function brandFillFields(options: {
  prefix: '' | 'title' | 'client' | 'sub'
  label: string
  modeDescription: string
}): FieldDefinition[] {
  const {prefix, label, modeDescription} = options
  const modeName = prefix ? `${prefix}FillMode` : 'fillMode'
  const solidName = prefix ? `${prefix}SolidColor` : 'solidColor'
  const fromName = prefix ? `${prefix}GradientFrom` : 'gradientFrom'
  const viaName = prefix ? `${prefix}GradientVia` : 'gradientVia'
  const toName = prefix ? `${prefix}GradientTo` : 'gradientTo'
  const angleName = prefix ? `${prefix}GradientAngle` : 'gradientAngle'

  const modeIs = (mode: string) => (parent: Record<string, unknown> | undefined) =>
    parent?.[modeName] !== mode

  return [
    defineField({
      name: modeName,
      title: `${label} fill`,
      description: modeDescription,
      type: 'string',
      options: {list: FILL_MODE_LIST, layout: 'radio'},
      initialValue: 'default',
    }),
    defineField({
      name: solidName,
      title: `${label} brand color`,
      type: 'string',
      components: {input: HexColorInput},
      hidden: ({parent}) => modeIs('solid')(parent as Record<string, unknown> | undefined),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          if (parent?.[modeName] !== 'solid') return true
          if (!value) return 'Pick a brand color'
          return isValidHex(value) ? true : 'Enter a hex color like #39419a'
        }),
    }),
    defineField({
      name: fromName,
      title: `${label} gradient from`,
      type: 'string',
      components: {input: HexColorInput},
      hidden: ({parent}) => modeIs('gradient')(parent as Record<string, unknown> | undefined),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          if (parent?.[modeName] !== 'gradient') return true
          if (!value) return 'Add a start color'
          return isValidHex(value) ? true : 'Enter a hex color like #39419a'
        }),
    }),
    defineField({
      name: viaName,
      title: `${label} gradient via (optional)`,
      type: 'string',
      components: {input: HexColorInput},
      hidden: ({parent}) => modeIs('gradient')(parent as Record<string, unknown> | undefined),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          if (parent?.[modeName] !== 'gradient' || !value) return true
          return isValidHex(value) ? true : 'Enter a hex color like #39419a'
        }),
    }),
    defineField({
      name: toName,
      title: `${label} gradient to`,
      type: 'string',
      components: {input: HexColorInput},
      hidden: ({parent}) => modeIs('gradient')(parent as Record<string, unknown> | undefined),
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as Record<string, unknown> | undefined
          if (parent?.[modeName] !== 'gradient') return true
          if (!value) return 'Add an end color'
          return isValidHex(value) ? true : 'Enter a hex color like #39419a'
        }),
    }),
    defineField({
      name: angleName,
      title: `${label} gradient angle`,
      description: 'Degrees. 90 = left to right (default).',
      type: 'number',
      initialValue: 90,
      hidden: ({parent}) => modeIs('gradient')(parent as Record<string, unknown> | undefined),
      validation: (rule) => rule.min(0).max(360),
    }),
  ]
}

export const brandColorsField = defineField({
  name: 'brandColors',
  title: 'Brand colors',
  description:
    'Define this project’s brand colors once; use the swatches on title, client, and callout fills.',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'object',
      name: 'brandColor',
      fields: [
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'hex',
          title: 'Color',
          type: 'string',
          components: {input: HexColorInput},
          validation: (rule) =>
            rule.required().custom((value) =>
              isValidHex(value) ? true : 'Enter a hex color like #39419a',
            ),
        }),
      ],
      preview: {
        select: {title: 'label', subtitle: 'hex'},
        prepare({title, subtitle}) {
          return {
            title: title || 'Color',
            subtitle: subtitle || undefined,
          }
        },
      },
    }),
  ],
})
