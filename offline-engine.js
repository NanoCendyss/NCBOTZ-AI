import { getTemplate } from './code-templates.js'
import { KNOWLEDGE } from './knowledge.js'
import { FOOTER, detectLanguage, getRole } from './prompts.js'

const CODE_REQUEST = /\b(buat|buatkan|bikin|tulis|create|make|build|generate|write|code|kode)\b/i
const GREETING = /^\s*(halo|hai|hi|hello|hey|selamat|pagi|siang|sore|malam)\b/i
const IDENTITY = /siapa (kamu|anda|namamu)|who are you|what are you|your name/i
const APP_REQUEST = /aplikasi|app|web|website|halaman|landing|program|script|situs/i
const MATH_EXPRESSION = /^[\d\s+\-*/().%]+$/
const MAX_TOPICS = 3

const TEMPLATE_RULES = [
  { id: 'calculator', pattern: /kalkulator|calculator/i, title: { id: 'Kalkulator Sederhana', en: 'Simple Calculator' } },
  { id: 'todo', pattern: /to-?do|daftar tugas|tugas/i, title: { id: 'Daftar Tugas', en: 'Todo List' } },
  { id: 'timer', pattern: /timer|stopwatch|penghitung waktu/i, title: { id: 'Stopwatch', en: 'Stopwatch' } },
]

function t(isId, texts) {
  return isId ? texts.id : texts.en
}

function codeReply(isId, template) {
  const title = t(isId, template.title)
  const intro = isId
    ? `Berikut aplikasi **${title}** dalam satu file HTML yang siap dijalankan. Hasilnya otomatis tampil di **Code Canvas** di sebelah kanan.`
    : `Here is a complete **${title}** in a single HTML file, ready to run. The result opens automatically in the **Code Canvas** on the right.`
  return `${intro}\n\n\`\`\`html\n${getTemplate(template.id)}\n\`\`\``
}

function introReply(isId) {
  return isId
    ? '### Halo, saya NCBOTZ AI\n\nSaya sedang berjalan dalam **mode offline**, jadi tetap bisa membantu tanpa koneksi internet. Saya dapat:\n\n- Menjelaskan konsep seperti **HTML**, **CSS**, **JavaScript**, **API**, **database**, **Git**, dan **AI**\n- Membuatkan aplikasi web sederhana: kalkulator, daftar tugas, dan stopwatch\n- Menghitung ekspresi matematika, misalnya `(12 + 8) * 3`\n- Menampilkan hasil kode langsung di Code Canvas\n\nUntuk jawaban yang lebih luas, aktifkan mode online di Pengaturan.'
    : '### Hello, I am NCBOTZ AI\n\nI am currently running in **offline mode**, so I can help without an internet connection. I can:\n\n- Explain concepts such as **HTML**, **CSS**, **JavaScript**, **APIs**, **databases**, **Git**, and **AI**\n- Build simple web apps: calculator, todo list, and stopwatch\n- Evaluate math expressions, for example `(12 + 8) * 3`\n- Show code results instantly in the Code Canvas\n\nFor broader answers, enable online mode in Settings.'
}

function mathReply(isId, expression) {
  let result
  try {
    result = Function(`"use strict"; return (${expression});`)()
  } catch {
    result = NaN
  }
  if (!Number.isFinite(result)) {
    return isId
      ? 'Ekspresi matematika tersebut tidak dapat dihitung. Periksa kembali tanda kurung dan operatornya.'
      : 'That math expression could not be calculated. Please check the brackets and operators.'
  }
  return isId
    ? `### Hasil Perhitungan\n\n\`${expression.trim()} = ${result}\``
    : `### Calculation Result\n\n\`${expression.trim()} = ${result}\``
}

function topicsReply(isId, topics) {
  return topics
    .map((topic) => `### ${t(isId, topic.title)}\n\n${t(isId, topic)}`)
    .join('\n\n')
}

function helpTopicsReply(isId) {
  const names = [...new Set(KNOWLEDGE.map((topic) => t(isId, topic.title)))].join(', ')
  return isId
    ? `### Pertanyaan Anda\n\nDalam mode offline, saya bisa menjelaskan topik berikut: ${names}.\n\nCoba tanyakan, misalnya, "Apa itu CSS Grid?" atau minta "Buatkan kalkulator sederhana". Untuk jawaban yang lebih luas di luar topik ini, aktifkan mode online di Pengaturan.`
    : `### Your Question\n\nIn offline mode, I can explain these topics: ${names}.\n\nTry asking, for example, "What is CSS Grid?" or request "Build a simple calculator". For answers beyond these topics, enable online mode in Settings.`
}

function debugReply(isId) {
  return isId
    ? '### Langkah Debugging\n\n1. Periksa pesan error di konsol browser (F12).\n2. Pastikan setiap tanda kurung, kutip, dan titik koma sudah berpasangan.\n3. Uji bagian kode yang paling kecil terlebih dahulu.\n\nKirim kode dan pesan errornya untuk analisis yang lebih lanjut.'
    : '### Debugging Steps\n\n1. Check the error message in the browser console (F12).\n2. Make sure every bracket, quote, and semicolon is paired correctly.\n3. Test the smallest possible part of the code first.\n\nSend the code and its error message for further analysis.'
}

function matchTopics(text) {
  return KNOWLEDGE.filter((topic) => topic.pattern.test(text)).slice(0, MAX_TOPICS)
}

function buildBody(text, isId, roleId) {
  const template = TEMPLATE_RULES.find((rule) => rule.pattern.test(text))
  if (template && CODE_REQUEST.test(text)) return codeReply(isId, template)

  if (CODE_REQUEST.test(text) && APP_REQUEST.test(text)) {
    return codeReply(isId, {
      id: 'landing',
      title: { id: 'Halaman Web Sederhana', en: 'Simple Web Page' },
    })
  }

  const expression = text.trim()
  if (MATH_EXPRESSION.test(expression) && /\d\s*[-+*/%]\s*\(?\d/.test(expression)) {
    return mathReply(isId, expression)
  }

  if (GREETING.test(text) || IDENTITY.test(text)) return introReply(isId)

  const topics = matchTopics(text)
  if (topics.length) return topicsReply(isId, topics)

  if (roleId === 'debugger') return debugReply(isId)

  return helpTopicsReply(isId)
}

export function respondOffline(text, roleId) {
  const isId = detectLanguage(text) === 'id'
  const { id, label } = getRole(roleId)
  const heading = id === 'general' ? '' : `### ${label} Agent\n\n`
  return `${heading}${buildBody(text, isId, roleId)}\n\n${FOOTER}`
}
