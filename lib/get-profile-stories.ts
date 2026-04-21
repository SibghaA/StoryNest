import { prisma } from '@/lib/prisma'
import type { Story } from '@prisma/client'

export async function getProfileStories(profileId: string): Promise<Story[]> {
  // Primary stories: this profile is the author
  const primary = await prisma.story.findMany({
    where: { profileId, saved: true },
    orderBy: { createdAt: 'desc' },
  })

  // Co-profile stories: this profile appears inside the coProfileIds JSON array.
  // Prisma cannot filter SQLite JSON arrays natively, so we use raw SQL.
  const co = await prisma.$queryRaw<Story[]>`
    SELECT s.*
    FROM Story s, json_each(s.coProfileIds) AS j
    WHERE s.saved = 1
      AND j.value = ${profileId}
      AND s.profileId != ${profileId}
  `

  // Merge and sort newest first
  return [...primary, ...co].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}
