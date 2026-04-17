'use client'

import type { AvatarData } from '@/lib/schemas'

// ── Constants ─────────────────────────────────────────────────────────────────

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

export const GENDERS: { value: NonNullable<AvatarData['gender']>; label: string; icon: string }[] = [
  { value: 'boy', label: 'Boy', icon: '👦' },
  { value: 'girl', label: 'Girl', icon: '👧' },
]

export const EYE_COLORS: { value: NonNullable<AvatarData['eyeColor']>; color: string; label: string }[] = [
  { value: 'brown', color: '#634E37', label: 'Brown' },
  { value: 'blue', color: '#4A86C8', label: 'Blue' },
  { value: 'green', color: '#4A7C59', label: 'Green' },
  { value: 'hazel', color: '#8E6B23', label: 'Hazel' },
]

export const EYE_SHAPES: { value: NonNullable<AvatarData['eyeShape']>; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'almond', label: 'Almond' },
  { value: 'wide', label: 'Wide' },
]

export const NOSE_STYLES: { value: NonNullable<AvatarData['noseStyle']>; label: string }[] = [
  { value: 'button', label: 'Button' },
  { value: 'small', label: 'Small' },
  { value: 'wide', label: 'Wide' },
]

export const LIP_STYLES: { value: NonNullable<AvatarData['lipStyle']>; label: string }[] = [
  { value: 'thin', label: 'Thin' },
  { value: 'medium', label: 'Medium' },
  { value: 'full', label: 'Full' },
]

export const OUTFIT_STYLES: { value: NonNullable<AvatarData['outfitStyle']>; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'pajama', label: 'Pajama' },
  { value: 'dress', label: 'Dress' },
]

export const OUTFIT_COLORS: { value: NonNullable<AvatarData['outfitColor']>; color: string; label: string }[] = [
  { value: 'blue', color: '#6B9BD2', label: 'Blue' },
  { value: 'pink', color: '#F4A7B9', label: 'Pink' },
  { value: 'green', color: '#7EC8A4', label: 'Green' },
  { value: 'yellow', color: '#F5D76E', label: 'Yellow' },
  { value: 'red', color: '#E8786A', label: 'Red' },
  { value: 'purple', color: '#A78BBF', label: 'Purple' },
]

export const SHOES_STYLES: { value: NonNullable<AvatarData['shoesStyle']>; label: string }[] = [
  { value: 'sneakers', label: 'Sneakers' },
  { value: 'boots', label: 'Boots' },
  { value: 'sandals', label: 'Sandals' },
  { value: 'barefoot', label: 'Barefoot' },
]

// ── Avatar description ────────────────────────────────────────────────────────

export function buildAvatarDescription(avatar: Partial<AvatarData>): string | undefined {
  const { skinTone, hairColor, hairStyle, gender, eyeColor, outfitStyle, outfitColor } = avatar
  if (!skinTone && !hairColor && !hairStyle) return undefined

  const parts: string[] = []

  if (gender) parts.push(gender)

  const skinLabel = SKIN_TONES.find(t => t.value === skinTone)?.label ?? skinTone
  if (skinLabel) parts.push(`${skinLabel} skin tone`)

  const hairColorLabel = HAIR_COLORS.find(c => c.value === hairColor)?.label ?? hairColor
  const hairStyleLabel = HAIR_STYLES.find(s => s.value === hairStyle)?.label ?? hairStyle
  if (hairColorLabel && hairStyleLabel) parts.push(`${hairColorLabel} ${hairStyleLabel} hair`)
  else if (hairColorLabel) parts.push(`${hairColorLabel} hair`)
  else if (hairStyleLabel) parts.push(`${hairStyleLabel} hair`)

  if (eyeColor) {
    const eyeColorLabel = EYE_COLORS.find(e => e.value === eyeColor)?.label ?? eyeColor
    parts.push(`${eyeColorLabel} eyes`)
  }

  if (outfitStyle && outfitColor) {
    const outfitColorLabel = OUTFIT_COLORS.find(o => o.value === outfitColor)?.label ?? outfitColor
    const outfitStyleLabel = OUTFIT_STYLES.find(o => o.value === outfitStyle)?.label ?? outfitStyle
    parts.push(`wearing ${outfitColorLabel} ${outfitStyleLabel} outfit`)
  }

  return parts.join(', ')
}

// ── SVG Avatar Preview ────────────────────────────────────────────────────────

