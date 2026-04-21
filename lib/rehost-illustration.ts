import { put as vercelBlobPut } from '@vercel/blob'

type PutFn = (
  pathname: string,
  body: Blob | ArrayBuffer | Buffer,
  options: { access: 'public'; contentType?: string },
) => Promise<{ url: string }>

type FetcherFn = (url: string) => Promise<Response>

interface Deps {
  fetcher?: FetcherFn
  put?: PutFn
}

const VERCEL_BLOB_HOST = 'blob.vercel-storage.com'

export async function rehostToBlob(
  srcUrl: string,
  storyId: string,
  sceneIndex: number,
  deps: Deps = {},
): Promise<string> {
  if (srcUrl.includes(VERCEL_BLOB_HOST)) {
    return srcUrl
  }

  const fetcher = deps.fetcher ?? ((url: string) => fetch(url))
  const put = deps.put ?? (vercelBlobPut as unknown as PutFn)

  let body: ArrayBuffer
  let contentType: string
  try {
    const res = await fetcher(srcUrl)
    if (!res.ok) return srcUrl
    contentType = res.headers.get('content-type') ?? 'image/png'
    body = await res.arrayBuffer()
  } catch {
    return srcUrl
  }

  const ext =
    contentType === 'image/jpeg' || contentType === 'image/jpg'
      ? 'jpg'
      : contentType === 'image/webp'
      ? 'webp'
      : contentType === 'image/gif'
      ? 'gif'
      : 'png'

  try {
    const { url } = await put(`illustrations/${storyId}/${sceneIndex}.${ext}`, body, {
      access: 'public',
      contentType,
    })
    return url
  } catch {
    return srcUrl
  }
}
