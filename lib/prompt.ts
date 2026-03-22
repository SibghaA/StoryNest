const AGE_RANGE_LABELS: Record<string, string> = {
  '0-12m': 'under 1 year old',
  '1-2y': '1 to 2 years old',
  '2-3y': '2 to 3 years old',
}

function sanitize(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
}

export function buildStoryPrompt(params: {
  childName: string
  ageRange: string
  keywords: string[]
  lesson: string
}): string {
  const name = sanitize(params.childName)
  const ageLabel = AGE_RANGE_LABELS[params.ageRange] ?? sanitize(params.ageRange)
  const keywords = params.keywords.map(sanitize).join(', ')
  const lesson = sanitize(params.lesson)

  return `You are a warm, imaginative storyteller writing bedtime stories for babies and toddlers.

Write a bedtime story for a child named ${name}, who is ${ageLabel}.

Requirements:
- Length: exactly 200–250 words (count carefully)
- Tone: warm, gentle, and sensory — use simple words a toddler can understand
- Incorporate these three elements naturally into the story: ${keywords}
- Weave this life lesson into the story's action and events: "${lesson}"
  - The lesson must emerge through what the characters DO, not through a stated moral or closing summary
  - Do NOT end the story with a moral, a lesson statement, or any version of "And so ${name} learned..."
- Use ${name}'s name throughout the narrative
- The language and imagery should be age-appropriate for a child who is ${ageLabel}
- End on a sleepy, peaceful note

Write only the story text. No title, no headings, no commentary.`
}
