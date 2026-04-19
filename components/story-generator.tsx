'use client'

import { useState } from 'react'
import type { Profile } from '@prisma/client'

// ── Scenarios ─────────────────────────────────────────────────────────────────

const SCENARIOS = [
  { id: 'forest-friends',  label: 'Forest Friends',  emoji: '🌲', keywords: ['forest',   'animals',   'friendship']  },
  { id: 'under-the-sea',   label: 'Under the Sea',   emoji: '🌊', keywords: ['ocean',    'fish',      'adventure']   },
  { id: 'starry-night',    label: 'Starry Night',    emoji: '✨', keywords: ['stars',    'moon',      'dreams']      },
  { id: 'rainbow-garden',  label: 'Rainbow Garden',  emoji: '🌈', keywords: ['garden',   'flowers',   'butterflies'] },
  { id: 'safari-animals',  label: 'Safari Animals',  emoji: '🦁', keywords: ['savanna',  'elephants', 'giraffes']    },
  { id: 'little-train',    label: 'Little Train',    emoji: '🚂', keywords: ['train',    'journey',   'friends']     },
  { id: 'cozy-nest',       label: 'Cozy Nest',       emoji: '🏠', keywords: ['home',     'family',    'warmth']      },
  { id: 'sweet-kitchen',   label: 'Sweet Kitchen',   emoji: '🧁', keywords: ['baking',   'cookies',   'magic']       },
  { id: 'cloud-castle',    label: 'Cloud Castle',    emoji: '☁️', keywords: ['clouds',   'sky',       'imagination'] },
  { id: 'custom',          label: 'My Own Idea',     emoji: '✏️', keywords: null                                     },
] as const

type ScenarioId = typeof SCENARIOS[number]['id']

// ── Lesson presets ────────────────────────────────────────────────────────────

const LESSON_PRESETS = [
  { label: 'Sharing',    emoji: '🤝' },
  { label: 'Courage',    emoji: '🦸' },
  { label: 'Kindness',   emoji: '💛' },
  { label: 'Patience',   emoji: '⏳' },
  { label: 'Honesty',    emoji: '💬' },
  { label: 'Gratitude',  emoji: '🙏' },
]

// ── Skin tone helper ──────────────────────────────────────────────────────────

const SKIN_COLORS: Record<string, string> = {
  'tone-1': '#FFE0BD',
  'tone-2': '#F4C78A',
  'tone-3': '#C68642',
  'tone-4': '#8D5524',
}

