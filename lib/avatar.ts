import type { AvatarData } from '@/lib/schemas'

const SKIN_TONE_LABELS: Record<string, string> = {
  'tone-1': 'Light',
  'tone-2': 'Medium light',
  'tone-3': 'Medium',
  'tone-4': 'Dark',
}

const HAIR_COLOR_LABELS: Record<string, string> = {
  black: 'Black',
  brown: 'Brown',
  blonde: 'Blonde',
  red: 'Red',
}

const HAIR_STYLE_LABELS: Record<string, string> = {
  open: 'Open / Down',
  short: 'Short Crop',
  pigtails: 'Pigtails',
  bun: 'Bun',
  braids: 'Braids',
  curly: 'Curly',
}

const EYE_COLOR_LABELS: Record<string, string> = {
  brown: 'Brown',
  blue: 'Blue',
  green: 'Green',
  hazel: 'Hazel',
}

const OUTFIT_COLOR_LABELS: Record<string, string> = {
  blue: 'Blue',
  pink: 'Pink',
  green: 'Green',
  yellow: 'Yellow',
  red: 'Red',
  purple: 'Purple',
}

const OUTFIT_STYLE_LABELS: Record<string, string> = {
  casual: 'Casual',
  formal: 'Formal',
  pajama: 'Pajama',
  dress: 'Dress',
}

export function buildAvatarDescription(avatar: unknown): string {
  if (!avatar || typeof avatar !== 'object') return ''
  const a = avatar as Partial<AvatarData>
  const { skinTone, hairColor, hairStyle, gender, eyeColor, outfitStyle, outfitColor } = a

  if (!skinTone && !hairColor && !hairStyle) return ''

  const parts: string[] = []

  if (gender) parts.push(gender)

  const skinLabel = skinTone ? (SKIN_TONE_LABELS[skinTone] ?? skinTone) : null
  if (skinLabel) parts.push(`${skinLabel} skin tone`)

  const hairColorLabel = hairColor ? (HAIR_COLOR_LABELS[hairColor] ?? hairColor) : null
  const hairStyleLabel = hairStyle ? (HAIR_STYLE_LABELS[hairStyle] ?? hairStyle) : null
  if (hairColorLabel && hairStyleLabel) parts.push(`${hairColorLabel} ${hairStyleLabel} hair`)
  else if (hairColorLabel) parts.push(`${hairColorLabel} hair`)
  else if (hairStyleLabel) parts.push(`${hairStyleLabel} hair`)

  if (eyeColor) {
    const eyeColorLabel = EYE_COLOR_LABELS[eyeColor] ?? eyeColor
    parts.push(`${eyeColorLabel} eyes`)
  }

  if (outfitStyle && outfitColor) {
    const outfitColorLabel = OUTFIT_COLOR_LABELS[outfitColor] ?? outfitColor
    const outfitStyleLabel = OUTFIT_STYLE_LABELS[outfitStyle] ?? outfitStyle
    parts.push(`wearing ${outfitColorLabel} ${outfitStyleLabel} outfit`)
  }

  return parts.join(', ')
}
