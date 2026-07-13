import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {
  getPublishedId,
  set,
  unset,
  useClient,
  type Reference,
  type ReferenceInputProps,
} from 'sanity'

const API_VERSION = '2025-02-19'

type ClientDoc = {
  _id: string
  name?: string
  slug?: {current?: string}
  logo?: {
    asset?: {_ref?: string}
  }
}

type ClientOption = {
  value: string
  title: string
}

function shortId() {
  return Math.random().toString(36).slice(2, 8)
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Client reference as source of truth — pick / create / edit on the project form
 * without opening a stacked Client document pane.
 */
export function ClientReferenceInput(props: ReferenceInputProps) {
  const {value, onChange, readOnly} = props
  const client = useClient({apiVersion: API_VERSION})
  // Include draft clients so Structure renames show in the picker
  const draftClient = useMemo(
    () => client.withConfig({perspective: 'previewDrafts'}),
    [client],
  )
  const refId = (value as Reference | undefined)?._ref
  const publishedRef = refId ? getPublishedId(refId) : null

  const [linked, setLinked] = useState<ClientDoc | null>(null)
  const [options, setOptions] = useState<ClientOption[]>([])
  const [pickQuery, setPickQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nameDraft, setNameDraft] = useState('')
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadClients = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await draftClient.fetch<ClientDoc[]>(
        `*[_type == "client"] | order(name asc) {_id, name, slug}`,
      )
      // Dedupe draft/published pairs — prefer draft name (what Structure shows)
      const byId = new Map<string, ClientOption>()
      for (const row of rows) {
        const id = getPublishedId(row._id)
        const isDraft = row._id.startsWith('drafts.')
        const existing = byId.get(id)
        if (!existing || isDraft) {
          byId.set(id, {
            value: id,
            title: row.name?.trim() || existing?.title || 'Untitled client',
          })
        }
      }
      setOptions([...byId.values()].sort((a, b) => a.title.localeCompare(b.title)))
    } catch (error) {
      console.warn('[ClientReferenceInput] Failed to load clients:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [draftClient])

  useEffect(() => {
    void loadClients()
  }, [loadClients])

  useEffect(() => {
    if (!publishedRef) {
      setLinked(null)
      setNameDraft('')
      return
    }

    let cancelled = false
    void (async () => {
      // Prefer draft overlay for name/logo (matches Structure)
      const doc = await draftClient.fetch<ClientDoc | null>(
        `coalesce(
          *[_id == $draftId][0],
          *[_id == $id][0]
        ){_id, name, slug, logo}`,
        {id: publishedRef, draftId: `drafts.${publishedRef}`},
      )
      if (cancelled) return
      setLinked(doc)
      setNameDraft(doc?.name || '')
    })()

    return () => {
      cancelled = true
    }
  }, [draftClient, publishedRef])

  const filteredOptions = useMemo(() => {
    const q = pickQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => opt.title.toLowerCase().includes(q))
  }, [options, pickQuery])

  const selectClient = (id: string) => {
    onChange(set({_type: 'reference', _ref: id}))
    setPickQuery('')
  }

  const clearClient = () => {
    onChange(unset())
    setLinked(null)
    setNameDraft('')
  }

  const createClient = async () => {
    if (readOnly || busy) return
    setBusy(true)
    try {
      const id = shortId()
      const created = await client.create({
        _type: 'client',
        name: 'Untitled client',
        slug: {_type: 'slug', current: `untitled-client-${id}`},
      })
      const publishedId = getPublishedId(created._id)
      onChange(set({_type: 'reference', _ref: publishedId}))
      await loadClients()
    } catch (error) {
      console.warn('[ClientReferenceInput] Failed to create client:', error)
    } finally {
      setBusy(false)
    }
  }

  const patchLinked = async (patch: Record<string, unknown>) => {
    if (!publishedRef || readOnly) return
    try {
      // Patch draft if present so Structure + picker stay in sync
      const draftId = `drafts.${publishedRef}`
      const targetId = (await client.fetch<string | null>(
        `coalesce(*[_id == $draftId][0]._id, *[_id == $id][0]._id)`,
        {id: publishedRef, draftId},
      )) || publishedRef

      await client.patch(targetId).set(patch).commit({autoGenerateArrayKeys: true})
      const doc = await draftClient.fetch<ClientDoc | null>(
        `coalesce(
          *[_id == $draftId][0],
          *[_id == $id][0]
        ){_id, name, slug, logo}`,
        {id: publishedRef, draftId},
      )
      setLinked(doc)
      await loadClients()
    } catch (error) {
      console.warn('[ClientReferenceInput] Failed to patch client:', error)
    }
  }

  const onNameChange = (next: string) => {
    setNameDraft(next)
    if (nameTimer.current) clearTimeout(nameTimer.current)
    nameTimer.current = setTimeout(() => {
      const slug = slugify(next) || `client-${shortId()}`
      void patchLinked({
        name: next,
        slug: {_type: 'slug', current: slug},
      })
    }, 400)
  }

  const onLogoFile = async (file: File | undefined) => {
    if (!file || !publishedRef || readOnly) return
    setBusy(true)
    try {
      const asset = await client.assets.upload('image', file)
      await patchLinked({
        logo: {
          _type: 'image',
          asset: {_type: 'reference', _ref: asset._id},
        },
      })
    } catch (error) {
      console.warn('[ClientReferenceInput] Failed to upload logo:', error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack space={3}>
      <Text size={1} muted>
        Shared Client document — edit here without leaving the project. Changes apply to every
        project using this client.
      </Text>

      {!publishedRef ? (
        <Stack space={3}>
          <Stack space={2}>
            <Text size={1} weight="medium">
              Select client
            </Text>
            <TextInput
              value={pickQuery}
              placeholder="Filter clients…"
              disabled={readOnly || busy || loading}
              onChange={(event) => setPickQuery(event.currentTarget.value)}
            />
            <MenuButton
              id="client-pick-menu"
              onOpen={() => {
                void loadClients()
              }}
              button={
                <Button
                  text={
                    loading
                      ? 'Loading clients…'
                      : options.length === 0
                        ? 'No clients yet'
                        : `Choose client (${filteredOptions.length})`
                  }
                  mode="ghost"
                  disabled={readOnly || busy || loading}
                  width="fill"
                />
              }
              menu={
                <Menu>
                  {filteredOptions.length === 0 ? (
                    <MenuItem
                      disabled
                      text={options.length === 0 ? 'No clients yet' : 'No matches'}
                    />
                  ) : (
                    filteredOptions.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        text={opt.title}
                        onClick={() => selectClient(opt.value)}
                      />
                    ))
                  )}
                </Menu>
              }
              popover={{portal: true, placement: 'bottom-start', constrainSize: true}}
            />
          </Stack>
          <Flex gap={2}>
            <Button
              text={busy ? 'Creating…' : 'Create new client'}
              mode="ghost"
              disabled={readOnly || busy}
              onClick={() => void createClient()}
            />
          </Flex>
        </Stack>
      ) : (
        <Stack space={3}>
          <Flex gap={2} align="center">
            <Box flex={1}>
              <Text size={1} weight="semibold">
                Linked client
              </Text>
            </Box>
            <Button
              text="Change"
              mode="ghost"
              fontSize={1}
              disabled={readOnly || busy}
              onClick={clearClient}
            />
          </Flex>

          <Stack space={2}>
            <Text size={1} weight="medium">
              Client name
            </Text>
            <TextInput
              value={nameDraft}
              readOnly={readOnly || busy}
              onChange={(event) => onNameChange(event.currentTarget.value)}
            />
          </Stack>

          <Stack space={2}>
            <Text size={1} weight="medium">
              Client slug
            </Text>
            <TextInput value={linked?.slug?.current || ''} readOnly />
          </Stack>

          <Stack space={2}>
            <Text size={1} weight="medium">
              Client logo
            </Text>
            <input
              type="file"
              accept="image/*"
              disabled={readOnly || busy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                void onLogoFile(file)
                event.currentTarget.value = ''
              }}
            />
            {linked?.logo?.asset?._ref ? (
              <Text size={1} muted>
                Logo set
              </Text>
            ) : (
              <Text size={1} muted>
                No logo yet
              </Text>
            )}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
