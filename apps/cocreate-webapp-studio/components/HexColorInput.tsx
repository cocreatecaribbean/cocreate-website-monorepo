import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useMemo} from 'react'
import {set, unset, useFormValue, type Path, type StringInputProps} from 'sanity'

const HEX_PATTERN = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/

const COCREATE_PRESETS = [
  {label: 'San Marino', hex: '#406eb5'},
  {label: 'Chambray', hex: '#39419a'},
  {label: 'Casablanca', hex: '#f6b03f'},
] as const

type BrandColorRow = {
  _key?: string
  label?: string
  hex?: string
}

function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (!HEX_PATTERN.test(withHash)) return null
  if (withHash.length === 4) {
    const [, r, g, b] = withHash
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return withHash.toLowerCase()
}

function brandColorsPathFromFieldPath(path: Path): Path | null {
  const projectsIndex = path.findIndex((seg) => seg === 'projects')
  if (projectsIndex === -1) return null
  const projectSeg = path[projectsIndex + 1]
  if (projectSeg === undefined) return null
  return ['projects', projectSeg, 'brandColors']
}

function SwatchButton({
  label,
  hex,
  selected,
  disabled,
  onSelect,
}: {
  label: string
  hex: string
  selected: boolean
  disabled?: boolean
  onSelect: (hex: string) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={`${label} (${hex})`}
      aria-label={`${label} ${hex}`}
      aria-pressed={selected}
      onClick={() => onSelect(hex)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px 4px 4px',
        borderRadius: 8,
        border: selected
          ? '2px solid var(--card-focus-ring-color, #2276fc)'
          : '1px solid var(--card-border-color)',
        background: 'var(--card-bg-color)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: hex,
          border: '1px solid rgba(0,0,0,0.15)',
          flexShrink: 0,
        }}
      />
      <Text size={1}>{label}</Text>
    </button>
  )
}

/** Color picker with CoCreate + per-project brand swatches. */
export function HexColorInput(props: StringInputProps) {
  const {value, onChange, elementProps, readOnly, path} = props
  const hex = typeof value === 'string' ? value : ''
  const normalizedCurrent = normalizeHex(hex)
  const isValid = !hex || Boolean(normalizedCurrent)
  const pickerValue = normalizedCurrent || '#39419a'

  const palettePath = useMemo(() => brandColorsPathFromFieldPath(path), [path])
  // Hook must receive a stable path; use a dummy when outside a project.
  const brandColorsRaw = useFormValue(palettePath ?? ['__no_project_brand_colors__'])

  const projectSwatches = useMemo(() => {
    if (!Array.isArray(brandColorsRaw)) return []
    const seen = new Set<string>()
    const rows: Array<{label: string; hex: string}> = []
    for (const row of brandColorsRaw as BrandColorRow[]) {
      const color = typeof row?.hex === 'string' ? normalizeHex(row.hex) : null
      if (!color || seen.has(color)) continue
      seen.add(color)
      const label = row.label?.trim() || color
      rows.push({label, hex: color})
    }
    return rows
  }, [brandColorsRaw])

  const applyHex = (next: string) => {
    onChange(set(next.toLowerCase()))
  }

  return (
    <Stack space={3}>
      <Stack space={2}>
        <Text size={1} muted>
          CoCreate
        </Text>
        <Flex gap={2} wrap="wrap">
          {COCREATE_PRESETS.map((preset) => (
            <SwatchButton
              key={preset.hex}
              label={preset.label}
              hex={preset.hex}
              selected={normalizedCurrent === preset.hex}
              disabled={readOnly}
              onSelect={applyHex}
            />
          ))}
        </Flex>
      </Stack>

      {projectSwatches.length > 0 ? (
        <Stack space={2}>
          <Text size={1} muted>
            This project
          </Text>
          <Flex gap={2} wrap="wrap">
            {projectSwatches.map((swatch) => (
              <SwatchButton
                key={`${swatch.hex}-${swatch.label}`}
                label={swatch.label}
                hex={swatch.hex}
                selected={normalizedCurrent === swatch.hex}
                disabled={readOnly}
                onSelect={applyHex}
              />
            ))}
          </Flex>
        </Stack>
      ) : palettePath ? (
        <Card padding={3} radius={2} tone="transparent" border>
          <Text size={1} muted>
            Add colors under Brand colors on this project to reuse them here.
          </Text>
        </Card>
      ) : null}

      <Flex gap={3} align="center">
        <Box>
          <input
            type="color"
            aria-label="Pick custom color"
            disabled={readOnly}
            value={pickerValue}
            onChange={(event) => {
              applyHex(event.currentTarget.value)
            }}
            style={{
              width: 40,
              height: 36,
              padding: 0,
              border: '1px solid var(--card-border-color)',
              borderRadius: 6,
              background: 'transparent',
              cursor: readOnly ? 'default' : 'pointer',
            }}
          />
        </Box>
        <TextInput
          {...elementProps}
          readOnly={readOnly}
          value={hex}
          placeholder="#39419a"
          onChange={(event) => {
            const raw = event.currentTarget.value
            if (!raw.trim()) {
              onChange(unset())
              return
            }
            const normalized = normalizeHex(raw)
            onChange(set(normalized ?? raw.trim()))
          }}
        />
      </Flex>
      {hex && !isValid ? (
        <Text size={1} style={{color: 'var(--card-badge-critical-fg-color)'}}>
          Enter a hex color like #39419a
        </Text>
      ) : null}
    </Stack>
  )
}
