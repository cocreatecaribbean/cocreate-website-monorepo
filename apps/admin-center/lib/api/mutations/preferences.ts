import { fetchAdminBff } from '@/lib/admin-api-fetch'

export async function patchAdminPreferences(input: {
  theme: 'light' | 'dark' | 'system'
}): Promise<{ ok: boolean; theme?: string; message?: string }> {
  try {
    const data = await fetchAdminBff<{ ok?: boolean; theme?: string; message?: string }>(
      '/api/preferences',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
    )
    return data.ok ? { ok: true, theme: data.theme } : { ok: false, message: data.message }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Could not save preferences',
    }
  }
}
