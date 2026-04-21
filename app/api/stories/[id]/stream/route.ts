import { getServerSession } from 'next-auth'
import Anthropic from '@anthropic-ai/sdk'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildStoryPrompt } from '@/lib/prompt'
import { buildAvatarDescription } from '@/lib/avatar'
import { generateStoryIllustrations } from '@/lib/illustrations'

type Params = Promise<{ id: string }>

function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  return new Anthropic()
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const story = await prisma.story.findFirst({
    where: { id, profile: { userId: session.user.id } },
    include: {
      profile: true,
    },
  })
  if (!story) {
    return Response.json({ data: null, error: 'Story not found' }, { status: 404 })
  }

  // Fetch any co-profiles so all children appear in the prompt
  const coProfileIds = story.coProfileIds as string[]
  const coProfiles =
    coProfileIds.length > 0
      ? await prisma.profile.findMany({ where: { id: { in: coProfileIds } } })
      : []

  const allProfiles = [story.profile, ...coProfiles]

  const prompt = buildStoryPrompt({
    children: allProfiles.map(p => ({ name: p.name, ageRange: p.ageRange })),
    keywords: story.keywords as string[],
    lesson: story.lesson,
    scenario: story.scenario ?? undefined,
    relationship: story.relationship ?? undefined,
  })

  let anthropic: Anthropic
  try {
    anthropic = getAnthropicClient()
  } catch {
    return Response.json(
      { data: null, error: 'Story generation is not configured.' },
      { status: 503 },
    )
  }

  try {
    const claudeStream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const avatarDescription = buildAvatarDescription(story.profile.avatar)

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullText = ''

        try {
          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullText += chunk.delta.text
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
          return
        }

        // Save body and generate illustrations non-blocking
        saveAndIllustrate(story.id, fullText, avatarDescription).catch((err: unknown) => {
          console.error('Post-stream save/illustrate failed:', err)
        })
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('Claude API error:', err)
    return Response.json(
      { data: null, error: 'Story generation failed. Please try again.' },
      { status: 500 },
    )
  }
}

async function saveAndIllustrate(
  storyId: string,
  fullText: string,
  avatarDescription: string,
): Promise<void> {
  await prisma.story.update({
    where: { id: storyId },
    data: { body: fullText },
  })
  await generateStoryIllustrations(storyId, fullText, avatarDescription)
}
