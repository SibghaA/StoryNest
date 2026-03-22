import { z } from 'zod'

export const generateStorySchema = z.object({
  profileId: z.string().min(1),
  keywords: z
    .array(z.string().min(1).max(50))
    .length(3, { message: 'Exactly 3 keywords are required' }),
  lesson: z.string().min(1).max(120),
})

export type GenerateStoryInput = z.infer<typeof generateStorySchema>
