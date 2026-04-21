'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SaveStoryButtonProps {
  storyId: string
  initialSaved: boolean
}

export function SaveStoryButton({ storyId, initialSaved }: SaveStoryButtonProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const res = await fetch(`/api/stories/${storyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: !saved }),
    })
    if (res.ok) {
      setSaved(s => !s)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
        saved
          ? 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-white'
          : 'border-amber-500 bg-amber-600 text-white hover:bg-amber-700'
      }`}
    >
      {loading ? '…' : saved ? '★ Saved' : '☆ Save story'}
    </button>
  )
}
