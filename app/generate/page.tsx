import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StoryGenerator } from '@/components/story-generator'

export default async function GeneratePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  if (profiles.length === 0) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-amber-800">Generate a story</h1>
        <div className="rounded-xl bg-amber-50 p-8 text-center">
          <p className="mb-4 text-gray-600">
            You need a child profile before generating a story.
          </p>
          <Link
            href="/profiles/new"
            className="inline-block rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Create a profile
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-800">Generate a story</h1>
        <Link href="/profiles" className="text-sm text-gray-500 hover:text-amber-700">
          ← Profiles
        </Link>
      </div>
      <StoryGenerator profiles={profiles} />
    </main>
  )
}
