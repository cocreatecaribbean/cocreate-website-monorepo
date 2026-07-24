import {Card, Stack, Text} from '@sanity/ui'
import {useFormValue, type StringInputProps} from 'sanity'

type WorkProjectStatusRow = {
  _key?: string
  title?: string
  publishedAt?: string
  coverImage?: {asset?: {_ref?: string}}
  hero?: {
    mediaType?: string
    image?: {asset?: {_ref?: string}}
    video?: {asset?: {_ref?: string}}
    loopVideo?: {asset?: {_ref?: string}}
  }
}

const CAUTION_TEXT = {color: 'var(--card-caution-fg-color)'} as const
const BOLD_CAUTION = {
  color: 'var(--card-caution-fg-color)',
  fontWeight: 700,
} as const

function projectReadyForSite(project: WorkProjectStatusRow): boolean {
  if (!project.coverImage?.asset?._ref) return false
  const hero = project.hero
  if (!hero?.mediaType) return false
  if (hero.mediaType === 'image' && !hero.image?.asset?._ref) return false
  if (hero.mediaType === 'video' && !hero.video?.asset?._ref) return false
  if (hero.mediaType === 'loopVideo' && !hero.loopVideo?.asset?._ref) return false
  return true
}

function missingRequirements(project: WorkProjectStatusRow): string[] {
  const missing: string[] = []
  if (!project.coverImage?.asset?._ref) missing.push('cover')
  const hero = project.hero
  if (!hero?.mediaType) {
    missing.push('hero')
  } else if (hero.mediaType === 'image' && !hero.image?.asset?._ref) {
    missing.push('hero image')
  } else if (hero.mediaType === 'video' && !hero.video?.asset?._ref) {
    missing.push('hero video')
  } else if (hero.mediaType === 'loopVideo' && !hero.loopVideo?.asset?._ref) {
    missing.push('hero looping video')
  }
  return missing
}

function projectLabel(project: WorkProjectStatusRow, index: number): string {
  return project.title?.trim() || `Untitled project (${index + 1})`
}

/**
 * Read-only status panel — Studio Publish ≠ live on site.
 * Lists projects missing Published at and those blocked by cover/hero.
 */
export function WorkProjectsLiveStatus(_props: StringInputProps) {
  const projects = (useFormValue(['projects']) as WorkProjectStatusRow[] | undefined) ?? []

  const notLive = projects
    .map((project, index) => ({project, index}))
    .filter(({project}) => !project.publishedAt)

  const blocked = notLive.filter(({project}) => !projectReadyForSite(project))
  const readyNotLive = notLive.filter(({project}) => projectReadyForSite(project))
  const liveCount = projects.length - notLive.length
  const allLive = projects.length > 0 && notLive.length === 0

  return (
    <Card
      padding={3}
      radius={2}
      shadow={1}
      tone={allLive ? 'positive' : notLive.length > 0 ? 'caution' : 'transparent'}
      border
    >
      <Stack space={3}>
        <Stack space={3}>
          <Text size={1} style={CAUTION_TEXT}>
            We must put a published at date for the project to show on the live site! this will
            shit on you if u forget it and ur wondering why the F*** isn&apos;t my project showing
            on the live site! I can&apos;t make it block publishing cause we need to see it in
            preview so I&apos;ve made the text a highlight color to help remember. Published at
            date is a must cause we need to be able to track when stuff was publish to live site.
          </Text>
          <Text size={1} style={BOLD_CAUTION}>
            If project is NOT showing on live sit after you hit publish, check that u have picked
            a date in the published at field
          </Text>
        </Stack>

        <Text size={1}>
          {projects.length === 0
            ? 'No projects yet.'
            : allLive
              ? `All ${liveCount} projects are live.`
              : `${liveCount} live · ${notLive.length} not live`}
        </Text>

        {readyNotLive.length > 0 ? (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Not live — missing Published at
            </Text>
            {readyNotLive.map(({project, index}) => (
              <Text key={project._key ?? index} size={1}>
                {projectLabel(project, index)} — No Published at
              </Text>
            ))}
          </Stack>
        ) : null}

        {blocked.length > 0 ? (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Blocked — need media before going live
            </Text>
            {blocked.map(({project, index}) => {
              const missing = missingRequirements(project)
              return (
                <Text key={project._key ?? index} size={1}>
                  {projectLabel(project, index)} — Needs {missing.join(' / ')} before it can go
                  live
                </Text>
              )
            })}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}
