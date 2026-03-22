import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/profile-form'

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const { id } = await params
  const profile = await prisma.profile.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!profile) notFound()

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profiles" className="text-gray-400 hover:text-gray-600">
          &larr; Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit profile</h1>
      </div>
      <ProfileForm
        defaultValues={{
          id: profile.id,
          name: profile.name,
          ageRange: profile.ageRange,
          avatar: (profile.avatar as Record<string, string>) ?? {},
        }}
      />
    </main>
  )
}
