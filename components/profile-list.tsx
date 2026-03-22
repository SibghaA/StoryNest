'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Profile {
  id: string
  name: string
  ageRange: string
  avatar: unknown
}

const SKIN_COLORS: Record<string, string> = {
  'tone-1': '#FFE0BD',
  'tone-2': '#F4C78A',
  'tone-3': '#C68642',
  'tone-4': '#8D5524',
}

const AGE_LABELS: Record<string, string> = {
  '0-12m': '0–12 months',
  '1-2y': '1–2 years',
  '2-3y': '2–3 years',
}

export function ProfileList({ profiles }: { profiles: Profile[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}'s profile? All their stories will be removed.`)) return
    setDeleting(id)
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-200 p-12 text-center">
        <p className="text-4xl">🌙</p>
        <p className="mt-3 text-gray-600">No profiles yet. Add your first child to get started.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {profiles.map(profile => {
        const avatar = profile.avatar as Record<string, string> | null
        const skinColor = avatar?.skinTone ? (SKIN_COLORS[avatar.skinTone] ?? '#e5e7eb') : '#e5e7eb'

        return (
          <li
            key={profile.id}
            className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-gray-700"
              style={{ backgroundColor: skinColor }}
            >
              {profile.name[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <p className="font-semibold text-gray-900">{profile.name}</p>
              <p className="text-sm text-gray-500">
                {AGE_LABELS[profile.ageRange] ?? profile.ageRange}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/profiles/${profile.id}/edit`}
                className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-amber-400 hover:text-amber-700"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(profile.id, profile.name)}
                disabled={deleting === profile.id}
                aria-label={`Delete ${profile.name}'s profile`}
                className="rounded-lg border border-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                {deleting === profile.id ? '…' : 'Delete'}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
