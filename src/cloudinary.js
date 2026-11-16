import { cloudinaryConfig } from './cloudinaryConfig.js'

export const cloudinaryReady = !Object.values(cloudinaryConfig).some((v) =>
  String(v).startsWith('PASTE_'),
)

// resourceType: 'image' for pictures, 'video' for audio (Cloudinary stores audio under "video")
export async function uploadToCloudinary(file, resourceType = 'image') {
  if (!cloudinaryReady) {
    throw new Error(
      'Cloudinary ekhono setup hoyni. src/cloudinaryConfig.js e cloud name ar upload preset boshate hobe.',
    )
  }
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', cloudinaryConfig.uploadPreset)

  let res
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`,
      { method: 'POST', body: form },
    )
  } catch {
    throw new Error('Upload hoyni. Internet connection check korun.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error?.message || 'Upload hoyni.')
  return data.secure_url
}
