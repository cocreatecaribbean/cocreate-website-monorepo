import type { Area } from 'react-easy-crop'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('Could not load image')))
    image.crossOrigin = 'anonymous'
    image.src = src
  })
}

/** Export a square crop as JPEG, scaled to at most `maxSize` px per side. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  maxSize = 512,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not prepare image crop')
  }

  const scale = Math.min(maxSize / pixelCrop.width, maxSize / pixelCrop.height, 1)
  const width = Math.round(pixelCrop.width * scale)
  const height = Math.round(pixelCrop.height * scale)

  canvas.width = width
  canvas.height = height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not export cropped image'))
      },
      'image/jpeg',
      0.92,
    )
  })
}
