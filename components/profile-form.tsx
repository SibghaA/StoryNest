'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AvatarData, CreateProfileInput } from '@/lib/schemas'
import { AvatarBuilder, SKIN_TONES } from '@/components/avatar-builder'

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
      <AvatarBuilder
        skinTone={skinTone}
        hairColor={hairColor}
        hairStyle={hairStyle}
        onSkinToneChange={setSkinTone}
        onHairColorChange={setHairColor}
        onHairStyleChange={setHairStyle}
      />

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
