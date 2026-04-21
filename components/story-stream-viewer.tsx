'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface StoryStreamViewerProps {
  storyId: string
  childNames: string
}

export function StoryStreamViewer({ storyId, childNames }: StoryStreamViewerProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function stream() {
      try {
        const res = await fetch(`/api/stories/${storyId}/stream`)

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}))
          if (!cancelled)
            setError(
              typeof data.error === 'string'
                ? data.error
                : 'Story generation failed. Please try again.',
            )
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break
          if (cancelled) {
            reader.cancel()
            return
          }
          setText(prev => prev + decoder.decode(value, { stream: true }))
        }

        if (!cancelled) {
          setDone(true)
          // Refresh server component to show saved body + illustrations
          router.refresh()
        }
      } catch {
        if (!cancelled) setError('Story generation failed. Please try again.')
      }
    }

    stream()
    return () => {
      cancelled = true
    }
  }, [storyId, router])

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm font-medium text-red-600 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
        {done ? `A story for ${childNames}` : `Writing ${childNames}'s story…`}
      </p>

      {/* Skeleton while waiting for first token */}
      {!text && (
        <div className="space-y-2.5">
          {[0.75, 1, 0.85, 1, 0.65, 1, 0.9].map((w, i) => (
            <div
              key={i}
              className="h-3.5 animate-pulse rounded bg-amber-100"
              style={{ width: `${w * 100}%` }}
            />
          ))}
        </div>
      )}

      {text && (
        <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
          {text}
          {!done && <span className="ml-0.5 animate-pulse text-amber-400">▌</span>}
        </p>
      )}
    </div>
  )
}
