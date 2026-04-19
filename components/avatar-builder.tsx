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
  { value: 'open',      label: 'Open / Down' },
  { value: 'short',     label: 'Short Crop' },
  { value: 'pigtails',  label: 'Pigtails' },
  { value: 'bun',       label: 'Bun' },
  { value: 'braids',    label: 'Braids' },
  { value: 'curly',     label: 'Curly' },
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

// ── Colour utility ────────────────────────────────────────────────────────────

function blend(hex: string, target: '#ffffff' | '#000000', amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const tr = target === '#ffffff' ? 255 : 0
  return (
    '#' +
    [
      Math.round(r + (tr - r) * amount),
      Math.round(g + (tr - g) * amount),
      Math.round(b + (tr - b) * amount),
    ]
      .map(v => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0'))
      .join('')
  )
}

// ── SVG Avatar Preview ────────────────────────────────────────────────────────

function AvatarPreview({ avatar }: { avatar: Partial<AvatarData> }) {
  const skinHex   = SKIN_TONES.find(t => t.value === avatar.skinTone)?.color   ?? '#FFD5A8'
  const hairHex   = HAIR_COLORS.find(c => c.value === avatar.hairColor)?.color  ?? '#8B6914'
  const eyeHex    = EYE_COLORS.find(e => e.value === avatar.eyeColor)?.color    ?? '#5C4033'
  const outfitHex = OUTFIT_COLORS.find(o => o.value === avatar.outfitColor)?.color ?? '#7BB3D4'

  const hairStyle = avatar.hairStyle ?? 'open'
  const eyeShape  = avatar.eyeShape  ?? 'round'
  const noseStyle = avatar.noseStyle ?? 'button'
  const lipStyle  = avatar.lipStyle  ?? 'medium'
  const outfitStyle = avatar.outfitStyle ?? 'casual'
  const shoesStyle  = avatar.shoesStyle  ?? 'sneakers'
  const isGirl = avatar.gender === 'girl'
  const showDress = outfitStyle === 'dress' || (isGirl && outfitStyle !== 'pajama' && outfitStyle !== 'casual')

  const pantsHex = outfitStyle === 'pajama' ? outfitHex : '#5B7FA6'
  const shoeMain =
    shoesStyle === 'boots'    ? '#795548' :
    shoesStyle === 'sandals'  ? '#E8A825' :
    shoesStyle === 'barefoot' ? skinHex   : '#E8EAED'

  const skinShadow  = blend(skinHex,   '#000000', 0.14)
  const hairShadow  = blend(hairHex,   '#000000', 0.22)
  const eyeShadow   = blend(eyeHex,    '#000000', 0.30)
  const browColor   = blend(hairHex,   '#000000', 0.18)
  const outfitLight = blend(outfitHex, '#ffffff', 0.18)
  const outfitDark  = blend(outfitHex, '#000000', 0.12)
  const pantsDark   = blend(pantsHex,  '#000000', 0.18)
  const shoeDark    = blend(shoeMain,  '#000000', 0.22)
  const shoeLight   = blend(shoeMain,  '#ffffff', 0.25)

  return (
    <svg
      viewBox="0 0 200 260"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto w-44 drop-shadow-md"
      aria-label="Avatar preview"
    >
      <defs>
        <radialGradient id="av-skin" cx="42%" cy="33%" r="65%">
          <stop offset="0%"   stopColor={blend(skinHex, '#ffffff', 0.32)} />
          <stop offset="60%"  stopColor={skinHex} />
          <stop offset="100%" stopColor={skinShadow} />
        </radialGradient>
        <linearGradient id="av-hair" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%"   stopColor={blend(hairHex, '#ffffff', 0.38)} />
          <stop offset="38%"  stopColor={hairHex} />
          <stop offset="100%" stopColor={hairShadow} />
        </linearGradient>
        <radialGradient id="av-iris" cx="34%" cy="30%" r="60%">
          <stop offset="0%"   stopColor={blend(eyeHex, '#ffffff', 0.52)} />
          <stop offset="50%"  stopColor={eyeHex} />
          <stop offset="100%" stopColor={eyeShadow} />
        </radialGradient>
        <linearGradient id="av-outfit" x1="0%" y1="0%" x2="8%" y2="100%">
          <stop offset="0%"   stopColor={outfitLight} />
          <stop offset="100%" stopColor={outfitDark} />
        </linearGradient>
        <linearGradient id="av-pants" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={pantsHex} />
          <stop offset="100%" stopColor={pantsDark} />
        </linearGradient>
        <radialGradient id="av-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FF9EB8" stopOpacity="0.58" />
          <stop offset="100%" stopColor="#FF9EB8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="av-shoe" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor={shoeLight} />
          <stop offset="100%" stopColor={shoeDark} />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="200" height="260" rx="24" fill="#FFF6ED" />

      {/* ── SHOES / FEET ── */}
      {shoesStyle === 'barefoot' ? (
        <>
          <ellipse cx="80"  cy="251" rx="19" ry="9" fill={skinHex} />
          <ellipse cx="120" cy="251" rx="19" ry="9" fill={skinHex} />
          {/* toes */}
          {([65,72,80,88,95] as number[]).map((x, i) => (
            <circle key={i} cx={x} cy={243} r="3.5" fill={skinShadow} />
          ))}
          {([105,112,120,128,135] as number[]).map((x, i) => (
            <circle key={i} cx={x} cy={243} r="3.5" fill={skinShadow} />
          ))}
        </>
      ) : (
        <>
          {shoesStyle === 'boots' && (
            <>
              <rect x="63"  y="218" width="28" height="26" rx="8" fill={blend(shoeMain, '#000000', 0.08)} />
              <rect x="109" y="218" width="28" height="26" rx="8" fill={blend(shoeMain, '#000000', 0.08)} />
            </>
          )}
          {/* sole shadow */}
          <ellipse cx="80"  cy="252" rx="22" ry="8" fill={shoeDark} />
          <ellipse cx="120" cy="252" rx="22" ry="8" fill={shoeDark} />
          {/* shoe top */}
          <ellipse cx="80"  cy="246" rx="21" ry="12" fill="url(#av-shoe)" />
          <ellipse cx="120" cy="246" rx="21" ry="12" fill="url(#av-shoe)" />
          {shoesStyle === 'sandals' && (
            <>
              <path d="M 61 243 Q 80 237 99 243"  stroke="#C07A00" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 101 243 Q 120 237 139 243" stroke="#C07A00" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          )}
          {shoesStyle === 'sneakers' && (
            <>
              <path d="M 63 244 Q 80 239 97 244"  stroke="white" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.7" />
              <path d="M 103 244 Q 120 239 137 244" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
            </>
          )}
        </>
      )}

      {/* ── LEGS ── */}
      {showDress ? (
        <>
          <rect x="72"  y="224" width="22" height="27" rx="10" fill={skinHex} />
          <rect x="106" y="224" width="22" height="27" rx="10" fill={skinHex} />
        </>
      ) : (
        <>
          <rect x="70"  y="210" width="26" height="40" rx="12" fill="url(#av-pants)" />
          <rect x="104" y="210" width="26" height="40" rx="12" fill="url(#av-pants)" />
        </>
      )}

      {/* ── BODY / OUTFIT ── */}
      {showDress ? (
        <path d="M 62 150 L 138 150 L 155 234 L 45 234 Z" fill="url(#av-outfit)" />
      ) : (
        <rect x="58" y="148" width="84" height="68" rx="16" fill="url(#av-outfit)" />
      )}
      {outfitStyle === 'formal' && (
        <>
          <line x1="100" y1="154" x2="100" y2="214" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <circle cx="100" cy="163" r="2.5" fill="white" opacity="0.62" />
          <circle cx="100" cy="176" r="2.5" fill="white" opacity="0.62" />
          <circle cx="100" cy="189" r="2.5" fill="white" opacity="0.62" />
        </>
      )}
      {outfitStyle === 'pajama' && (
        <path d="M 72 167 Q 86 177 100 167 Q 114 177 128 167" stroke="white" strokeWidth="2.5" fill="none" opacity="0.42" strokeLinecap="round" />
      )}
      {showDress && (
        <path d="M 78 183 Q 100 192 122 183" stroke="white" strokeWidth="2" fill="none" opacity="0.28" strokeLinecap="round" />
      )}
      {showDress && isGirl && (
        <circle cx="100" cy="158" r="7" fill={blend(outfitHex, '#ffffff', 0.52)} opacity="0.6" />
      )}

      {/* ── ARMS ── */}
      <rect x="-10" y="0" width="20" height="58" rx="10" fill={outfitHex} transform="translate(62,153) rotate(18)" />
      <rect x="-10" y="0" width="20" height="58" rx="10" fill={outfitHex} transform="translate(138,153) rotate(-18)" />

      {/* ── HANDS ── */}
      <circle cx="44"  cy="208" r="12" fill={skinHex} />
      <circle cx="156" cy="208" r="12" fill={skinHex} />
      <path d="M 38 202 Q 44 197 50 202" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M 150 202 Q 156 197 162 202" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* ── NECK ── */}
      <rect x="88" y="132" width="24" height="24" rx="9" fill={skinHex} />

      {/* ── EARS ── */}
      <ellipse cx="49"  cy="90" rx="13" ry="15" fill={skinHex} />
      <ellipse cx="151" cy="90" rx="13" ry="15" fill={skinHex} />
      <ellipse cx="49"  cy="90" rx="8"  ry="10" fill={skinShadow} />
      <ellipse cx="151" cy="90" rx="8"  ry="10" fill={skinShadow} />

      {/* ── HAIR back layer ── */}
      {hairStyle === 'open' && (
        <>
          <ellipse cx="100" cy="72" rx="56" ry="57" fill="url(#av-hair)" />
          <rect x="42"  y="74" width="17" height="70" rx="8" fill="url(#av-hair)" />
          <rect x="141" y="74" width="17" height="70" rx="8" fill="url(#av-hair)" />
        </>
      )}
      {hairStyle === 'short' && (
        <ellipse cx="100" cy="68" rx="55" ry="46" fill="url(#av-hair)" />
      )}
      {hairStyle === 'pigtails' && (
        <>
          <ellipse cx="100" cy="70" rx="52" ry="48" fill="url(#av-hair)" />
          {/* Puff balls */}
          <circle cx="50"  cy="66" r="17" fill="url(#av-hair)" />
          <circle cx="150" cy="66" r="17" fill="url(#av-hair)" />
          {/* Hanging tails */}
          <rect x="42"  y="80" width="14" height="52" rx="7" fill="url(#av-hair)" />
          <rect x="144" y="80" width="14" height="52" rx="7" fill="url(#av-hair)" />
        </>
      )}
      {hairStyle === 'bun' && (
        <ellipse cx="100" cy="72" rx="54" ry="52" fill="url(#av-hair)" />
      )}
      {hairStyle === 'braids' && (
        <ellipse cx="100" cy="70" rx="54" ry="50" fill="url(#av-hair)" />
      )}
      {hairStyle === 'curly' && (
        <>
          <ellipse cx="100" cy="72" rx="56" ry="53" fill="url(#av-hair)" />
          <circle cx="66"  cy="46" r="20" fill="url(#av-hair)" />
          <circle cx="100" cy="33" r="20" fill="url(#av-hair)" />
          <circle cx="134" cy="46" r="20" fill="url(#av-hair)" />
          <circle cx="53"  cy="68" r="17" fill="url(#av-hair)" />
          <circle cx="147" cy="68" r="17" fill="url(#av-hair)" />
          <circle cx="50"  cy="92" r="16" fill="url(#av-hair)" />
          <circle cx="150" cy="92" r="16" fill="url(#av-hair)" />
        </>
      )}

      {/* ── HEAD ── */}
      <ellipse cx="100" cy="86" rx="52" ry="56" fill="url(#av-skin)" />

      {/* ── HAIR front / fringe ── */}
      {hairStyle === 'open' && (
        <path d="M 48 84 C 54 42 146 42 152 84 C 140 56 100 50 60 56 Z" fill="url(#av-hair)" />
      )}
      {hairStyle === 'short' && (
        <path d="M 50 80 C 56 54 144 54 150 80 C 138 64 100 60 62 64 Z" fill="url(#av-hair)" />
      )}
      {hairStyle === 'pigtails' && (
        <>
          <path d="M 52 80 C 58 54 142 54 148 80 C 138 64 100 60 62 64 Z" fill="url(#av-hair)" />
          {/* Rubber bands */}
          <ellipse cx="49"  cy="82" rx="9" ry="5" fill="#FF8FAB" />
          <ellipse cx="151" cy="82" rx="9" ry="5" fill="#FF8FAB" />
          <ellipse cx="49"  cy="82" rx="5" ry="3" fill="#FF5C8A" />
          <ellipse cx="151" cy="82" rx="5" ry="3" fill="#FF5C8A" />
        </>
      )}
      {hairStyle === 'bun' && (
        <>
          {/* Pulled-back hairline */}
          <path d="M 56 80 C 62 62 138 62 144 80 C 136 72 100 70 64 72 Z" fill="url(#av-hair)" />
          {/* Bun */}
          <circle cx="100" cy="38" r="22" fill="url(#av-hair)" />
          <circle cx="100" cy="38" r="14" fill={blend(hairHex, '#ffffff', 0.22)} />
          <circle cx="100" cy="38" r="7"  fill="url(#av-hair)" />
          {/* Bun shine */}
          <circle cx="94"  cy="32" r="5"  fill="white" opacity="0.18" />
        </>
      )}
      {hairStyle === 'braids' && (
        <>
          <path d="M 52 80 C 58 54 142 54 148 80 C 136 64 100 60 64 64 Z" fill="url(#av-hair)" />
          {/* Left braid beside face */}
          <path d="M 56 108 L 46 120 L 56 132 L 46 144 L 56 156 L 46 166 L 56 174"
            stroke={hairHex} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* Right braid beside face */}
          <path d="M 144 108 L 154 120 L 144 132 L 154 144 L 144 156 L 154 166 L 144 174"
            stroke={hairHex} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {/* Braid cross-hatch highlight */}
          <path d="M 50 119 L 56 125 M 50 131 L 56 137 M 50 143 L 56 149 M 50 155 L 56 161 M 50 165 L 56 170"
            stroke={blend(hairHex, '#ffffff', 0.35)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 150 119 L 144 125 M 150 131 L 144 137 M 150 143 L 144 149 M 150 155 L 144 161 M 150 165 L 144 170"
            stroke={blend(hairHex, '#ffffff', 0.35)} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* End ties */}
          <ellipse cx="51"  cy="176" rx="8" ry="5" fill="#FF8FAB" />
          <ellipse cx="149" cy="176" rx="8" ry="5" fill="#FF8FAB" />
        </>
      )}
      {hairStyle === 'curly' && (
        <>
          <circle cx="72"  cy="50" r="18" fill="url(#av-hair)" />
          <circle cx="100" cy="38" r="18" fill="url(#av-hair)" />
          <circle cx="128" cy="50" r="18" fill="url(#av-hair)" />
        </>
      )}

      {/* ── EYEBROWS ── */}
      <path d="M 74 68 Q 82 62 90 66"  stroke={browColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M 110 66 Q 118 62 126 68" stroke={browColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* ── EYES ── */}
      {eyeShape === 'round' && (
        <>
          <circle cx="82"  cy="85" r="11"  fill="white" />
          <circle cx="118" cy="85" r="11"  fill="white" />
          <circle cx="82"  cy="85" r="7.5" fill="url(#av-iris)" />
          <circle cx="118" cy="85" r="7.5" fill="url(#av-iris)" />
          <circle cx="82"  cy="85" r="4"   fill="#1a1a1a" />
          <circle cx="118" cy="85" r="4"   fill="#1a1a1a" />
          <circle cx="85.5"  cy="81.5" r="2.2" fill="white" />
          <circle cx="121.5" cy="81.5" r="2.2" fill="white" />
          <circle cx="79"  cy="88" r="1.2" fill="white" opacity="0.55" />
          <circle cx="115" cy="88" r="1.2" fill="white" opacity="0.55" />
          <path d="M 71 80 Q 82 73 93 80"  stroke="rgba(0,0,0,0.09)" strokeWidth="2.5" fill="none" />
          <path d="M 107 80 Q 118 73 129 80" stroke="rgba(0,0,0,0.09)" strokeWidth="2.5" fill="none" />
        </>
      )}
      {eyeShape === 'almond' && (
        <>
          <ellipse cx="82"  cy="85" rx="12" ry="8.5" fill="white" />
          <ellipse cx="118" cy="85" rx="12" ry="8.5" fill="white" />
          <ellipse cx="82"  cy="85" rx="8"  ry="5.5" fill="url(#av-iris)" />
          <ellipse cx="118" cy="85" rx="8"  ry="5.5" fill="url(#av-iris)" />
          <ellipse cx="82"  cy="85" rx="4.5" ry="3.5" fill="#1a1a1a" />
          <ellipse cx="118" cy="85" rx="4.5" ry="3.5" fill="#1a1a1a" />
          <circle cx="85.5"  cy="82" r="2"   fill="white" />
          <circle cx="121.5" cy="82" r="2"   fill="white" />
          <path d="M 70 80 Q 82 72 94 80"   stroke="rgba(51,51,51,0.22)" strokeWidth="2"   fill="none" strokeLinecap="round" />
          <path d="M 106 80 Q 118 72 130 80" stroke="rgba(51,51,51,0.22)" strokeWidth="2"   fill="none" strokeLinecap="round" />
          <path d="M 70 86 Q 82 94 94 86"   stroke="rgba(51,51,51,0.10)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 106 86 Q 118 94 130 86" stroke="rgba(51,51,51,0.10)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {eyeShape === 'wide' && (
        <>
          <circle cx="82"  cy="85" r="13" fill="white" />
          <circle cx="118" cy="85" r="13" fill="white" />
          <circle cx="82"  cy="85" r="9"  fill="url(#av-iris)" />
          <circle cx="118" cy="85" r="9"  fill="url(#av-iris)" />
          <circle cx="82"  cy="85" r="5"  fill="#1a1a1a" />
          <circle cx="118" cy="85" r="5"  fill="#1a1a1a" />
          <circle cx="86"  cy="81" r="2.8" fill="white" />
          <circle cx="122" cy="81" r="2.8" fill="white" />
          <circle cx="78"  cy="89" r="1.4" fill="white" opacity="0.55" />
          <circle cx="114" cy="89" r="1.4" fill="white" opacity="0.55" />
          <path d="M 69 79 Q 82 71 95 79"   stroke="rgba(0,0,0,0.08)" strokeWidth="2.5" fill="none" />
          <path d="M 105 79 Q 118 71 131 79" stroke="rgba(0,0,0,0.08)" strokeWidth="2.5" fill="none" />
        </>
      )}
      {/* girl eyelashes */}
      {isGirl && eyeShape === 'round' && (
        <>
          <path d="M 70 79 Q 82 71 94 79"   stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 106 79 Q 118 71 130 79" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {isGirl && eyeShape === 'wide' && (
        <>
          <path d="M 68 77 Q 82 68 96 77"   stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 104 77 Q 118 68 132 77" stroke={browColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── NOSE ── */}
      {noseStyle === 'button' && (
        <ellipse cx="100" cy="104" rx="6" ry="4" fill={skinShadow} />
      )}
      {noseStyle === 'small' && (
        <>
          <circle cx="95"  cy="104" r="3.5" fill={skinShadow} />
          <circle cx="105" cy="104" r="3.5" fill={skinShadow} />
          <path d="M 95 101 Q 100 98 105 101" stroke={skinShadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {noseStyle === 'wide' && (
        <>
          <ellipse cx="93"  cy="104" rx="5" ry="4" fill={skinShadow} />
          <ellipse cx="107" cy="104" rx="5" ry="4" fill={skinShadow} />
          <path d="M 88 100 Q 100 95 112 100" stroke={skinShadow} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── MOUTH ── */}
      {lipStyle === 'thin' && (
        <>
          <path d="M 88 117 Q 100 125 112 117" stroke="#C97070" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 88 117 Q 100 113 112 117" stroke="rgba(201,112,112,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {(lipStyle === 'medium' || !lipStyle) && (
        <>
          <path d="M 86 117 Q 100 129 114 117" stroke="#C97070" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 88 117 Q 100 123 112 117" fill="rgba(232,160,160,0.38)" stroke="none" />
          <path d="M 86 117 Q 100 113 114 117" stroke="rgba(201,112,112,0.42)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {lipStyle === 'full' && (
        <>
          <path d="M 84 117 Q 92 112 100 114 Q 108 112 116 117 Q 108 115 100 116 Q 92 115 84 117 Z" fill="#D47A7A" />
          <path d="M 84 117 Q 100 132 116 117 Q 110 126 100 127 Q 90 126 84 117 Z" fill="#E89090" />
          <path d="M 84 117 Q 92 112 100 114 Q 108 112 116 117" stroke="#C06060" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 93 123 Q 100 127 107 123" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.38" />
        </>
      )}

      {/* ── CHEEKS ── */}
      <ellipse cx="68"  cy="106" rx="15" ry="10" fill="url(#av-blush)" />
      <ellipse cx="132" cy="106" rx="15" ry="10" fill="url(#av-blush)" />

      {/* ── GIRL ACCESSORY ── */}
      {isGirl && (
        <>
          <circle cx="60" cy="52" r="11" fill="#FF8FAB" />
          <circle cx="60" cy="52" r="7"  fill="#FFB3C6" />
          <circle cx="60" cy="52" r="3.5" fill="#FF8FAB" />
          <circle cx="57" cy="49" r="2.2" fill="white" opacity="0.42" />
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
