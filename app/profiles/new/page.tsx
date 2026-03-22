import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/profile-form'

export default async function NewProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const count = await prisma.profile.count({ where: { userId: session.user.id } })
  if (count >= 5) redirect('/profiles')

  return (
    <main className="mx-auto max-w-lg p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profiles" className="text-gray-400 hover:text-gray-600">
          &larr; Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New profile</h1>
      </div>
      <ProfileForm />
    </main>
  )
}
