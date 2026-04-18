#!/bin/sh
set -eu

node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs'

const config = {
  VITE_MATEZA_BASE_URL: process.env.VITE_MATEZA_BASE_URL ?? '',
  VITE_MATEZA_CLIENT_KEY: process.env.VITE_MATEZA_CLIENT_KEY ?? '',
  VITE_MATEZA_PROJECT_ID: process.env.VITE_MATEZA_PROJECT_ID ?? '',
}

writeFileSync('./dist/env.js', `window.__MATEZA_ENV__ = ${JSON.stringify(config)};\n`)

const indexPath = './dist/index.html'
const marker = '<script src="/env.js"></script>'
const scriptTag = `${marker}\n    <script type="module" src="/src/main.js"></script>`
const original = '<script type="module" src="/src/main.js"></script>'

let html = readFileSync(indexPath, 'utf8')
if (!html.includes(marker)) {
  html = html.replace(original, scriptTag)
  writeFileSync(indexPath, html)
}
NODE

exec npm run preview -- --host 0.0.0.0 --port 3000
