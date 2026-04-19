import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StoryList } from '@/components/story-list'

type Params = Promise<{ id: string }>

export default async function ProfileStoriesPage({ params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const { id } = await params

  const profile = await prisma.profile.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!profile) notFound()

  const stories = await prisma.story.findMany({
    where: { profileId: id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profiles" className="text-gray-400 hover:text-gray-600">
            ← Profiles
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{profile.name}&apos;s Stories</h1>
        </div>
        <Link
          href="/generate"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          ✨ New story
        </Link>
      </div>

      <StoryList stories={stories} profileId={id} />
    </main>
  )
}
