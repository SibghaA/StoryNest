import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import Anthropic from '@anthropic-ai/sdk'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateStorySchema } from '@/lib/schemas'
import { buildStoryPrompt } from '@/lib/prompt'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse + validate input
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ data: null, error: 'Invalid request body' }, { status: 400 })
  }

  const result = generateStorySchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { data: null, error: result.error.flatten() },
      { status: 400 },
    )
  }

  const { profileId, keywords, lesson } = result.data

  // 3. Verify profileId belongs to the authenticated user
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
  })
  if (!profile) {
    return Response.json({ data: null, error: 'Profile not found' }, { status: 401 })
  }

  // 4. Build prompt (sanitization happens inside buildStoryPrompt)
  const prompt = buildStoryPrompt({
    childName: profile.name,
    ageRange: profile.ageRange,
    keywords,
    lesson,
  })

  // 5. Stream from Claude API
  try {
    const claudeStream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let fullText = ''

        try {
          for await (const chunk of claudeStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              fullText += chunk.delta.text
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
          return
        }

        // 6. Non-blocking: stub illustration generation after stream closes
        triggerIllustrations(profileId, fullText, keywords).catch((err) => {
          console.error('Illustration generation failed (stub):', err)
        })
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
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

// Stub: replace with real Nano Banana calls + Vercel Blob upload when ready
async function triggerIllustrations(
  profileId: string,
  _storyText: string,
  _keywords: string[],
): Promise<void> {
  // TODO:
  // 1. Extract up to 3 scene descriptions from _storyText
  // 2. Call Nano Banana API for each scene (using avatar data from profile)
  // 3. Upload each image to Vercel Blob
  // 4. Save the URLs to the Story record in the DB
  console.log('[illustrations] stub called for profileId:', profileId)
}
