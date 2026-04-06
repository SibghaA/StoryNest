'use client'

import type { AvatarData } from '@/lib/schemas'

// ── Data constants (exported so tests can assert counts and values) ────────────

export const SKIN_TONES: { value: AvatarData['skinTone']; color: string; label: string }[] = [
  { value: 'tone-1', color: '#FFE0BD', label: 'Light' },
  { value: 'tone-2', color: '#F4C78A', label: 'Medium light' },
  { value: 'tone-3', color: '#C68642', label: 'Medium' },
  { value: 'tone-4', color: '#8D5524', label: 'Dark' },
]

export const HAIR_COLORS: { value: AvatarData['hairColor']; color: string; label: string }[] = [
  { value: 'black', color: '#1a1a1a', label: 'Black' },
  { value: 'brown', color: '#8B4513', label: 'Brown' },
  { value: 'blonde', color: '#E8D47A', label: 'Blonde' },
  { value: 'red', color: '#C0392B', label: 'Red' },
]

export const HAIR_STYLES: { value: AvatarData['hairStyle']; label: string }[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'curly', label: 'Curly' },
  { value: 'wavy', label: 'Wavy' },
]

// ── Utility: produce a human-readable description for illustration prompts ────

export function buildAvatarDescription(
  avatar: Partial<AvatarData>,
): string | undefined {
  const { skinTone, hairColor, hairStyle } = avatar
  if (!skinTone && !hairColor && !hairStyle) return undefined

  const skinLabel = SKIN_TONES.find(t => t.value === skinTone)?.label ?? skinTone
  const hairColorLabel = HAIR_COLORS.find(c => c.value === hairColor)?.label ?? hairColor
  const hairStyleLabel = HAIR_STYLES.find(s => s.value === hairStyle)?.label ?? hairStyle

  const parts: string[] = []
  if (skinLabel) parts.push(`${skinLabel} skin tone`)
  if (hairColorLabel && hairStyleLabel) parts.push(`${hairColorLabel} ${hairStyleLabel} hair`)
  else if (hairColorLabel) parts.push(`${hairColorLabel} hair`)
  else if (hairStyleLabel) parts.push(`${hairStyleLabel} hair`)

  return parts.join(', ')
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AvatarBuilderProps {
  skinTone: AvatarData['skinTone'] | ''
  hairColor: AvatarData['hairColor'] | ''
  hairStyle: AvatarData['hairStyle'] | ''
  onSkinToneChange: (value: AvatarData['skinTone']) => void
  onHairColorChange: (value: AvatarData['hairColor']) => void
  onHairStyleChange: (value: AvatarData['hairStyle']) => void
}

export function AvatarBuilder({
  skinTone,
  hairColor,
  hairStyle,
  onSkinToneChange,
  onHairColorChange,
  onHairStyleChange,
}: AvatarBuilderProps) {
  return (
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
              onClick={() => onSkinToneChange(value)}
              aria-label={label}
              aria-pressed={skinTone === value}
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
              onClick={() => onHairColorChange(value)}
              aria-label={label}
              aria-pressed={hairColor === value}
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
              onClick={() => onHairStyleChange(value)}
              aria-pressed={hairStyle === value}
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
  )
}
