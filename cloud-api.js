export const MODELS = [
  { id: 'gemini:gemini-3.8-flash', provider: 'gemini', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { id: 'gemini:gemini-3.5-flash', provider: 'gemini', model: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'groq:openai/gpt-oss-120b', provider: 'groq', model: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B (Groq)' },
  { id: 'groq:openai/gpt-oss-20b', provider: 'groq', model: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B (Groq)' },
  { id: 'groq:qwen/qwen3.8-27b', provider: 'groq', model: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Groq)' },
]

const MAX_ATTEMPTS = 3
const REQUEST_TIMEOUT_MS = 60000

export function hasCloudKey(settings) {
  return Boolean(settings.geminiKey || settings.groqKey)
}

function candidateModels(settings) {
  const selected = MODELS.find((m) => m.id === settings.model) ?? MODELS[0]
  return [selected, ...MODELS]
    .filter((m, index, all) => all.findIndex((x) => x.id === m.id) === index)
    .filter((m) => settings[`${m.provider}Key`])
    .slice(0, MAX_ATTEMPTS)
}

async function callGemini(apiKey, model, messages) {
  const system = messages.find((m) => m.role === 'system')?.content ?? ''
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  )
  if (!response.ok) throw new Error(`Gemini responded with status ${response.status}`)

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts
    ?.filter((part) => part.text && !part.thought)
    .map((part) => part.text)
    .join('')
  if (!text) throw new Error('Gemini returned an empty answer')
  return text
}

async function callGroq(apiKey, model, messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Groq responded with status ${response.status}`)

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq returned an empty answer')
  return text
}

export async function askCloud(messages, settings) {
  const candidates = candidateModels(settings)
  if (candidates.length === 0) throw new Error('No API key configured')

  let lastError = null
  for (const candidate of candidates) {
    const apiKey = settings[`${candidate.provider}Key`]
    try {
      const text = candidate.provider === 'gemini'
        ? await callGemini(apiKey, candidate.model, messages)
        : await callGroq(apiKey, candidate.model, messages)
      return { text, label: candidate.label }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}
