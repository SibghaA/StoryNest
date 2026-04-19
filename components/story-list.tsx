'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Story {
  id: string
  body: string
  lesson: string
  keywords: unknown
  createdAt: Date
}

export function StoryList({ stories, profileId }: { stories: Story[]; profileId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this story? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/stories/${id}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  if (stories.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-200 p-12 text-center">
        <p className="text-4xl">📖</p>
        <p className="mt-3 text-gray-600">No stories saved yet.</p>
        <Link
          href="/generate"
          className="mt-4 inline-block rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          ✨ Generate the first one
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {stories.map(story => {
        const keywords = story.keywords as string[]
        const preview = story.body.slice(0, 120).trimEnd() + (story.body.length > 120 ? '…' : '')
        const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
          new Date(story.createdAt),
        )

        return (
          <li key={story.id} className="rounded-xl bg-white p-4 shadow-sm">
            <Link href={`/stories/${story.id}`} className="block hover:opacity-90">
              <p className="mb-1 text-sm leading-snug text-gray-800">{preview}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {keywords.map(kw => (
                  <span key={kw} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    {kw}
                  </span>
                ))}
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  {story.lesson}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">{date}</p>
            </Link>

            <div className="mt-3 flex justify-end gap-2 border-t border-gray-50 pt-3">
              <Link
                href={`/stories/${story.id}`}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-amber-400 hover:text-amber-700"
              >
                Read
              </Link>
              <button
                onClick={() => handleDelete(story.id)}
                disabled={deleting === story.id}
                className="rounded-lg border border-red-100 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                {deleting === story.id ? '…' : 'Delete'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
