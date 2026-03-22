import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const shared = await prisma.sharedStory.findMany({
    where: { recipientId: session.user.id },
    orderBy: { sharedAt: 'desc' },
    include: {
      story: true,
      sender: { select: { id: true, email: true } },
    },
  })

  const data = shared.map(s => ({
    id: s.id,
    sharedAt: s.sharedAt,
    story: s.story,
    sender: s.sender,
  }))

  return NextResponse.json({ data, error: null })
}
