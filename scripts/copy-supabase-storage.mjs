/**
 * One-off: copy Storage buckets from OLD Supabase project → NEW (current SUPABASE_*).
 *
 * Usage:
 *   OLD_SUPABASE_URL=... OLD_SUPABASE_SERVICE_ROLE_KEY=... \
 *     doppler run -- node scripts/copy-supabase-storage.mjs
 */
import { createClient } from '../apps/api/node_modules/@supabase/supabase-js/dist/index.mjs'

const BUCKETS = [
  { name: 'admin-avatars', public: false },
  { name: 'project-attachments', public: false },
  { name: 'client-logos', public: true },
]

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

async function ensureBucket(client, name, isPublic) {
  const { data: existing } = await client.storage.getBucket(name)
  if (existing) return

  const { error } = await client.storage.createBucket(name, {
    public: isPublic,
  })
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`createBucket(${name}): ${error.message}`)
  }
}

async function listAllFiles(client, bucket, prefix = '') {
  const paths = []
  let offset = 0
  const limit = 100

  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) {
      throw new Error(`list(${bucket}, ${prefix || '/'}): ${error.message}`)
    }
    if (!data?.length) break

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) {
        paths.push(...(await listAllFiles(client, bucket, path)))
      } else {
        paths.push(path)
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return paths
}

async function copyObject(source, dest, bucket, path) {
  const { data: blob, error: downloadError } = await source.storage
    .from(bucket)
    .download(path)
  if (downloadError || !blob) {
    console.error(`  download failed ${bucket}/${path}: ${downloadError?.message}`)
    return 'failed'
  }

  const contentType = blob.type || undefined
  const force = process.env.FORCE_STORAGE_OVERWRITE === '1'

  // Dest may have orphaned storage.objects rows (list/size OK, download 404).
  const { error: destDlError } = await dest.storage.from(bucket).download(path)
  const destMissing =
    destDlError && /not found|does not exist/i.test(destDlError.message)

  if (!force && !destMissing) {
    // Object appears intact on dest — skip
    if (!destDlError) return 'skipped'
  }

  if (destMissing || force) {
    await dest.storage.from(bucket).remove([path])
  }

  const { error: uploadError } = await dest.storage.from(bucket).upload(path, blob, {
    contentType,
    upsert: true,
  })
  if (uploadError) {
    if (
      !force &&
      /already exists|duplicate|The resource already exists/i.test(uploadError.message)
    ) {
      return 'skipped'
    }
    console.error(`  upload failed ${bucket}/${path}: ${uploadError.message}`)
    return 'failed'
  }
  return 'copied'
}

async function main() {
  const oldUrl = requireEnv('OLD_SUPABASE_URL')
  const oldKey = requireEnv('OLD_SUPABASE_SERVICE_ROLE_KEY')
  const newUrl = requireEnv('SUPABASE_URL')
  const newKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (oldUrl === newUrl) {
    throw new Error('OLD_SUPABASE_URL and SUPABASE_URL are the same — aborting')
  }

  const source = createClient(oldUrl, oldKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const dest = createClient(newUrl, newKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`Source: ${oldUrl}`)
  console.log(`Dest:   ${newUrl}`)

  let copied = 0
  let skipped = 0
  let failed = 0

  for (const { name, public: isPublic } of BUCKETS) {
    console.log(`\nBucket: ${name}`)
    await ensureBucket(dest, name, isPublic)

    let files
    try {
      files = await listAllFiles(source, name)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (/not found|does not exist/i.test(message)) {
        console.log(`  source bucket missing or empty — skip`)
        continue
      }
      throw err
    }

    console.log(`  ${files.length} object(s)`)
    for (const path of files) {
      const result = await copyObject(source, dest, name, path)
      if (result === 'copied') {
        copied += 1
        console.log(`  + ${path}`)
      } else if (result === 'skipped') {
        skipped += 1
      } else {
        failed += 1
      }
    }
  }

  console.log(`\nDone. copied=${copied} skipped=${skipped} failed=${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
