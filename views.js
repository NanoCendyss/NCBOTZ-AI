import { escapeHtml, renderMarkdown } from './markdown.js'
import { ROLES } from './prompts.js'

const SUGGESTIONS = [
  'Buatkan kalkulator sederhana',
  'Jelaskan apa itu API',
  'Buatkan daftar tugas (to-do)',
]

export function renderRoles(activeRole) {
  return ROLES.map((role) => `
    <button type="button" class="role-chip${role.id === activeRole ? ' active' : ''}" data-role="${role.id}" aria-pressed="${role.id === activeRole}">${escapeHtml(role.label)}</button>
  `).join('')
}

export function renderConversations(conversations, activeId, pendingDeleteId) {
  if (conversations.length === 0) {
    return '<li class="empty-note">Belum ada riwayat percakapan</li>'
  }
  return conversations.map((conversation) => {
    const id = escapeHtml(conversation.id)
    const active = conversation.id === activeId ? ' active' : ''
    const pending = conversation.id === pendingDeleteId
    const deleteLabel = pending ? 'Yakin?' : 'Hapus'
    const pendingClass = pending ? ' pending' : ''
    return `
      <li class="conversation-item${active}${pendingClass}">
        <button type="button" class="conversation-open" data-action="open" data-id="${id}">${escapeHtml(conversation.title)}</button>
        <button type="button" class="conversation-delete" data-action="delete" data-id="${id}" aria-label="${deleteLabel} percakapan">${deleteLabel}</button>
      </li>
    `
  }).join('')
}

function renderWelcome() {
  const chips = SUGGESTIONS.map((text) => (
    `<button type="button" class="suggestion" data-suggest="${escapeHtml(text)}">${escapeHtml(text)}</button>`
  )).join('')
  return `
    <div class="welcome">
      <h1>Selamat datang di NCBOTZ AI</h1>
      <p>Tanyakan apa saja, atau minta dibuatkan aplikasi web. Pratinjau kode akan tampil di Code Canvas.</p>
      <div class="suggestions">${chips}</div>
    </div>
  `
}

function renderMessage({ role, content }) {
  if (role === 'user') {
    return `<div class="message user"><div class="bubble">${escapeHtml(content)}</div></div>`
  }
  return `<div class="message assistant"><div class="bubble markdown">${renderMarkdown(content)}</div></div>`
}

export function renderMessages(messages, busy) {
  if (messages.length === 0 && !busy) return renderWelcome()
  const items = messages.map(renderMessage)
  if (busy) {
    items.push('<div class="message assistant"><div class="bubble typing" aria-label="NCBOTZ AI sedang mengetik"><span></span><span></span><span></span></div></div>')
  }
  return items.join('')
}
