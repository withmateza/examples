import { createWebsiteTranslator } from '@withmateza/website'
import './style.css'

const app = document.querySelector('#app')
const sourceLang = 'en'
const targetLang = 'rw'
const runtimeEnv = globalThis.window?.__MATEZA_ENV__ ?? {}
const baseUrl = '/mateza-api'
const clientKey = (runtimeEnv.VITE_MATEZA_CLIENT_KEY ?? import.meta.env.VITE_MATEZA_CLIENT_KEY ?? '').trim()
const projectId = (runtimeEnv.VITE_MATEZA_PROJECT_ID ?? import.meta.env.VITE_MATEZA_PROJECT_ID ?? '').trim()
const apiHost = (runtimeEnv.VITE_MATEZA_BASE_URL ?? import.meta.env.VITE_MATEZA_BASE_URL ?? '').trim()

app.innerHTML = `
  <div class="shell">
    <header class="toolbar">
      <div>
        <p class="eyebrow">Mateza website demo</p>
        <h1>Translate English to Kinyarwanda.</h1>
      </div>

      <div class="controls">
        <button id="translate-btn" type="button">Translate to Kinyarwanda</button>
      </div>
    </header>

    <section class="status-row" aria-live="polite">
      <span class="status-dot" aria-hidden="true"></span>
      <p id="mateza-status">Click Translate to switch the page into Kinyarwanda.</p>
    </section>

    <main id="site-root" class="site-root">
      <section class="hero">
        <h2>English content preview</h2>
        <p class="lede">
          This area is the part that Mateza translates. The controls above stay in place so you can
          switch between English and Kinyarwanda without losing the button.
        </p>
      </section>

      <section class="detail-grid" aria-label="Configuration details">
        <article class="panel">
          <h3>Required env vars</h3>
          <ul>
            <li><code>VITE_MATEZA_BASE_URL</code></li>
            <li><code>VITE_MATEZA_CLIENT_KEY</code></li>
            <li><code>VITE_MATEZA_PROJECT_ID</code></li>
          </ul>
        </article>

        <article class="panel">
          <h3>Supported source</h3>
          <p><code>${sourceLang}</code> is the page source language.</p>
        </article>
      </section>
    </main>
  </div>
`

const statusNode = document.querySelector('#mateza-status')
const buttonNode = document.querySelector('#translate-btn')
const siteRoot = document.querySelector('#site-root')
const initialSiteHtml = siteRoot?.innerHTML ?? ''
const missing = []

if (!apiHost) missing.push('VITE_MATEZA_BASE_URL')
if (!clientKey) missing.push('VITE_MATEZA_CLIENT_KEY')
if (!projectId) missing.push('VITE_MATEZA_PROJECT_ID')

function getLanguageLabel(code) {
  return code === 'rw' ? 'Kinyarwanda' : code
}

function restoreEnglish() {
  if (siteRoot) {
    siteRoot.innerHTML = initialSiteHtml
  }
}

function setStatus(message) {
  if (statusNode) {
    statusNode.textContent = message
  }
}

function setButtonLabel(mode) {
  if (!buttonNode) {
    return
  }

  buttonNode.textContent = mode === 'translated' ? 'Reset to English' : 'Translate to Kinyarwanda'
}

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []

  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node?.nodeValue?.trim()) {
      const parent = node.parentElement
      if (!parent) {
        continue
      }

      const tagName = parent.tagName.toLowerCase()
      if (['script', 'style', 'code', 'pre'].includes(tagName)) {
        continue
      }

      if (parent.closest('[data-no-translate]') || parent.closest('button, select, option')) {
        continue
      }

      nodes.push(node)
    }
  }

  return nodes
}

async function translateTo(targetLang) {
  if (!siteRoot) {
    return false
  }

  restoreEnglish()

  if (targetLang === sourceLang) {
    setStatus('Showing the original English page.')
    return true
  }

  const translator = createWebsiteTranslator({
    baseUrl,
    clientKey,
    projectId,
    siteId: 'vite-html',
    sourceLang,
    targetLang,
  })

  try {
    const textNodes = collectTextNodes(siteRoot)
    for (const node of textNodes) {
      const original = node.nodeValue ?? ''
      const translated = await translator.translateText(original, { glossarySensitive: true })
      node.nodeValue = translated
    }

    setStatus(`Translated the page to ${getLanguageLabel(targetLang)}.`)
    return true
  } catch (error) {
    restoreEnglish()
    const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 0
    if (statusCode === 404) {
      setStatus('Mateza returned 404. Your browser client key does not match a live project on the API host.')
      if (buttonNode) {
        buttonNode.disabled = true
      }
    } else {
      setStatus(`Translation failed for ${getLanguageLabel(targetLang)}. Check the API proxy and credentials.`)
    }
    console.error('[Mateza] Translation failed', error)
    return false
  }
}

if (missing.length > 0) {
  const message = `Mateza is not configured. Missing: ${missing.join(', ')}.`
  setStatus(message)

  if (buttonNode) {
    buttonNode.disabled = true
  }

  console.warn(`[Mateza] ${message} Skipping translator mount.`)
} else {
  let translated = false
  setButtonLabel('english')

  buttonNode?.addEventListener('click', async () => {
    if (translated) {
      restoreEnglish()
      translated = false
      setButtonLabel('english')
      setStatus('Showing the original English page.')
      return
    }

    const success = await translateTo(targetLang)
    translated = success
    setButtonLabel(success ? 'translated' : 'english')
  })

  setStatus('Click Translate to switch the page into Kinyarwanda.')

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      restoreEnglish()
    })
  }
}
