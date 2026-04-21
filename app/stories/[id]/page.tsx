import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DeleteStoryButton } from '@/components/delete-story-button'
import { SaveStoryButton } from '@/components/save-story-button'
import { StoryStreamViewer } from '@/components/story-stream-viewer'
import { StoryIllustrationsLoader } from '@/components/story-illustrations-loader'
import { extractScenes } from '@/lib/illustrations'

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
  const coProfileIds = story.coProfileIds as string[]
  const date = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(story.createdAt)

  // Resolve names for all children in the story
  const coProfiles = coProfileIds.length > 0
    ? await prisma.profile.findMany({
        where: { id: { in: coProfileIds } },
        select: { name: true },
      })
    : []
  const allChildNames = [story.profile.name, ...coProfiles.map(p => p.name)].join(' & ')

  const isGenerating = story.body === ''

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
          <span><span className="font-medium text-gray-800">For</span> {allChildNames}</span>
          <span><span className="font-medium text-gray-800">Lesson</span> {story.lesson}</span>
          {!isGenerating && <span><span className="font-medium text-gray-800">Saved</span> {date}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {keywords.map(kw => (
            <span key={kw} className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {isGenerating ? (
        /* Story is being generated — stream it here */
        <StoryStreamViewer storyId={id} childNames={allChildNames} />
      ) : (
        <>
          {/* Story parts interleaved with illustrations — polls until all 3 images arrive */}
          <StoryIllustrationsLoader
            storyId={id}
            initialUrls={story.imageUrls as string[]}
            parts={extractScenes(story.body)}
          />

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3">
            <SaveStoryButton storyId={id} initialSaved={story.saved} />
            <DeleteStoryButton storyId={id} profileId={story.profile.id} />
          </div>
        </>
      )}
    </main>
  )
}
