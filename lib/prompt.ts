const AGE_RANGE_LABELS: Record<string, string> = {
  '0-12m': 'under 1 year old',
  '1-2y':  '1 to 2 years old',
  '2-3y':  '2 to 3 years old',
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
  scenario?: string
}): string {
  const name     = sanitize(params.childName)
  const ageLabel = AGE_RANGE_LABELS[params.ageRange] ?? sanitize(params.ageRange)
  const keywords = params.keywords.map(sanitize).join(', ')
  const lesson   = sanitize(params.lesson)
  const scenario = params.scenario ? sanitize(params.scenario) : null

  const settingLine = scenario
    ? `Setting: "${scenario}" — the entire story takes place in this world, centred around: ${keywords}.`
    : `Setting: the entire story takes place in a world centred around: ${keywords}.`

  return `You are a warm, imaginative children's storyteller writing for babies and toddlers.

Write a personalised story for a child named ${name}, who is ${ageLabel}.

${settingLine}

Life lesson: "${lesson}"
— Weave this into what the characters do and feel. It must emerge naturally from the action.
— Never state it as a moral, a summary, or any version of "And so ${name} learned…"

Requirements:
- Length: exactly 200–250 words (count carefully)
- Language: simple, warm, and sensory — words a toddler can understand
- Use ${name}'s name throughout the story
- Keep the story firmly within the setting from start to finish
- End on a joyful, happy note

Write only the story text. No title, no headings, no commentary.`
}
