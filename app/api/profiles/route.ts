import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProfileSchema } from '@/lib/schemas'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: profiles, error: null })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: unknown = await request.json()
    const parsed = createProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const count = await prisma.profile.count({ where: { userId: session.user.id } })
    if (count >= 5) {
      return NextResponse.json(
        { data: null, error: 'Profile limit reached (5 max)' },
        { status: 400 },
      )
    }

    const profile = await prisma.profile.create({
      data: {
        name: parsed.data.name,
        ageRange: parsed.data.ageRange,
        avatar: parsed.data.avatar ?? {},
        userId: session.user.id,
      },
    })

    return NextResponse.json({ data: profile, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Unexpected error' }, { status: 500 })
  }
}
