/**
 * Rehost illustration URLs to Vercel Blob.
 *
 * fal.ai CDN retention is short. We re-host every illustration to Vercel
 * Blob so the URL in story.imageUrls survives. Failures must degrade to
 * the original URL — a weak-durability image beats a broken one.
 */
import { describe, it, expect, vi } from 'vitest'
import { rehostToBlob } from '@/lib/rehost-illustration'

function okResponse(body: string, contentType: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': contentType },
  })
}

describe('rehostToBlob', () => {
  it('returns the URL that Vercel Blob put() resolved to', async () => {
    const fakeBlobUrl = 'https://blob.vercel-storage.com/illustrations/abc/0.png'
    const put = vi.fn().mockResolvedValue({ url: fakeBlobUrl })
    const fetcher = vi.fn().mockResolvedValue(okResponse('pngdata', 'image/png'))

    const out = await rehostToBlob('https://fal.media/cdn/1234.png', 'story_abc', 0, {
      fetcher,
      put,
    })

    expect(out).toBe(fakeBlobUrl)
    expect(fetcher).toHaveBeenCalledWith('https://fal.media/cdn/1234.png')
    expect(put).toHaveBeenCalledTimes(1)
  })

  it('uses pathname "illustrations/<storyId>/<index>.<ext>" with extension from content-type', async () => {
    const put = vi.fn().mockResolvedValue({ url: 'https://ok' })
    const fetcher = vi.fn().mockResolvedValue(okResponse('x', 'image/jpeg'))

    await rehostToBlob('https://fal.media/x', 'story_xyz', 2, { fetcher, put })

    const [pathname, , options] = put.mock.calls[0]
    expect(pathname).toBe('illustrations/story_xyz/2.jpg')
    expect(options).toMatchObject({ access: 'public', contentType: 'image/jpeg' })
  })

  it('defaults to .png when content-type is missing or unrecognised', async () => {
    const put = vi.fn().mockResolvedValue({ url: 'https://ok' })
    const fetcher = vi.fn().mockResolvedValue(okResponse('x', 'application/octet-stream'))

    await rehostToBlob('https://fal.media/x', 'story_xyz', 0, { fetcher, put })
    expect(put.mock.calls[0][0]).toBe('illustrations/story_xyz/0.png')
  })

  it('falls back to the original URL when fetch throws', async () => {
    const put = vi.fn()
    const fetcher = vi.fn().mockRejectedValue(new Error('ECONNRESET'))

    const out = await rehostToBlob('https://fal.media/original.png', 'story_abc', 1, {
      fetcher,
      put,
    })

    expect(out).toBe('https://fal.media/original.png')
    expect(put).not.toHaveBeenCalled()
  })

  it('falls back to the original URL when fetch returns a non-2xx response', async () => {
    const put = vi.fn()
    const fetcher = vi.fn().mockResolvedValue(new Response('nope', { status: 404 }))

    const out = await rehostToBlob('https://fal.media/x', 'story_abc', 0, { fetcher, put })
    expect(out).toBe('https://fal.media/x')
    expect(put).not.toHaveBeenCalled()
  })

  it('falls back to the original URL when put() throws', async () => {
    const put = vi.fn().mockRejectedValue(new Error('blob quota exceeded'))
    const fetcher = vi.fn().mockResolvedValue(okResponse('x', 'image/png'))

    const out = await rehostToBlob('https://fal.media/x', 'story_abc', 0, { fetcher, put })
    expect(out).toBe('https://fal.media/x')
  })

  it('short-circuits when the URL is already a Vercel Blob URL', async () => {
    const put = vi.fn()
    const fetcher = vi.fn()
    const alreadyHosted = 'https://blob.vercel-storage.com/illustrations/s/0.png'

    const out = await rehostToBlob(alreadyHosted, 'story_abc', 0, { fetcher, put })
    expect(out).toBe(alreadyHosted)
    expect(fetcher).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
  })
})
