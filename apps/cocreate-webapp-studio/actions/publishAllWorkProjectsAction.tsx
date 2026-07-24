import {useCallback, useMemo, useState} from 'react'
import {
  useDocumentOperation,
  type DocumentActionComponent,
  type DocumentActionProps,
} from 'sanity'

type WorkProjectRow = {
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

function projectReadyForSite(project: WorkProjectRow): boolean {
  if (!project.coverImage?.asset?._ref) return false
  const hero = project.hero
  if (!hero?.mediaType) return false
  if (hero.mediaType === 'image' && !hero.image?.asset?._ref) return false
  if (hero.mediaType === 'video' && !hero.video?.asset?._ref) return false
  if (hero.mediaType === 'loopVideo' && !hero.loopVideo?.asset?._ref) return false
  return true
}

/**
 * Sets publishedAt on draft projects that are ready, then publishes workPage.
 * Studio Publish alone does not set per-project publishedAt (site visibility gate).
 */
export const publishAllWorkProjectsAction: DocumentActionComponent = (
  props: DocumentActionProps,
) => {
  const {id, type, draft, published, onComplete} = props
  const doc = (draft || published) as
    | ({projects?: WorkProjectRow[]} & Record<string, unknown>)
    | null
  const {patch, publish} = useDocumentOperation(id, type)
  const [busy, setBusy] = useState(false)

  const projects = doc?.projects ?? []
  const draftProjects = useMemo(
    () => projects.filter((project) => !project.publishedAt),
    [projects],
  )
  const readyDrafts = useMemo(
    () => draftProjects.filter(projectReadyForSite),
    [draftProjects],
  )
  const blocked = draftProjects.length - readyDrafts.length

  const label =
    draftProjects.length > 0
      ? `Publish all (${draftProjects.length} draft${draftProjects.length === 1 ? '' : 's'})`
      : 'Publish all projects'

  const onHandle = useCallback(() => {
    if (busy) return
    setBusy(true)

    try {
      const now = new Date().toISOString()
      const nextProjects = projects.map((project) => {
        if (project.publishedAt || !projectReadyForSite(project)) return project
        return {...project, publishedAt: now}
      })

      const stamped = nextProjects.filter(
        (project, index) =>
          !projects[index]?.publishedAt && Boolean(project.publishedAt),
      ).length

      if (stamped > 0) {
        patch.execute([{set: {projects: nextProjects}}])
      }

      if (!publish.disabled) {
        publish.execute()
      }

      const parts = [
        stamped > 0
          ? `Set Published at on ${stamped} project${stamped === 1 ? '' : 's'}.`
          : 'No draft projects were ready to stamp.',
        blocked > 0
          ? [
              `${blocked} still need cover image and/or hero media:`,
              ...projects
                .map((project, index) => ({project, index}))
                .filter(
                  ({project}) => !project.publishedAt && !projectReadyForSite(project),
                )
                .map(({project, index}) => {
                  const name = project.title?.trim() || `Untitled project (${index + 1})`
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
                  return `• ${name} (needs ${missing.join(' / ')})`
                }),
            ].join('\n')
          : null,
        !publish.disabled ? 'Work page published.' : 'Work page had nothing new to publish.',
      ].filter(Boolean)

      window.alert(parts.join('\n'))
      onComplete()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      window.alert(`Publish all failed: ${message}`)
    } finally {
      setBusy(false)
    }
  }, [blocked, busy, draftProjects, onComplete, patch, projects, publish])

  return {
    label,
    title:
      'Set Published at on ready draft projects, then publish the Work page. Projects without cover/hero are skipped.',
    disabled: busy || (draftProjects.length === 0 && Boolean(publish.disabled)),
    onHandle,
  }
}
