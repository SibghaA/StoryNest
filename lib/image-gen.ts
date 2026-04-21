import { fal } from '@fal-ai/client'

interface FalResult {
  images: Array<{ url: string }>
}

export async function generateImage(prompt: string): Promise<string> {
  const key = process.env.FAL_AI_KEY
  if (!key) throw new Error('FAL_AI_KEY is not set')

  fal.config({ credentials: key })

  const result = (await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt,
      image_size: 'square_hd',
      num_inference_steps: 4,
      num_images: 1,
    },
  })) as { data: FalResult }

  const url = result.data?.images?.[0]?.url
  if (!url) throw new Error('No image returned from fal.ai')

  return url
}
