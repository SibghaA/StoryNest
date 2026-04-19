import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeleteStoryButton } from '@/components/delete-story-button'

type Params = Promise<{ id: string }>

export default async function StoryPage({ params }: { params: Params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/login')

  const { id } = await params

  const story = await prisma.story.findFirst({
    where: { id, profile: { userId: session.user.id } },
    include: { profile: { select: { id: true, name: true } } },
  })
  if (!story) notFound()

  const keywords = story.keywords as string[]
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(story.createdAt)

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/profiles/${story.profile.id}/stories`}
          className="text-gray-400 hover:text-gray-600"
        >
          ← {story.profile.name}&apos;s stories
        </Link>
      </div>

      {/* Metadata */}
      <div className="mb-6 rounded-xl bg-amber-50 p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          <span><span className="font-medium text-gray-800">For</span> {story.profile.name}</span>
          <span><span className="font-medium text-gray-800">Lesson</span> {story.lesson}</span>
          <span><span className="font-medium text-gray-800">Saved</span> {date}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {keywords.map(kw => (
            <span key={kw} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Story body */}
      <div className="rounded-xl border border-amber-100 bg-white p-6 shadow-sm">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
          {story.body}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <DeleteStoryButton storyId={id} profileId={story.profile.id} />
      </div>
    </main>
  )
}
