'use client'

import { useState } from 'react'
import type { Profile } from '@prisma/client'

const LESSON_PRESETS = ['Sharing', 'Courage', 'Kindness', 'Patience', 'Honesty']

interface StoryGeneratorProps {
  profiles: Profile[]
}

export function StoryGenerator({ profiles }: StoryGeneratorProps) {
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? '')
  const [keywords, setKeywords] = useState(['', '', ''])
  const [lesson, setLesson] = useState('')
  const [storyText, setStoryText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setKeyword(index: number, value: string) {
    setKeywords(prev => prev.map((k, i) => (i === index ? value : k)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side validation
    if (keywords.some(k => !k.trim())) {
      setError('Please fill in all 3 keywords.')
      return
    }
    if (!lesson.trim()) {
      setError('Please enter a life lesson.')
      return
    }
    if (lesson.length > 120) {
      setError('Life lesson must be 120 characters or fewer.')
      return
    }

    setError('')
    setStoryText('')
    setLoading(true)

    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, keywords, lesson }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setError(
          typeof data.error === 'string'
            ? data.error
            : 'Story generation failed. Please try again.',
        )
        setLoading(false)
        return
      }

      // Stream tokens as they arrive
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setStoryText(prev => prev + decoder.decode(value, { stream: true }))
      }
    } catch {
      setError('Story generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedProfile = profiles.find(p => p.id === profileId)

  return (
    <div className="space-y-8">
      {/* Profile switcher */}
      {profiles.length > 1 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Generating for</p>
          <div className="flex flex-wrap gap-2">
            {profiles.map(profile => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setProfileId(profile.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  profileId === profile.id
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                {profile.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generation form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Keywords */}
        <div>
          <p className="mb-2 block text-sm font-medium text-gray-700">
            3 keywords about {selectedProfile?.name ?? 'your child'}&apos;s world
          </p>
          <div className="grid grid-cols-3 gap-3">
            {keywords.map((kw, i) => (
              <input
                key={i}
                type="text"
                value={kw}
                maxLength={50}
                onChange={e => setKeyword(i, e.target.value)}
                placeholder={
                  i === 0 ? 'e.g. ducks' : i === 1 ? 'e.g. puddles' : 'e.g. giggling'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            ))}
          </div>
        </div>

        {/* Life lesson */}
        <div>
          <label htmlFor="lesson" className="mb-2 block text-sm font-medium text-gray-700">
            Life lesson to weave in
          </label>
          {/* Preset suggestions */}
          <div className="mb-2 flex flex-wrap gap-2">
            {LESSON_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setLesson(preset)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  lesson === preset
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-500 hover:border-amber-300'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            id="lesson"
            type="text"
            value={lesson}
            maxLength={120}
            onChange={e => setLesson(e.target.value)}
            placeholder="e.g. it's okay to ask for help"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{lesson.length}/120</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="submit"
              className="mt-1 text-xs font-medium text-red-600 underline"
            >
              Try again
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Writing your story…' : 'Generate story'}
        </button>
      </form>

      {/* Story output */}
      {(loading || storyText) && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-6">
          {loading && !storyText && (
            <div className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-amber-200" />
              <div className="h-4 w-full animate-pulse rounded bg-amber-200" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-amber-200" />
            </div>
          )}
          {storyText && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {storyText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