function skinColor(profile: Profile): string {
  const avatar = profile.avatar as Record<string, string> | null
  return avatar?.skinTone ? (SKIN_COLORS[avatar.skinTone] ?? '#E5E7EB') : '#E5E7EB'
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StoryGeneratorProps {
  profiles: Profile[]
}

export function StoryGenerator({ profiles }: StoryGeneratorProps) {
  const [profileId, setProfileId]           = useState(profiles[0]?.id ?? '')
  const [scenarioId, setScenarioId]         = useState<ScenarioId | ''>('')
  const [customKeywords, setCustomKeywords] = useState(['', '', ''])
  const [lesson, setLesson]                 = useState('')
  const [storyText, setStoryText]           = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [saved, setSaved]                   = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [saveError, setSaveError]           = useState('')

  const selectedProfile  = profiles.find(p => p.id === profileId)
  const selectedScenario = SCENARIOS.find(s => s.id === scenarioId)
  const isCustom         = scenarioId === 'custom'
  const keywords: string[] = selectedScenario?.keywords
    ? [...selectedScenario.keywords]
    : customKeywords

  function setCustomKeyword(i: number, val: string) {
    setCustomKeywords(prev => prev.map((k, idx) => (idx === i ? val : k)))
  }

  function handleScenarioSelect(id: ScenarioId) {
    setScenarioId(id)
    setStoryText('')
    setSaved(false)
    setSaveError('')
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()

    if (!scenarioId) { setError('Please choose a scenario.'); return }
    if (isCustom && customKeywords.some(k => !k.trim())) {
      setError('Please fill in all 3 keywords for your custom idea.')
      return
    }
    if (!lesson.trim()) { setError('Please choose or type a life lesson.'); return }

    setError('')
    setStoryText('')
    setSaved(false)
    setSaveError('')
    setLoading(true)

    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, keywords, lesson, scenario: selectedScenario?.label }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setError(typeof data.error === 'string' ? data.error : 'Story generation failed. Please try again.')
        setLoading(false)
        return
      }

      const reader  = res.body.getReader()
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

  async function handleSave() {
    setSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, keywords, lesson, body: storyText }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(typeof data.error === 'string' ? data.error : 'Could not save. Please try again.')
        return
      }

      setSaved(true)
    } catch {
      setSaveError('Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-8">

      {/* ── Profile selector ── */}
      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Who is this story for?
        </p>
        <div className="flex flex-wrap gap-2">
          {profiles.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setProfileId(p.id); setStoryText(''); setSaved(false) }}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                profileId === p.id
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-gray-200 text-gray-600 hover:border-amber-300'
              }`}
            >
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: skinColor(p) }}
              >
                {p.name[0].toUpperCase()}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── Scenario picker ── */}
      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          What&apos;s the setting?
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleScenarioSelect(s.id as ScenarioId)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-all hover:scale-[1.02] ${
                scenarioId === s.id
                  ? 'border-amber-500 bg-amber-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-amber-200'
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs font-medium leading-tight text-gray-700">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Selected scenario keywords */}
        {selectedScenario && !isCustom && selectedScenario.keywords && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedScenario.keywords.map(kw => (
              <span key={kw} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Custom keyword inputs */}
        {isCustom && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {customKeywords.map((kw, i) => (
              <input
                key={i}
                type="text"
                value={kw}
                maxLength={50}
                onChange={e => setCustomKeyword(i, e.target.value)}
                placeholder={i === 0 ? 'e.g. dinosaurs' : i === 1 ? 'e.g. rockets' : 'e.g. rain'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Lesson picker ── */}
      <section>
        <p className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          What will {selectedProfile?.name ?? 'your child'} learn?
        </p>
        <div className="mb-2 flex flex-wrap gap-2">
          {LESSON_PRESETS.map(({ label, emoji }) => (
            <button
              key={label}
              type="button"
              onClick={() => setLesson(label)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                lesson === label
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-gray-200 text-gray-600 hover:border-amber-300'
              }`}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={lesson}
            maxLength={120}
            onChange={e => setLesson(e.target.value)}
            placeholder="Or type your own lesson…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {lesson.length}/120
          </span>
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Generate button ── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-amber-600 py-3.5 text-sm font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-50"
      >
        {loading ? 'Writing the story…' : `✨ Generate story for ${selectedProfile?.name ?? 'your child'}`}
      </button>

      {/* ── Story output ── */}
      {(loading || storyText) && (
        <section className="rounded-xl border border-amber-100 bg-amber-50 p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
            {loading && !storyText ? 'Your story is being written…' : `A story for ${selectedProfile?.name ?? 'your child'}`}
          </p>

          {/* Skeleton */}
          {loading && !storyText && (
            <div className="space-y-2.5">
              {[0.75, 1, 0.85, 1, 0.65, 1, 0.9].map((w, i) => (
                <div
                  key={i}
                  className="h-3.5 animate-pulse rounded bg-amber-200"
                  style={{ width: `${w * 100}%` }}
                />
              ))}
            </div>
          )}

          {storyText && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {storyText}
            </p>
          )}
        </section>
      )}

      {/* ── Save button ── */}
      {storyText && !loading && (
        <div className="flex flex-col items-center gap-2">
          {saved ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-5 py-3 text-sm font-medium text-green-700">
              <span>✓</span> Story saved to {selectedProfile?.name}&apos;s library
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl border-2 border-amber-500 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              {saving ? 'Saving…' : '🔖 Save this story'}
            </button>
          )}
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
        </div>
      )}

    </form>
  )
}
