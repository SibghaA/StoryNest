'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteStoryButton({ storyId, profileId }: { storyId: string; profileId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this story? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/stories/${storyId}`, { method: 'DELETE' })
    router.push(`/profiles/${profileId}/stories`)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
    >
      {deleting ? 'Deleting…' : 'Delete story'}
    </button>
  )
}
