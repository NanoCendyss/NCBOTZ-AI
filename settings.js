import { MODELS } from './cloud-api.js'

const STORAGE_KEY = 'ncbotz-settings'

const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6JiQ9H3hVsgWJsgwk7e0KFykx_KslMfS54Qs0a71iKX4Q'
const DEFAULT_GROQ_KEY = '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'
const DEFAULT_MODEL = MODELS[0].id

export function loadSettings() {
  let stored = {}
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    stored = {}
  }
  const modelIsKnown = MODELS.some((m) => m.id === stored.model)
  return {
    geminiKey: stored.geminiKey || DEFAULT_GEMINI_KEY,
    groqKey: stored.groqKey || DEFAULT_GROQ_KEY,
    model: modelIsKnown ? stored.model : DEFAULT_MODEL,
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
