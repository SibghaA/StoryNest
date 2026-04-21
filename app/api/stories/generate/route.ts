import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateStorySchema } from '@/lib/schemas'

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
    return Response.json({ data: null, error: result.error.flatten() }, { status: 400 })
  }

  const { profileIds, keywords, lesson, scenario, relationship } = result.data
  const [primaryProfileId, ...coProfileIdList] = profileIds

  // 3. Verify every profileId belongs to the authenticated user
  const profiles = await prisma.profile.findMany({
    where: { id: { in: profileIds }, userId: session.user.id },
  })
  if (profiles.length !== profileIds.length) {
    return Response.json({ data: null, error: 'Profile not found' }, { status: 401 })
  }

  const primaryProfile = profiles.find(p => p.id === primaryProfileId)!

  // 4. Create the story record and return its ID — streaming happens via GET /api/stories/[id]/stream
  try {
    const story = await prisma.story.create({
      data: {
        keywords,
        lesson,
        scenario: scenario ?? null,
        relationship: relationship ?? null,
        body: '',
        imageUrls: [],
        coProfileIds: coProfileIdList,
        profileId: primaryProfile.id,
      },
    })

    return Response.json({ data: { storyId: story.id }, error: null }, { status: 201 })
  } catch (err) {
    console.error('Failed to create story record:', err)
    return Response.json(
      { data: null, error: 'Story generation failed. Please try again.' },
      { status: 500 },
    )
  }
}