function AvatarPreview({ avatar }: { avatar: Partial<AvatarData> }) {
  const skinHex = SKIN_TONES.find(t => t.value === avatar.skinTone)?.color ?? '#FFE0BD'
  const hairHex = HAIR_COLORS.find(c => c.value === avatar.hairColor)?.color ?? '#C8A96E'
  const eyeHex = EYE_COLORS.find(e => e.value === avatar.eyeColor)?.color ?? '#634E37'
  const outfitHex = OUTFIT_COLORS.find(o => o.value === avatar.outfitColor)?.color ?? '#A8C8E8'

  const hairStyle = avatar.hairStyle ?? 'straight'
  const eyeShape = avatar.eyeShape ?? 'round'
  const noseStyle = avatar.noseStyle ?? 'button'
  const lipStyle = avatar.lipStyle ?? 'medium'
  const outfitStyle = avatar.outfitStyle ?? 'casual'
  const shoesStyle = avatar.shoesStyle ?? 'sneakers'
  const isGirl = avatar.gender === 'girl'
  const isBoy = avatar.gender === 'boy'
  const showDress = outfitStyle === 'dress' || (isGirl && outfitStyle !== 'pajama' && outfitStyle !== 'casual')

  // Pants color: slightly darker than outfit or a neutral
  const pantsHex = outfitStyle === 'pajama' ? outfitHex : '#5B7FA6'

  // Shoe colors
  const shoeMain =
    shoesStyle === 'boots' ? '#795548' :
    shoesStyle === 'sandals' ? '#FFD54F' :
    shoesStyle === 'barefoot' ? skinHex : '#ECEFF1'
  const shoeAccent =
    shoesStyle === 'boots' ? '#5D4037' :
    shoesStyle === 'sandals' ? '#FFC107' :
    shoesStyle === 'barefoot' ? skinHex : '#B0BEC5'

  return (
    <svg
      viewBox="0 0 100 148"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto w-36 drop-shadow-sm"
      aria-label="Avatar preview"
    >
      {/* Background */}
      <rect width="100" height="148" rx="16" fill="#FFF8F0" />

      {/* ── SHOES ── */}
      {shoesStyle === 'boots' && (
        <>
          <rect x="31" y="122" width="16" height="16" rx="3" fill={shoeMain} />
          <rect x="53" y="122" width="16" height="16" rx="3" fill={shoeMain} />
        </>
      )}
      <ellipse cx="39" cy="136" rx="11" ry="7" fill={shoeMain} />
      <ellipse cx="61" cy="136" rx="11" ry="7" fill={shoeMain} />
      <ellipse cx="37" cy="133" rx="10" ry="5" fill={shoeAccent} />
      <ellipse cx="63" cy="133" rx="10" ry="5" fill={shoeAccent} />
      {shoesStyle === 'sandals' && (
        <>
          <line x1="30" y1="131" x2="48" y2="129" stroke="#FF8F00" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="52" y1="131" x2="70" y2="129" stroke="#FF8F00" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {/* ── LEGS / PANTS ── */}
      {showDress ? (
        /* dress hem covers legs */
        <>
          <rect x="33" y="113" width="13" height="20" rx="6" fill={outfitHex} />
          <rect x="54" y="113" width="13" height="20" rx="6" fill={outfitHex} />
        </>
      ) : (
        <>
          <rect x="33" y="110" width="13" height="22" rx="6" fill={pantsHex} />
          <rect x="54" y="110" width="13" height="22" rx="6" fill={pantsHex} />
        </>
      )}

      {/* ── BODY / OUTFIT ── */}
      {showDress ? (
        <path d="M 30 80 L 70 80 L 75 115 L 25 115 Z" fill={outfitHex} />
      ) : (
        <rect x="30" y="80" width="40" height="32" rx="5" fill={outfitHex} />
      )}

      {/* Outfit details */}
      {outfitStyle === 'formal' && (
        <>
          <line x1="50" y1="82" x2="50" y2="110" stroke="white" strokeWidth="1" opacity="0.6" />
          <circle cx="50" cy="87" r="1.5" fill="white" opacity="0.7" />
          <circle cx="50" cy="94" r="1.5" fill="white" opacity="0.7" />
          <circle cx="50" cy="101" r="1.5" fill="white" opacity="0.7" />
        </>
      )}
      {outfitStyle === 'pajama' && (
        <path d="M 36 85 Q 43 90 50 85 Q 57 90 64 85" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      )}
      {showDress && isGirl && (
        <>
          <path d="M 38 92 Q 50 97 62 92" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        </>
      )}

      {/* ── ARMS ── */}
      <rect x="-6" y="0" width="13" height="30" rx="6" fill={outfitHex} transform="translate(28,82) rotate(-12)" />
      <rect x="-6" y="0" width="13" height="30" rx="6" fill={outfitHex} transform="translate(72,82) rotate(12)" />
      {/* Hands */}
      <circle cx="20" cy="114" r="7" fill={skinHex} />
      <circle cx="80" cy="114" r="7" fill={skinHex} />

      {/* ── NECK ── */}
      <rect x="43" y="74" width="14" height="10" rx="4" fill={skinHex} />

      {/* ── EARS ── */}
      <ellipse cx="23" cy="47" rx="6" ry="7" fill={skinHex} />
      <ellipse cx="77" cy="47" rx="6" ry="7" fill={skinHex} />
      {/* Ear inner */}
      <ellipse cx="23" cy="47" rx="3.5" ry="4.5" fill={skinHex} opacity="0.6" style={{ filter: 'brightness(0.88)' }} />
      <ellipse cx="77" cy="47" rx="3.5" ry="4.5" fill={skinHex} opacity="0.6" style={{ filter: 'brightness(0.88)' }} />

      {/* ── HAIR (back layer — drawn before head) ── */}
      {hairStyle === 'straight' && (
        <>
          <ellipse cx="50" cy="40" rx="28" ry="31" fill={hairHex} />
          {/* Side strands for girl / long */}
          {(isGirl || !isBoy) && (
            <>
              <rect x="20" y="38" width="8" height="34" rx="4" fill={hairHex} />
              <rect x="72" y="38" width="8" height="34" rx="4" fill={hairHex} />
            </>
          )}
        </>
      )}
      {hairStyle === 'curly' && (
        <>
          <ellipse cx="50" cy="40" rx="28" ry="30" fill={hairHex} />
          <circle cx="33" cy="24" r="10" fill={hairHex} />
          <circle cx="50" cy="16" r="10" fill={hairHex} />
          <circle cx="67" cy="24" r="10" fill={hairHex} />
          <circle cx="26" cy="36" r="8" fill={hairHex} />
          <circle cx="74" cy="36" r="8" fill={hairHex} />
          {(isGirl || !isBoy) && (
            <>
              <circle cx="24" cy="50" r="8" fill={hairHex} />
              <circle cx="76" cy="50" r="8" fill={hairHex} />
            </>
          )}
        </>
      )}
      {hairStyle === 'wavy' && (
        <>
          <ellipse cx="50" cy="40" rx="28" ry="30" fill={hairHex} />
          <path
            d="M 22 47 Q 18 34 24 22 Q 30 10 40 12 Q 44 6 50 6 Q 56 6 60 12 Q 70 10 76 22 Q 82 34 78 47"
            fill={hairHex}
          />
          {(isGirl || !isBoy) && (
            <>
              <path d="M 21 47 Q 17 58 21 66 Q 18 72 22 77" stroke={hairHex} strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M 79 47 Q 83 58 79 66 Q 82 72 78 77" stroke={hairHex} strokeWidth="8" fill="none" strokeLinecap="round" />
            </>
          )}
        </>
      )}

      {/* ── HEAD ── */}
      <ellipse cx="50" cy="46" rx="26" ry="28" fill={skinHex} />

      {/* ── HAIR FRINGE (front layer) ── */}
      {hairStyle === 'straight' && (
        <path d="M 24 44 C 28 20 72 20 76 44 C 70 30 50 26 30 30 Z" fill={hairHex} />
      )}
      {hairStyle === 'curly' && (
        <>
          <circle cx="35" cy="26" r="9" fill={hairHex} />
          <circle cx="50" cy="20" r="9" fill={hairHex} />
          <circle cx="65" cy="26" r="9" fill={hairHex} />
        </>
      )}
      {hairStyle === 'wavy' && (
        <path
          d="M 24 44 Q 28 28 36 26 Q 44 22 50 20 Q 56 22 64 26 Q 72 28 76 44 Q 68 32 50 30 Q 32 32 24 44 Z"
          fill={hairHex}
        />
      )}

      {/* ── EYES ── */}
      {eyeShape === 'round' && (
        <>
          <circle cx="40" cy="44" r="5.5" fill="white" />
          <circle cx="60" cy="44" r="5.5" fill="white" />
          <circle cx="40" cy="44" r="3.5" fill={eyeHex} />
          <circle cx="60" cy="44" r="3.5" fill={eyeHex} />
          <circle cx="41.5" cy="42.5" r="1.2" fill="white" />
          <circle cx="61.5" cy="42.5" r="1.2" fill="white" />
        </>
      )}
      {eyeShape === 'almond' && (
        <>
          <ellipse cx="40" cy="44" rx="6" ry="4" fill="white" />
          <ellipse cx="60" cy="44" rx="6" ry="4" fill="white" />
          <ellipse cx="40" cy="44" rx="3.8" ry="2.8" fill={eyeHex} />
          <ellipse cx="60" cy="44" rx="3.8" ry="2.8" fill={eyeHex} />
          <circle cx="41.5" cy="43" r="1" fill="white" />
          <circle cx="61.5" cy="43" r="1" fill="white" />
          {/* Eyelash lines */}
          <path d="M 34 42 Q 40 38 46 42" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 54 42 Q 60 38 66 42" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}
      {eyeShape === 'wide' && (
        <>
          <circle cx="40" cy="44" r="7" fill="white" />
          <circle cx="60" cy="44" r="7" fill="white" />
          <circle cx="40" cy="44" r="4.5" fill={eyeHex} />
          <circle cx="60" cy="44" r="4.5" fill={eyeHex} />
          <circle cx="42" cy="42" r="1.5" fill="white" />
          <circle cx="62" cy="42" r="1.5" fill="white" />
        </>
      )}
      {/* Eyelashes for girl */}
      {isGirl && eyeShape !== 'almond' && (
        <>
          <path d="M 34 41 Q 40 37 46 41" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 54 41 Q 60 37 66 41" stroke="#333" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── NOSE ── */}
      {noseStyle === 'button' && (
        <ellipse cx="50" cy="54" rx="3" ry="2" fill={skinHex} style={{ filter: 'brightness(0.82)' }} />
      )}
      {noseStyle === 'small' && (
        <>
          <circle cx="47.5" cy="54" r="1.5" fill={skinHex} style={{ filter: 'brightness(0.78)' }} />
          <circle cx="52.5" cy="54" r="1.5" fill={skinHex} style={{ filter: 'brightness(0.78)' }} />
        </>
      )}
      {noseStyle === 'wide' && (
        <>
          <ellipse cx="46" cy="54" rx="2.5" ry="2" fill={skinHex} style={{ filter: 'brightness(0.78)' }} />
          <ellipse cx="54" cy="54" rx="2.5" ry="2" fill={skinHex} style={{ filter: 'brightness(0.78)' }} />
        </>
      )}

      {/* ── MOUTH ── */}
      {lipStyle === 'thin' && (
        <path d="M 43 62 Q 50 66 57 62" stroke="#C97070" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
      {lipStyle === 'medium' && (
        <>
          <path d="M 42 62 Q 50 68 58 62" stroke="#C97070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 44 62 Q 50 65 56 62" fill="#E8A0A0" opacity="0.6" />
        </>
      )}
      {(lipStyle === 'full' || (!lipStyle)) && (
        <>
          <path d="M 41 62 Q 50 70 59 62 Q 54 66 50 66 Q 46 66 41 62 Z" fill="#E08080" />
          <path d="M 41 62 Q 50 58 59 62" stroke="#C97070" strokeWidth="1.2" fill="none" />
        </>
      )}

      {/* ── CHEEKS ── */}
      <ellipse cx="32" cy="57" rx="6" ry="4" fill="#FFB3C1" opacity="0.45" />
      <ellipse cx="68" cy="57" rx="6" ry="4" fill="#FFB3C1" opacity="0.45" />

      {/* ── HAIR ACCESSORY for girl ── */}
      {isGirl && (
        <>
          <circle cx="30" cy="32" r="5" fill="#FF8FAB" />
          <circle cx="30" cy="32" r="3" fill="#FFB3C6" />
        </>
      )}
    </svg>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-medium text-gray-600">{children}</p>
}

function ColorSwatch({
  color,
  label,
  selected,
  onClick,
}: {
  color: string
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
        selected ? 'scale-110 border-amber-600 ring-2 ring-amber-300' : 'border-transparent'
      }`}
      style={{ backgroundColor: color }}
    />
  )
}

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? 'border-amber-500 bg-amber-100 text-amber-800'
          : 'border-gray-200 text-gray-600 hover:border-amber-300'
      }`}
    >
      {label}
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export interface AvatarBuilderProps {
  value: Partial<AvatarData>
  onChange: (updated: Partial<AvatarData>) => void
}

export function AvatarBuilder({ value, onChange }: AvatarBuilderProps) {
  function set<K extends keyof AvatarData>(key: K, val: AvatarData[K]) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="rounded-xl bg-amber-50 p-4">
      <p className="mb-3 text-sm font-medium text-amber-900">
        Avatar <span className="font-normal text-gray-500">(optional)</span>
      </p>

      {/* Live preview */}
      <div className="mb-5">
        <AvatarPreview avatar={value} />
      </div>

      {/* Gender */}
      <div className="mb-4">
        <SectionLabel>Gender</SectionLabel>
        <div className="flex gap-2">
          {GENDERS.map(({ value: v, label, icon }) => (
            <ChipButton
              key={v}
              label={`${icon} ${label}`}
              selected={value.gender === v}
              onClick={() => set('gender', v)}
            />
          ))}
        </div>
      </div>

      {/* Skin tone */}
      <div className="mb-4">
        <SectionLabel>Skin tone</SectionLabel>
        <div className="flex gap-3">
          {SKIN_TONES.map(({ value: v, color, label }) => (
            <ColorSwatch
              key={v}
              color={color}
              label={label}
              selected={value.skinTone === v}
              onClick={() => set('skinTone', v)}
            />
          ))}
        </div>
      </div>

      {/* Hair color */}
      <div className="mb-4">
        <SectionLabel>Hair color</SectionLabel>
        <div className="flex gap-3">
          {HAIR_COLORS.map(({ value: v, color, label }) => (
            <ColorSwatch
              key={v}
              color={color}
              label={label}
              selected={value.hairColor === v}
              onClick={() => set('hairColor', v)}
            />
          ))}
        </div>
      </div>

      {/* Hair style */}
      <div className="mb-4">
        <SectionLabel>Hair style</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {HAIR_STYLES.map(({ value: v, label }) => (
            <ChipButton
              key={v}
              label={label}
              selected={value.hairStyle === v}
              onClick={() => set('hairStyle', v)}
            />
          ))}
        </div>
      </div>

      {/* Eye color */}
      <div className="mb-4">
        <SectionLabel>Eye color</SectionLabel>
        <div className="flex gap-3">
          {EYE_COLORS.map(({ value: v, color, label }) => (
            <ColorSwatch
              key={v}
              color={color}
              label={label}
              selected={value.eyeColor === v}
              onClick={() => set('eyeColor', v)}
            />
          ))}
        </div>
      </div>

      {/* Eye shape */}
      <div className="mb-4">
        <SectionLabel>Eye shape</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {EYE_SHAPES.map(({ value: v, label }) => (
            <ChipButton
              key={v}
              label={label}
              selected={value.eyeShape === v}
              onClick={() => set('eyeShape', v)}
            />
          ))}
        </div>
      </div>

      {/* Nose */}
      <div className="mb-4">
        <SectionLabel>Nose</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {NOSE_STYLES.map(({ value: v, label }) => (
            <ChipButton
              key={v}
              label={label}
              selected={value.noseStyle === v}
              onClick={() => set('noseStyle', v)}
            />
          ))}
        </div>
      </div>

      {/* Lips */}
      <div className="mb-4">
        <SectionLabel>Lips</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {LIP_STYLES.map(({ value: v, label }) => (
            <ChipButton
              key={v}
              label={label}
              selected={value.lipStyle === v}
              onClick={() => set('lipStyle', v)}
            />
          ))}
        </div>
      </div>

      {/* Outfit style */}
      <div className="mb-4">
        <SectionLabel>Outfit</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {OUTFIT_STYLES.map(({ value: v, label }) => (
            <ChipButton
              key={v}
              label={label}
              selected={value.outfitStyle === v}
              onClick={() => set('outfitStyle', v)}
            />
          ))}
        </div>
      </div>

      {/* Outfit color */}
      <div className="mb-4">
        <SectionLabel>Outfit color</SectionLabel>
        <div className="flex flex-wrap gap-3">
          {OUTFIT_COLORS.map(({ value: v, color, label }) => (
            <ColorSwatch
              key={v}
              color={color}
              label={label}
              selected={value.outfitColor === v}
              onClick={() => set('outfitColor', v)}
            />
          ))}
        </div>
      </div>

      {/* Shoes */}
      <div>
        <SectionLabel>Shoes</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {SHOES_STYLES.map(({ value: v, label }) => (
            <ChipButton
              key={v}
              label={label}
              selected={value.shoesStyle === v}
              onClick={() => set('shoesStyle', v)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
