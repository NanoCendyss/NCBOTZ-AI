import './style.css'
import {
  addMessage,
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
} from './storage.js'
import { MODELS, askCloud, hasCloudKey } from './cloud-api.js'
import { loadSettings, saveSettings } from './settings.js'
import { buildMessages, ROLES } from './prompts.js'
import { respondOffline } from './offline-engine.js'
import { findHtmlBlock } from './markdown.js'
import { renderConversations, renderMessages, renderRoles } from './views.js'

const HISTORY_LIMIT = 20
const TOAST_MS = 4500
const TITLE_LENGTH = 48

const el = {
  menuButton: document.getElementById('menu-button'),
  sidebar: document.getElementById('sidebar'),
  scrim: document.getElementById('scrim'),
  newChat: document.getElementById('new-chat'),
  conversationList: document.getElementById('conversation-list'),
  roles: document.getElementById('roles'),
  messages: document.getElementById('messages'),
  toast: document.getElementById('toast'),
  composer: document.getElementById('composer'),
  input: document.getElementById('input'),
  sendButton: document.getElementById('send-button'),
  modeBadge: document.getElementById('mode-badge'),
  canvasToggle: document.getElementById('canvas-toggle'),
  canvas: document.getElementById('canvas'),
  canvasClose: document.getElementById('canvas-close'),
  canvasEmpty: document.getElementById('canvas-empty'),
  canvasFrame: document.getElementById('canvas-frame'),
  settingsButton: document.getElementById('settings-button'),
  settingsDialog: document.getElementById('settings-dialog'),
  settingsForm: document.getElementById('settings-form'),
  settingsCancel: document.getElementById('settings-cancel'),
  geminiKey: document.getElementById('gemini-key'),
  groqKey: document.getElementById('groq-key'),
  modelSelect: document.getElementById('model-select'),
}

const state = {
  conversations: [],
  activeId: null,
  messages: [],
  role: ROLES[0].id,
  busy: false,
  pendingDeleteId: null,
  settings: loadSettings(),
}

let toastTimer = null

function showToast(message) {
  el.toast.textContent = message
  el.toast.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    el.toast.hidden = true
  }, TOAST_MS)
}

function renderSidebar() {
  el.conversationList.innerHTML = renderConversations(state.conversations, state.activeId, state.pendingDeleteId)
}

function renderChat() {
  el.messages.innerHTML = renderMessages(state.messages, state.busy)
  el.messages.scrollTop = el.messages.scrollHeight
}

function renderRoleChips() {
  el.roles.innerHTML = renderRoles(state.role)
}

function renderModeBadge() {
  const online = hasCloudKey(state.settings) && navigator.onLine
  const modelLabel = MODELS.find((m) => m.id === state.settings.model)?.label ?? ''
  el.modeBadge.innerHTML = online
    ? `<span>Online</span><span class="mode-model"> · ${modelLabel}</span>`
    : '<span>Offline</span>'
  el.modeBadge.classList.toggle('online', online)
}

function renderAll() {
  renderSidebar()
  renderChat()
  renderRoleChips()
  renderModeBadge()
  el.sendButton.disabled = state.busy
}

function setSidebarOpen(open) {
  el.sidebar.classList.toggle('open', open)
  el.scrim.hidden = !open
}

function openCanvas(code) {
  el.canvasFrame.srcdoc = code
  el.canvasFrame.hidden = false
  el.canvasEmpty.hidden = true
  el.canvas.hidden = false
}

async function refreshConversations() {
  try {
    state.conversations = await listConversations()
  } catch {
    showToast('Riwayat belum dapat dimuat. Periksa koneksi internet Anda.')
  }
  renderSidebar()
}

async function openConversation(id) {
  state.pendingDeleteId = null
  if (state.busy || id === state.activeId) {
    setSidebarOpen(false)
    renderSidebar()
    return
  }
  try {
    state.messages = await listMessages(id)
    state.activeId = id
  } catch {
    showToast('Percakapan ini belum dapat dibuka. Coba lagi.')
    return
  }
  setSidebarOpen(false)
  renderAll()
}

function startNewChat() {
  if (state.busy) return
  state.pendingDeleteId = null
  state.activeId = null
  state.messages = []
  setSidebarOpen(false)
  renderAll()
}

async function removeConversation(id) {
  if (state.busy) return
  if (state.pendingDeleteId !== id) {
    state.pendingDeleteId = id
    renderSidebar()
    return
  }
  state.pendingDeleteId = null
  try {
    await deleteConversation(id)
  } catch {
    showToast('Percakapan belum dapat dihapus. Coba lagi.')
    renderSidebar()
    return
  }
  state.conversations = state.conversations.filter((c) => c.id !== id)
  if (state.activeId === id) {
    state.activeId = null
    state.messages = []
  }
  renderAll()
}

