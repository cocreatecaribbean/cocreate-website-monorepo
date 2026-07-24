'use client'

import {useCallback, useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Box, Button, Card, Stack, Text} from '@sanity/ui'

type OriginalRow = {
  _id: string
  title?: string
  publishedAt?: string
  coverImage?: {asset?: {_ref?: string}}
  slug?: {current?: string}
}

function isDraftId(id: string) {
  return id.startsWith('drafts.')
}

function publishedIdOf(id: string) {
  return id.replace(/^drafts\./, '')
}

function originalReadyForSite(row: OriginalRow): boolean {
  return Boolean(row.coverImage?.asset?._ref && row.slug?.current?.trim())
}

/**
 * Structure tool: stamp publishedAt + publish draft / unpublished originals in one go.
 */
export function PublishAllOriginalsTool() {
  const client = useClient({apiVersion: '2025-01-01'})
  const [rows, setRows] = useState<OriginalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const result = await client.fetch<OriginalRow[]>(
        `*[_type == "original"] | order(title asc) {
          _id,
          title,
          publishedAt,
          coverImage,
          slug
        }`,
      )
      setRows(result)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    void reload()
  }, [reload])

  const needsAction = rows.filter((row) => isDraftId(row._id) || !row.publishedAt)
  const ready = needsAction.filter(originalReadyForSite)
  const blocked = needsAction.length - ready.length

  const onPublishAll = useCallback(async () => {
    if (busy || ready.length === 0) return
    setBusy(true)
    setMessage(null)

    try {
      const now = new Date().toISOString()
      let stamped = 0
      let publishedCount = 0

      // Prefer draft row when both draft + published exist for same id.
      const byPublishedId = new Map<string, OriginalRow>()
      for (const row of ready) {
        const key = publishedIdOf(row._id)
        const existing = byPublishedId.get(key)
        if (!existing || isDraftId(row._id)) {
          byPublishedId.set(key, row)
        }
      }

      for (const row of byPublishedId.values()) {
        const pubId = publishedIdOf(row._id)
        const draftId = `drafts.${pubId}`
        const hasDraft = rows.some((candidate) => candidate._id === draftId)
        const patchTarget = hasDraft || isDraftId(row._id) ? draftId : pubId

        if (!row.publishedAt) {
          await client.patch(patchTarget).set({publishedAt: now}).commit()
          stamped += 1
        }

        if (hasDraft || isDraftId(row._id)) {
          try {
            await client.action({
              actionType: 'sanity.action.document.publish',
              publishedId: pubId,
              draftId,
            })
            publishedCount += 1
          } catch (error) {
            const text = error instanceof Error ? error.message : String(error)
            // Continue remaining docs; surface last failure in summary.
            setMessage((prev) =>
              prev ? `${prev} Publish ${pubId} failed: ${text}` : `Publish ${pubId} failed: ${text}`,
            )
          }
        }
      }

      setMessage((prev) =>
        [
          prev,
          `Stamped Published at on ${stamped}.`,
          `Published ${publishedCount} document${publishedCount === 1 ? '' : 's'}.`,
          blocked > 0 ? `${blocked} skipped (need cover image and slug).` : null,
        ]
          .filter(Boolean)
          .join(' '),
      )
      await reload()
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error)
      setMessage(`Publish all failed: ${text}`)
    } finally {
      setBusy(false)
    }
  }, [blocked, busy, client, ready, reload, rows])

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="semibold">
            Publish all originals
          </Text>
          <Text muted size={1}>
            Sets Published at on originals that are still drafts for the site, then publishes
            their Sanity documents. Studio Publish alone does not set Published at.
          </Text>
        </Stack>

        <Card padding={3} radius={2} shadow={1} tone="transparent">
          <Stack space={2}>
            <Text size={1}>
              {loading
                ? 'Loading…'
                : `${needsAction.length} need action (${ready.length} ready, ${blocked} blocked).`}
            </Text>
            {!loading && needsAction.length > 0 ? (
              <Stack space={2}>
                {needsAction.map((row) => {
                  const readyRow = originalReadyForSite(row)
                  return (
                    <Text key={row._id} size={1} muted={!readyRow}>
                      {row.title || 'Untitled'} —{' '}
                      {!row.publishedAt ? 'no Published at' : 'has Published at'}
                      {isDraftId(row._id) ? ', draft doc' : ''}
                      {!readyRow ? ' (needs cover + slug)' : ''}
                    </Text>
                  )
                })}
              </Stack>
            ) : null}
          </Stack>
        </Card>

        <Button
          text={
            ready.length > 0
              ? `Publish all (${ready.length} ready)`
              : 'Nothing ready to publish'
          }
          tone="positive"
          disabled={busy || loading || ready.length === 0}
          onClick={() => void onPublishAll()}
        />

        {message ? (
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>{message}</Text>
          </Card>
        ) : null}
      </Stack>
    </Box>
  )
}
