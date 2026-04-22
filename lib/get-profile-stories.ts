import { prisma } from '@/lib/prisma'
import type { Story } from '@prisma/client'

export async function getProfileStories(profileId: string): Promise<Story[]> {
  // Primary stories: this profile is the author
  const primary = await prisma.story.findMany({
    where: { profileId, saved: true },
    orderBy: { createdAt: 'desc' },
  })

  // Co-profile stories: this profile appears inside the coProfileIds JSON array.
  // We fetch all other saved stories from the same user and filter in-memory so
  // the query works on both SQLite (dev) and PostgreSQL (prod) — json_each is
  // SQLite-only and would throw on PostgreSQL.
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { userId: true },
  })

  if (!profile) return primary

  const candidates = await prisma.story.findMany({
    where: {
      saved: true,
      NOT: { profileId },
      profile: { userId: profile.userId },
    },
    orderBy: { createdAt: 'desc' },
  })

  const co = candidates.filter(story => {
    const ids = story.coProfileIds as unknown
    return Array.isArray(ids) && (ids as string[]).includes(profileId)
  })

  // Merge and sort newest first
  return [...primary, ...co].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
