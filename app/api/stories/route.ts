import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveStorySchema } from '@/lib/schemas'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await request.json()
    const parsed = saveStorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const profile = await prisma.profile.findFirst({
      where: { id: parsed.data.profileId, userId: session.user.id },
    })
    if (!profile) {
      return NextResponse.json({ data: null, error: 'Profile not found' }, { status: 401 })
    }

    const story = await prisma.story.create({
      data: {
        keywords: parsed.data.keywords,
        lesson: parsed.data.lesson,
        body: parsed.data.body,
        profileId: parsed.data.profileId,
      },
    })

    return NextResponse.json({ data: story, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}
