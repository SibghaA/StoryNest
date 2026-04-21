'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

// ── Relationship options ──────────────────────────────────────────────────────

const RELATIONSHIPS = [
  { label: 'Siblings',      emoji: '👧🧒' },
  { label: 'Twins',         emoji: '👯' },
  { label: 'Best Friends',  emoji: '💛' },
  { label: 'Friends',       emoji: '🤝' },
  { label: 'Cousins',       emoji: '🌟' },
  { label: 'Classmates',    emoji: '🏫' },
]

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
  const router = useRouter()
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(
    profiles[0] ? [profiles[0].id] : [],
  )
  const [scenarioId, setScenarioId]         = useState<ScenarioId | ''>('')
  const [customKeywords, setCustomKeywords] = useState(['', '', ''])
  const [lesson, setLesson]                 = useState('')
  const [relationship, setRelationship]     = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  const primaryProfile   = profiles.find(p => p.id === selectedProfileIds[0])
  const selectedScenario = SCENARIOS.find(s => s.id === scenarioId)

  function toggleProfile(id: string) {
    setSelectedProfileIds(prev => {
      if (prev.includes(id)) {
        // Always keep at least one selected
        return prev.length > 1 ? prev.filter(x => x !== id) : prev
      }
      return prev.length < 5 ? [...prev, id] : prev
    })
    setError('')
  }
  const isCustom         = scenarioId === 'custom'
  const keywords: string[] = selectedScenario?.keywords
    ? [...selectedScenario.keywords]
    : customKeywords

  function setCustomKeyword(i: number, val: string) {
    setCustomKeywords(prev => prev.map((k, idx) => (idx === i ? val : k)))
  }

  function handleScenarioSelect(id: ScenarioId) {
    setScenarioId(id)
    setError('')
    setError('')
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()

    if (selectedProfileIds.length === 0) { setError('Please select at least one child.'); return }
    if (!scenarioId) { setError('Please choose a scenario.'); return }
    if (isCustom && customKeywords.some(k => !k.trim())) {
      setError('Please fill in all 3 keywords for your custom idea.')
      return
    }
    if (!lesson.trim()) { setError('Please choose or type a life lesson.'); return }

    setError('')
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds: selectedProfileIds,
          keywords,
          lesson,
          scenario: selectedScenario?.label,
          relationship: selectedProfileIds.length > 1 && relationship ? relationship : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Story generation failed. Please try again.')
        return
      }

      router.push(`/stories/${data.data.storyId}`)
    } catch {
      setError('Story generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-8">

      {/* ── Profile selector (multi-select) ── */}
      <section>
        <p className="mb-1 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Who is this story for?
        </p>
        <p className="mb-3 text-xs text-gray-500">Select one or more children</p>
        <div className="flex flex-wrap gap-2">
          {profiles.map(p => {
            const isSelected = selectedProfileIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProfile(p.id)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isSelected
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
                {isSelected && (
                  <span className="ml-0.5 text-amber-600">✓</span>
                )}
              </button>
            )
          })}
        </div>
        {selectedProfileIds.length > 1 && (
          <p className="mt-2 text-xs text-amber-700">
            Story will feature {selectedProfileIds.length} children together
          </p>
        )}
      </section>

      {/* ── Relationship picker (multi-child only) ── */}
      {selectedProfileIds.length > 1 && (
        <section>
          <p className="mb-1 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            How do they know each other?
          </p>
          <p className="mb-3 text-xs text-gray-500">Optional — helps personalise the story</p>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIPS.map(({ label, emoji }) => (
              <button
                key={label}
                type="button"
                onClick={() => setRelationship(prev => prev === label ? '' : label)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  relationship === label
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </section>
      )}

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
          What will {selectedProfileIds.length > 1 ? 'the children' : (primaryProfile?.name ?? 'your child')} learn?
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
        {loading ? 'Writing the story…' : `✨ Generate story for ${selectedProfileIds.length > 1 ? profiles.filter(p => selectedProfileIds.includes(p.id)).map(p => p.name).join(' & ') : (primaryProfile?.name ?? 'your child')}`}
      </button>


    </form>
  )
}
