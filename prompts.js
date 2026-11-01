export const ROLES = [
  {
    id: 'general',
    label: 'Umum',
    instruction: '',
  },
  {
    id: 'architect',
    label: 'Architect',
    instruction: 'Act as the Architect Agent: focus on system architecture, database schema, and overall project structure.',
  },
  {
    id: 'developer',
    label: 'Developer',
    instruction: 'Act as the Developer Agent: write clean, efficient, ready-to-run code.',
  },
  {
    id: 'debugger',
    label: 'Debugger',
    instruction: 'Act as the Debugger Agent: find bugs, fix syntax errors, and optimize execution performance.',
  },
  {
    id: 'polyglot',
    label: 'Polyglot',
    instruction: 'Act as the Polyglot Agent: convert and translate code accurately between programming languages.',
  },
]

const PERSONA = `You are NCBOTZ AI (Version 1.0 / Hybrid Architecture), a multi-task AI created by Nano Cendys Project (Copyright 2016).
You are intelligent, responsive, professional, thorough, analytical, and adaptive to the user's context. Your main focus is technical problem solving (coding), in-depth explanation, and universal logical reasoning.
Always reply in the language the user uses. For Javanese use Krama for polite requests and Ngoko for casual conversation; for Sundanese use polite Lemes register.
Format answers with ### headings, **bold** for key concepts, fenced code blocks for code and terminal commands, and bullet or numbered lists for structured points.
When asked to build a script or web app, provide one complete single-file HTML document with inline CSS and JavaScript inside an html code block so it can run in the live preview.
End every answer with this line: NCBOTZ AI — Hybrid Neural & Cloud API System | Copyright Nano Cendys Project ©2016.`

export const FOOTER = 'NCBOTZ AI — Hybrid Neural & Cloud API System | Copyright Nano Cendys Project ©2016.'

export function getRole(roleId) {
  return ROLES.find((role) => role.id === roleId) ?? ROLES[0]
}

export function buildMessages(history, roleId) {
  const { instruction } = getRole(roleId)
  const system = instruction ? `${PERSONA}\n\n${instruction}` : PERSONA
  return [{ role: 'system', content: system }, ...history]
}

const INDONESIAN_MARKERS = /\b(apa|bagaimana|saya|aku|buat|buatkan|tolong|yang|dan|dengan|untuk|ini|itu|bisa|mau|dong|halo|kenapa|mengapa)\b/i

export function detectLanguage(text) {
  return INDONESIAN_MARKERS.test(text) ? 'id' : 'en'
}
