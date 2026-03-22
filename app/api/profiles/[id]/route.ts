import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/schemas'

type Params = Promise<{ id: string }>

async function verifyOwnership(profileId: string, userId: string) {
  return prisma.profile.findFirst({
    where: { id: profileId, userId },
  })
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body: unknown = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const owned = await verifyOwnership(id, session.user.id)
    if (!owned) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ data: profile, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const owned = await verifyOwnership(id, session.user.id)
    if (!owned) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.profile.delete({ where: { id } })

    return NextResponse.json({ data: { id }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}
