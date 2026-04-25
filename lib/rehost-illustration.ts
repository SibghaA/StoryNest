// TODO(security): wiring PR must add an SSRF hostname allowlist on srcUrl
// (e.g. fal.media only) before this is called from a route handler. The
// helper is intentionally framework-free; the allowlist belongs at the
// call site where the hostname policy lives.
import { put as vercelBlobPut } from '@vercel/blob'

type PutFn = (
  pathname: string,
  body: Blob | ArrayBuffer | Buffer,
  options: { access: 'public'; contentType?: string },
) => Promise<{ url: string }>

type FetcherFn = (url: string) => Promise<Response>

export interface RehostDeps {
  fetcher?: FetcherFn
  put?: PutFn
}

const VERCEL_BLOB_HOST = 'blob.vercel-storage.com'
const DEFAULT_CONTENT_TYPE = 'image/png'

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/png': 'png',
}

function extensionFor(contentType: string): string {
  return EXT_BY_CONTENT_TYPE[contentType] ?? 'png'
}

export async function rehostToBlob(
  srcUrl: string,
  storyId: string,
  sceneIndex: number,
  deps: RehostDeps = {},
): Promise<string> {
  if (srcUrl.includes(VERCEL_BLOB_HOST)) return srcUrl

  const fetcher = deps.fetcher ?? ((url: string) => fetch(url))
  const put = deps.put ?? (vercelBlobPut as unknown as PutFn)

  let body: ArrayBuffer
  let contentType: string
  try {
    const res = await fetcher(srcUrl)
    if (!res.ok) return srcUrl
    contentType = res.headers.get('content-type') ?? DEFAULT_CONTENT_TYPE
    body = await res.arrayBuffer()
  } catch {
    return srcUrl
  }

  const pathname = `illustrations/${storyId}/${sceneIndex}.${extensionFor(contentType)}`

  try {
    const { url } = await put(pathname, body, { access: 'public', contentType })
    return url
  } catch {
    return srcUrl
  }
}
