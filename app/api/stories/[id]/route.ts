import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = Promise<{ id: string }>

export async function GET(_req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const story = await prisma.story.findFirst({
    where: { id, profile: { userId: session.user.id } },
    include: { profile: { select: { id: true, name: true } } },
  })

  if (!story) {
    return NextResponse.json({ data: null, error: 'Story not found' }, { status: 404 })
  }

  return NextResponse.json({ data: story, error: null })
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { saved } = await req.json() as { saved: boolean }

  const story = await prisma.story.findFirst({
    where: { id, profile: { userId: session.user.id } },
  })
  if (!story) {
    return NextResponse.json({ data: null, error: 'Story not found' }, { status: 404 })
  }

  const updated = await prisma.story.update({ where: { id }, data: { saved } })
  return NextResponse.json({ data: { saved: updated.saved }, error: null })
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const story = await prisma.story.findFirst({
    where: { id, profile: { userId: session.user.id } },
  })

  if (!story) {
    return NextResponse.json({ data: null, error: 'Story not found' }, { status: 404 })
  }

  await prisma.story.delete({ where: { id } })

  return NextResponse.json({ data: { id }, error: null })
}
