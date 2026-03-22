'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AvatarData, CreateProfileInput } from '@/lib/schemas'

const SKIN_TONES: { value: AvatarData['skinTone']; color: string; label: string }[] = [
  { value: 'tone-1', color: '#FFE0BD', label: 'Light' },
  { value: 'tone-2', color: '#F4C78A', label: 'Medium light' },
  { value: 'tone-3', color: '#C68642', label: 'Medium' },
  { value: 'tone-4', color: '#8D5524', label: 'Dark' },
]

const HAIR_COLORS: { value: AvatarData['hairColor']; color: string; label: string }[] = [
  { value: 'black', color: '#1a1a1a', label: 'Black' },
  { value: 'brown', color: '#8B4513', label: 'Brown' },
  { value: 'blonde', color: '#E8D47A', label: 'Blonde' },
  { value: 'red', color: '#C0392B', label: 'Red' },
]

const HAIR_STYLES: { value: AvatarData['hairStyle']; label: string }[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'curly', label: 'Curly' },
  { value: 'wavy', label: 'Wavy' },
]

interface ProfileFormProps {
  defaultValues?: {
    id: string
    name: string
    ageRange: string
    avatar: Record<string, string>
  }
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter()
  const isEditing = !!defaultValues

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [ageRange, setAgeRange] = useState<CreateProfileInput['ageRange'] | ''>(
    (defaultValues?.ageRange as CreateProfileInput['ageRange']) ?? '',
  )
  const [skinTone, setSkinTone] = useState<AvatarData['skinTone'] | ''>(
    (defaultValues?.avatar?.skinTone as AvatarData['skinTone']) ?? '',
  )
  const [hairColor, setHairColor] = useState<AvatarData['hairColor'] | ''>(
    (defaultValues?.avatar?.hairColor as AvatarData['hairColor']) ?? '',
  )
  const [hairStyle, setHairStyle] = useState<AvatarData['hairStyle'] | ''>(
    (defaultValues?.avatar?.hairStyle as AvatarData['hairStyle']) ?? '',
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedSkinColor =
    SKIN_TONES.find(t => t.value === skinTone)?.color ?? '#e5e7eb'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ageRange) {
      setError('Please select an age range')
      return
    }
    setError('')
    setLoading(true)

    const avatar =
      skinTone && hairColor && hairStyle ? { skinTone, hairColor, hairStyle } : undefined

    const body = { name, ageRange, avatar }
    const url = isEditing ? `/api/profiles/${defaultValues.id}` : '/api/profiles'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(typeof data.error === 'string' ? data.error : 'Something went wrong')
      return
    }

    router.push('/profiles')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar preview */}
      <div className="flex justify-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-200 text-3xl font-bold text-gray-700"
          style={{ backgroundColor: selectedSkinColor }}
        >
          {name ? name[0].toUpperCase() : '?'}
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Child&apos;s name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          maxLength={50}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Zara, Leo, Mia"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Age range */}
      <div>
        <p className="mb-2 block text-sm font-medium text-gray-700">
          Age range <span className="text-red-500">*</span>
        </p>
        <div className="flex gap-2">
          {(['0-12m', '1-2y', '2-3y'] as const).map(range => (
            <button
              key={range}
              type="button"
              onClick={() => setAgeRange(range)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                ageRange === range
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-gray-200 text-gray-600 hover:border-amber-300'
              }`}
            >
              {range === '0-12m' ? '0–12m' : range === '1-2y' ? '1–2y' : '2–3y'}
            </button>
          ))}
        </div>
      </div>

      {/* Avatar builder */}
      <div className="rounded-xl bg-amber-50 p-4">
        <p className="mb-4 text-sm font-medium text-amber-900">
          Avatar <span className="font-normal text-gray-500">(optional)</span>
        </p>

        {/* Skin tone */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-gray-600">Skin tone</p>
          <div className="flex gap-3">
            {SKIN_TONES.map(({ value, color, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSkinTone(value)}
                aria-label={label}
                className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                  skinTone === value ? 'scale-110 border-amber-600' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Hair color */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-gray-600">Hair color</p>
          <div className="flex gap-3">
            {HAIR_COLORS.map(({ value, color, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setHairColor(value)}
                aria-label={label}
                className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                  hairColor === value ? 'scale-110 border-amber-600' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Hair style */}
        <div>
          <p className="mb-2 text-xs text-gray-600">Hair style</p>
          <div className="flex gap-2">
            {HAIR_STYLES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setHairStyle(value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  hairStyle === value
                    ? 'border-amber-500 bg-amber-100 text-amber-800'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEditing ? 'Save changes' : 'Create profile'}
        </button>
      </div>
    </form>
  )
}
