import { defineLive } from 'next-sanity/live'
import { getStegaSanityClient } from '@/sanity/lib/client'

const token = process.env.SANITY_API_TOKEN
const client = getStegaSanityClient()

const live =
  token && client
    ? defineLive({
        client,
        serverToken: token,
        browserToken: token,
      })
    : null

export const SanityLive = live?.SanityLive ?? (() => null)

export const sanityFetchLive = live?.sanityFetch
