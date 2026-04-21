'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  storyId: string
  initialUrls: string[]
  parts: string[]
}

export function StoryIllustrationsLoader({ storyId, initialUrls, parts }: Props) {
  const [urls, setUrls] = useState<string[]>(initialUrls)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const allFilled = (u: string[]) => u.length === 3 && u.every(x => x)

    if (allFilled(urls)) return

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/stories/${storyId}`)
        if (!res.ok) return
        const { data } = await res.json()
        const fresh = (data?.imageUrls ?? []) as string[]
        setUrls(fresh)
        if (allFilled(fresh)) {
          clearInterval(intervalRef.current!)
        }
      } catch {
        // keep polling
      }
    }, 2500)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [storyId, urls])

  return (
    <div className="space-y-0">
      {parts.map((part, i) => (
        <div key={i} className="mt-6 space-y-4">
          <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
              {part}
            </p>
          </div>
          {urls[i] ? (
            <img
              src={urls[i]}
              alt={`Illustration for part ${i + 1}`}
              className="w-full rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex aspect-video w-full animate-pulse items-center justify-center rounded-xl bg-amber-100">
              <span className="text-4xl opacity-40">🎨</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
