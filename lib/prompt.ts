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
  children: Array<{ name: string; ageRange: string }>
  keywords: string[]
  lesson: string
  scenario?: string
  relationship?: string
}): string {
  const children = params.children.map(c => ({
    name: sanitize(c.name),
    ageLabel: AGE_RANGE_LABELS[c.ageRange] ?? sanitize(c.ageRange),
  }))

  const keywords = params.keywords.map(sanitize).join(', ')
  const lesson = sanitize(params.lesson)
  const scenario = params.scenario ? sanitize(params.scenario) : null
  const relationship =
    params.relationship && children.length > 1 ? sanitize(params.relationship) : null

  const settingLine = scenario
    ? `Setting: "${scenario}" — the entire story takes place in this world, centred around: ${keywords}.`
    : `Setting: the entire story takes place in a world centred around: ${keywords}.`

  const childrenLine =
    children.length === 1
      ? `Write a personalised story for a child named ${children[0].name}, who is ${children[0].ageLabel}.`
      : `Write a personalised story for ${children.map(c => `${c.name} (${c.ageLabel})`).join(' and ')}.`

  const togetherDesc = relationship
    ? `both children appear together as ${relationship}`
    : 'both children appear together'
  const namesLine =
    children.length === 1
      ? `- Use ${children[0].name}'s name throughout the story`
      : `- Use ${children.map(c => c.name).join(' and ')}'s names throughout the story — ${togetherDesc}`

  const firstChildName = children[0].name

  return `You are a warm, imaginative children's storyteller writing for babies and toddlers.

${childrenLine}

${settingLine}

Life lesson: "${lesson}"
— Weave this into what the characters do and feel. It must emerge naturally from the action.
— Never state it as a moral, a summary, or any version of "And so ${firstChildName} learned…"

Requirements:
- Length: exactly 200–250 words (count carefully)
- Language: simple, warm, and sensory — words a toddler can understand
${namesLine}
- Keep the story firmly within the setting from start to finish
- End on a joyful, happy note

Write only the story text. No title, no headings, no commentary.`
}
