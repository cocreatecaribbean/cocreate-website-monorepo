import type { NextRequest } from 'next/server'
import { completeAuthCallback } from '@/lib/supabase/route-handler'

export async function GET(request: NextRequest) {
  return completeAuthCallback(request)
}