function titleFrom(text) {
  return text.length > TITLE_LENGTH ? `${text.slice(0, TITLE_LENGTH)}...` : text
}

async function ensureConversation(text) {
  if (state.activeId) return state.activeId
  const conversation = await createConversation(titleFrom(text))
  state.conversations.unshift(conversation)
  state.activeId = conversation.id
  return conversation.id
}

async function saveMessage(conversationId, message) {
  try {
    await addMessage(conversationId, message.role, message.content)
  } catch {
    showToast('Pesan belum tersimpan di riwayat. Jawaban tetap dapat dibaca.')
  }
}

async function generateAnswer(text, history) {
  if (hasCloudKey(state.settings) && navigator.onLine) {
    try {
      const { text: answer } = await askCloud(buildMessages(history, state.role), state.settings)
      return answer
    } catch {
      showToast('Layanan online sedang tidak tersedia. Jawaban diberikan dalam mode offline.')
    }
  }
  return respondOffline(text, state.role)
}

async function sendMessage(rawText) {
  const text = rawText.trim()
  if (!text || state.busy) return

  state.busy = true
  el.input.value = ''
  resizeInput()
  renderAll()

  let conversationId
  try {
    conversationId = await ensureConversation(text)
  } catch {
    state.busy = false
    el.input.value = text
    resizeInput()
    showToast('Pesan belum dapat dikirim. Periksa koneksi internet Anda.')
    renderAll()
    return
  }

  try {
    const userMessage = { role: 'user', content: text }
    state.messages.push(userMessage)
    renderChat()
    await saveMessage(conversationId, userMessage)

    const answer = await generateAnswer(text, state.messages.slice(-HISTORY_LIMIT))
    const assistantMessage = { role: 'assistant', content: answer }
    state.messages.push(assistantMessage)
    await saveMessage(conversationId, assistantMessage)

    const html = findHtmlBlock(answer)
    if (html) openCanvas(html)
  } finally {
    state.busy = false
    renderAll()
  }
}

function resizeInput() {
  el.input.style.height = 'auto'
  el.input.style.height = `${Math.min(el.input.scrollHeight, 160)}px`
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Clipboard API is blocked inside some embedded previews; fall back below.
    }
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  const copied = document.execCommand('copy')
  area.remove()
  return copied
}

async function copyCode(button, code) {
  if (!(await copyText(code))) {
    showToast('Kode belum dapat disalin. Silakan salin secara manual.')
    return
  }
  button.textContent = 'Tersalin'
  setTimeout(() => {
    button.textContent = 'Salin'
  }, 1500)
}

function fillSettingsForm() {
  el.geminiKey.value = state.settings.geminiKey
  el.groqKey.value = state.settings.groqKey
  el.modelSelect.innerHTML = MODELS.map((m) => `<option value="${m.id}">${m.label}</option>`).join('')
  el.modelSelect.value = state.settings.model
}

el.composer.addEventListener('submit', (event) => {
  event.preventDefault()
  sendMessage(el.input.value)
})

el.input.addEventListener('input', resizeInput)

el.input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    el.composer.requestSubmit()
  }
})

el.messages.addEventListener('click', (event) => {
  const button = event.target.closest('button')
  if (!button) return

  if (button.dataset.suggest) {
    sendMessage(button.dataset.suggest)
    return
  }

  const block = button.closest('.code-block')
  if (!block) return
  const code = block.querySelector('code').textContent
  if (button.dataset.action === 'canvas') openCanvas(code)
  if (button.dataset.action === 'copy') copyCode(button, code)
})

el.conversationList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  if (button.dataset.action === 'open') openConversation(button.dataset.id)
  if (button.dataset.action === 'delete') removeConversation(button.dataset.id)
})

el.roles.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-role]')
  if (!chip) return
  state.role = chip.dataset.role
  renderRoleChips()
})

el.menuButton.addEventListener('click', () => setSidebarOpen(!el.sidebar.classList.contains('open')))
el.scrim.addEventListener('click', () => setSidebarOpen(false))
el.newChat.addEventListener('click', startNewChat)
el.canvasToggle.addEventListener('click', () => {
  el.canvas.hidden = !el.canvas.hidden
})
el.canvasClose.addEventListener('click', () => {
  el.canvas.hidden = true
})

el.settingsButton.addEventListener('click', () => {
  fillSettingsForm()
  el.settingsDialog.showModal()
})
el.settingsCancel.addEventListener('click', () => el.settingsDialog.close())
el.settingsForm.addEventListener('submit', () => {
  state.settings = {
    geminiKey: el.geminiKey.value.trim(),
    groqKey: el.groqKey.value.trim(),
    model: el.modelSelect.value,
  }
  saveSettings(state.settings)
  renderModeBadge()
})

window.addEventListener('online', renderModeBadge)
window.addEventListener('offline', renderModeBadge)

renderAll()
refreshConversations()
