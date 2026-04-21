import { prisma } from '@/lib/prisma'
import { generateImage } from '@/lib/image-gen'

/**
 * Splits a story into exactly 3 scene excerpts for illustration prompts.
 * Tries paragraph breaks first; falls back to sentence-based thirds.
 */
export function extractScenes(storyText: string): string[] {
  const paragraphs = storyText
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  if (paragraphs.length >= 3) {
    const size = Math.ceil(paragraphs.length / 3)
    return [
      paragraphs.slice(0, size).join(' '),
      paragraphs.slice(size, size * 2).join(' '),
      paragraphs.slice(size * 2).join(' '),
    ].map(s => s.trim())
  }

  // Fall back: split by sentences into thirds
  const sentences = storyText.match(/[^.!?]+[.!?]+/g) ?? [storyText]
  const size = Math.ceil(sentences.length / 3)
  return [
    sentences.slice(0, size).join(' '),
    sentences.slice(size, size * 2).join(' '),
    sentences.slice(size * 2).join(' '),
  ].map(s => s.trim())
}

/**
 * Generates up to 3 illustrations for a saved story and writes the URLs
 * back to story.imageUrls. Failures on individual scenes are swallowed so
 * the story remains readable even if one image cannot be produced.
 */
export async function generateStoryIllustrations(
  storyId: string,
  storyText: string,
  avatarDescription: string,
): Promise<string[]> {
  const scenes = extractScenes(storyText)

  const urls = await Promise.all(
    scenes.map(async (scene, i) => {
      const prompt =
        `Children's book illustration, warm watercolour style. ` +
        `Scene: ${scene} ` +
        `Character: ${avatarDescription}. ` +
        `Soft colours, simple shapes, suitable for ages 0–3.`
      try {
        return await generateImage(prompt)
      } catch (err) {
        console.error(`Illustration ${i + 1} failed:`, err)
        return ''
      }
    }),
  )

  await prisma.story.update({
    where: { id: storyId },
    data: { imageUrls: urls },
  })

  return urls
}
