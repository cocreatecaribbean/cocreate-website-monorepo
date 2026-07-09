import { createClient, type SanityClient } from '@sanity/client'
import { apiVersion, dataset, isSanityConfigured, projectId } from '@/sanity/env'

let publishedClient: SanityClient | undefined

function getProjectConfig() {
  if (!isSanityConfigured()) {
    throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  }

  return {
    projectId,
    dataset,
    apiVersion,
  }
}

function getPreviewValidationConfig() {
  const validationDataset =
    process.env.SANITY_STUDIO_DATASET ??
    process.env.NEXT_PUBLIC_SANITY_DATASET ??
    dataset

  if (!isSanityConfigured()) {
    throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  }

  return {
    projectId,
    dataset: validationDataset,
    apiVersion,
  }
}

function getPublishedClient() {
  if (!publishedClient) {
    const config = getProjectConfig()
    publishedClient = createClient({
      ...config,
      useCdn: true,
      token: process.env.SANITY_API_TOKEN,
      perspective: 'published',
    })
  }

  return publishedClient
}

function getPreviewClient() {
  const config = getProjectConfig()
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('SANITY_API_TOKEN is required for preview fetches')
  }

  return createClient({
    ...config,
    useCdn: false,
    token,
    perspective: 'previewDrafts',
  })
}

export function getSanityClientWithToken() {
  const config = getPreviewValidationConfig()
  const token = process.env.SANITY_API_TOKEN

  if (!token) {
    throw new Error('SANITY_API_TOKEN is required for preview validation')
  }

  return createClient({
    ...config,
    useCdn: false,
    token,
  })
}

type SanityFetchOptions = {
  params?: Record<string, unknown>
  preview?: boolean
}

export function sanityFetch<T>(query: string, options: SanityFetchOptions = {}) {
  const { params, preview = false } = options

  if (!isSanityConfigured()) {
    return Promise.resolve(null as T)
  }

  const client = preview ? getPreviewClient() : getPublishedClient()
  return client.fetch<T>(query, params ?? {})
}
