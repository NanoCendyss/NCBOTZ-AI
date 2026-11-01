const FENCE = /```([\w-]*)\n?([\s\S]*?)```/g
const HTML_LANGS = /^html?$/i

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderInline(escaped) {
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function renderTextBlock(block) {
  const out = []
  let listType = null

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  const openList = (type) => {
    if (listType !== type) {
      closeList()
      out.push(`<${type}>`)
      listType = type
    }
  }

  for (const raw of escapeHtml(block).split('\n')) {
    const line = raw.trim()
    const heading = line.match(/^#{1,3}\s+(.*)$/)
    const bullet = line.match(/^[-*]\s+(.*)$/)
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)

    if (heading) {
      closeList()
      out.push(`<h3>${renderInline(heading[1])}</h3>`)
    } else if (bullet) {
      openList('ul')
      out.push(`<li>${renderInline(bullet[1])}</li>`)
    } else if (numbered) {
      openList('ol')
      out.push(`<li>${renderInline(numbered[1])}</li>`)
    } else if (!line) {
      closeList()
    } else {
      closeList()
      out.push(`<p>${renderInline(line)}</p>`)
    }
  }

  closeList()
  return out.join('')
}

function renderCodeBlock(lang, code) {
  const canvasButton = HTML_LANGS.test(lang)
    ? '<button type="button" data-action="canvas">Buka di Canvas</button>'
    : ''

  return `<div class="code-block">
    <div class="code-head">
      <span>${escapeHtml(lang || 'code')}</span>
      <div class="code-actions">${canvasButton}<button type="button" data-action="copy">Salin</button></div>
    </div>
    <pre><code>${escapeHtml(code.replace(/\n$/, ''))}</code></pre>
  </div>`
}

export function renderMarkdown(text) {
  let html = ''
  let last = 0

  for (const match of text.matchAll(FENCE)) {
    html += renderTextBlock(text.slice(last, match.index))
    html += renderCodeBlock(match[1], match[2])
    last = match.index + match[0].length
  }

  return html + renderTextBlock(text.slice(last))
}

export function findHtmlBlock(text) {
  const blocks = [...text.matchAll(FENCE)].filter((match) => HTML_LANGS.test(match[1]))
  return blocks.length ? blocks[blocks.length - 1][2] : null
}
