export type IllustrationSlot =
  | { type: 'loaded'; url: string }
  | { type: 'placeholder'; url: '' }

/**
 * Maps up to 3 image URLs into exactly 3 display slots.
 * Empty strings and missing entries become placeholder slots.
 */
export function illustrationSlots(imageUrls: string[]): IllustrationSlot[] {
  return Array.from({ length: 3 }, (_, i): IllustrationSlot => {
    const url = imageUrls[i] ?? ''
    return url ? { type: 'loaded', url } : { type: 'placeholder', url: '' }
  })
}

interface StoryIllustrationsProps {
  imageUrls: string[]
}

export function StoryIllustrations({ imageUrls }: StoryIllustrationsProps) {
  const slots = illustrationSlots(imageUrls)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {slots.map((slot, i) =>
        slot.type === 'loaded' ? (
          <img
            key={i}
            src={slot.url}
            alt={`Story illustration ${i + 1}`}
            className="w-full rounded-xl object-cover shadow-sm"
          />
        ) : (
          <div
            key={i}
            aria-label={`Illustration ${i + 1} loading`}
            className="flex aspect-square w-full animate-pulse items-center justify-center rounded-xl bg-amber-100"
          >
            <span className="text-3xl opacity-40">🎨</span>
          </div>
        ),
      )}
    </div>
  )
}
