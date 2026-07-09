'use client'

import { useRef, useState } from 'react'
import { UserCircle } from 'lucide-react'
import AvatarCropModal from '@/components/avatar-crop-modal'
import {
  resolveAvatarMimeType,
  useDeletePortalAvatarMutation,
  useUpdatePortalAvatarMutation,
} from '@/lib/api/mutations/profile'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { bricolage_grot600 } from '@/styles/fonts'

const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function initialsFromUser(email: string, displayName?: string | null): string {
  const source = displayName?.trim() || email.split('@')[0] || '?'
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

type PortalUserAvatarProps = {
  size?: 'sm' | 'md'
  showMenu?: boolean
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
}

export default function PortalUserAvatar({
  size = 'md',
  showMenu = true,
}: PortalUserAvatarProps) {
  const { data: profile } = usePortalProfileQuery()
  const updateAvatarMutation = useUpdatePortalAvatarMutation()
  const deleteAvatarMutation = useDeletePortalAvatarMutation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const email = profile?.user.email ?? ''
  const displayName = profile?.user.displayName
  const avatarUrl = profile?.user.avatarUrl
  const initials = initialsFromUser(email, displayName)
  const sizeClass = sizeClasses[size]
  const uploading = updateAvatarMutation.isPending || deleteAvatarMutation.isPending

  const closeCropModal = () => {
    setCropModalOpen(false)
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc)
      setCropImageSrc(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onFileSelected = (file: File | null) => {
    if (!file) return
    setError(null)
    setMenuOpen(false)

    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image must be 5 MB or smaller')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      resolveAvatarMimeType(file.name, file.type)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid image type')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc)
    setCropImageSrc(URL.createObjectURL(file))
    setCropModalOpen(true)
  }

  const onAvatarCropped = async (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    await updateAvatarMutation.mutateAsync(file)
  }

  const onRemove = async () => {
    setMenuOpen(false)
    setError(null)
    try {
      await deleteAvatarMutation.mutateAsync()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Profile photo"
        aria-haspopup={showMenu ? 'menu' : undefined}
        aria-expanded={menuOpen}
        disabled={uploading}
        onClick={() => {
          if (showMenu) setMenuOpen((open) => !open)
          else fileInputRef.current?.click()
        }}
        className={`relative overflow-hidden rounded-full bg-chambray/10 ring-2 ring-chambray/10 transition hover:ring-chambray/25 dark:bg-white/10 dark:ring-white/15 ${sizeClass}`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : initials ? (
          <span
            className={`flex h-full w-full items-center justify-center font-semibold text-chambray dark:text-casablanca ${bricolage_grot600.className}`}
          >
            {initials}
          </span>
        ) : (
          <span className="flex h-full w-full items-center justify-center text-chambray/40">
            <UserCircle className="h-[70%] w-[70%]" strokeWidth={1.25} />
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="sr-only"
        disabled={uploading || cropModalOpen}
        onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
      />

      {showMenu && menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-chambray/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-chambray">
            <button
              type="button"
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-app-heading hover:bg-chambray/5"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? 'Change photo' : 'Upload photo'}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => void onRemove()}
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {error ? (
        <p className="absolute right-0 top-full mt-1 max-w-48 text-xs text-red-600">{error}</p>
      ) : null}

      <AvatarCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={closeCropModal}
        onConfirm={onAvatarCropped}
      />
    </div>
  )
}
