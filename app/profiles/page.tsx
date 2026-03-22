import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileList } from '@/components/profile-list'
import { SignOutButton } from '@/components/sign-out-button'

export default async function ProfilesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-800">StoryNest</h1>
          <p className="text-sm text-gray-500">{session.user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {profiles.length < 5 && (
            <Link
              href="/profiles/new"
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              + Add child
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      <ProfileList profiles={profiles} />
    </main>
  )
}
