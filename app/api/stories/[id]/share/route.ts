import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { shareStorySchema } from '@/lib/schemas'

type Params = Promise<{ id: string }>

export async function POST(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body: unknown = await request.json()
    const parsed = shareStorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { recipientEmail } = parsed.data

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id },
      include: { profile: { select: { userId: true } } },
    })
    if (!story) {
      return NextResponse.json({ data: null, error: 'Story not found' }, { status: 404 })
    }

    // Verify the story belongs to the authenticated user
    if (story.profile.userId !== session.user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
    }

    // Look up recipient
    const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } })
    if (!recipient) {
      return NextResponse.json(
        { data: null, error: 'Recipient not found' },
        { status: 404 },
      )
    }

    // Prevent sharing with yourself
    if (recipient.id === session.user.id) {
      return NextResponse.json(
        { data: null, error: 'You cannot share a story with yourself' },
        { status: 400 },
      )
    }

    // Create the share record (unique constraint handles duplicates)
    try {
      const shared = await prisma.sharedStory.create({
        data: {
          storyId: id,
          senderId: session.user.id,
          recipientId: recipient.id,
        },
      })
      return NextResponse.json({ data: shared, error: null }, { status: 201 })
    } catch (err: unknown) {
      // Prisma unique constraint violation
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return NextResponse.json(
          { data: null, error: 'Story already shared with this recipient' },
          { status: 409 },
        )
      }
      throw err
    }
  } catch {
    return NextResponse.json({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}
