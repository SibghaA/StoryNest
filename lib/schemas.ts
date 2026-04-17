import { z } from 'zod'

export const generateStorySchema = z.object({
  profileId: z.string().min(1),
  keywords: z
    .array(z.string().min(1).max(50))
    .length(3, { message: 'Exactly 3 keywords are required' }),
  lesson: z.string().min(1).max(120),
})

export type GenerateStoryInput = z.infer<typeof generateStorySchema>

export const avatarSchema = z.object({
  skinTone: z.enum(['tone-1', 'tone-2', 'tone-3', 'tone-4']),
  hairColor: z.enum(['black', 'brown', 'blonde', 'red']),
  hairStyle: z.enum(['straight', 'curly', 'wavy']),
  gender: z.enum(['boy', 'girl']).optional(),
  eyeColor: z.enum(['brown', 'blue', 'green', 'hazel']).optional(),
  eyeShape: z.enum(['round', 'almond', 'wide']).optional(),
  noseStyle: z.enum(['button', 'small', 'wide']).optional(),
  lipStyle: z.enum(['thin', 'medium', 'full']).optional(),
  outfitStyle: z.enum(['casual', 'formal', 'pajama', 'dress']).optional(),
  outfitColor: z.enum(['blue', 'pink', 'green', 'yellow', 'red', 'purple']).optional(),
  shoesStyle: z.enum(['sneakers', 'boots', 'sandals', 'barefoot']).optional(),
})

export const createProfileSchema = z.object({
  name: z.string().min(1).max(50),
  ageRange: z.enum(['0-12m', '1-2y', '2-3y']),
  avatar: avatarSchema.optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  ageRange: z.enum(['0-12m', '1-2y', '2-3y']).optional(),
  avatar: avatarSchema.optional(),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const shareStorySchema = z.object({
  recipientEmail: z.string().email(),
})

export type AvatarData = z.infer<typeof avatarSchema>
export type CreateProfileInput = z.infer<typeof createProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
