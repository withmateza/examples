# Mateza website demo

This example shows how to add `@withmateza/website` to a plain Vite app and translate page content from English to Kinyarwanda.

## What this demo does

- Uses `@withmateza/website` to translate DOM text on the page
- Keeps the controls outside the translated area so the button stays usable
- Uses a single button to toggle between:
  - `Translate to Kinyarwanda`
  - `Reset to English`
- Falls back to the original English page if Mateza is not configured
- Uses a Vite proxy during local development to avoid browser CORS issues

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Add your Mateza credentials in `.env`:

```env
VITE_MATEZA_BASE_URL=https://api.mateza.us
VITE_MATEZA_CLIENT_KEY=your_browser_client_key
VITE_MATEZA_PROJECT_ID=your_project_id
```

Use a browser client key here, not a server API key.

3. Start the app:

```bash
pnpm dev
```

## Docker

Build and run the app in a container with the Mateza credentials passed at build time:

```bash
docker build \
  -t mateza-vite-html \
  --build-arg VITE_MATEZA_BASE_URL=https://api.mateza.us \
  --build-arg VITE_MATEZA_CLIENT_KEY=your_browser_client_key \
  --build-arg VITE_MATEZA_PROJECT_ID=your_project_id \
  .

docker run --rm -p 4173:4173 mateza-vite-html
```

Open `http://localhost:4173` after the container starts.

## Vite proxy

The demo routes browser requests through `/mateza-api` in local development.
That keeps the request same-origin and avoids CORS problems.

The proxy is defined in [`vite.config.js`](./vite.config.js).

```js
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_MATEZA_')
  const target = env.VITE_MATEZA_BASE_URL?.trim() || 'https://api.mateza.us'

  return {
    server: {
      proxy: {
        '/mateza-api': {
          target,
          changeOrigin: true,
          secure: target.startsWith('https://'),
          rewrite: (path) => path.replace(/^\/mateza-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
            })
          },
        },
      },
    },
    preview: {
      proxy: {
        '/mateza-api': {
          target,
          changeOrigin: true,
          secure: target.startsWith('https://'),
          rewrite: (path) => path.replace(/^\/mateza-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
            })
          },
        },
      },
    },
  }
})
```

## Translation flow

The page uses `createWebsiteTranslator` from `@withmateza/website`.

```js
import { createWebsiteTranslator } from '@withmateza/website'

const translator = createWebsiteTranslator({
  baseUrl: '/mateza-api',
  clientKey: import.meta.env.VITE_MATEZA_CLIENT_KEY,
  projectId: import.meta.env.VITE_MATEZA_PROJECT_ID,
  siteId: 'vite-html',
  sourceLang: 'en',
  targetLang: 'rw',
})
```

For this demo:

- English is the source language
- Kinyarwanda is the only supported target language
- The content area is translated on demand when the user clicks the button

To translate text nodes, the demo calls:

```js
await translator.translateText(text, { glossarySensitive: true })
```

That keeps the example simple and avoids the batch endpoint.

## File layout

- [`src/main.js`](./src/main.js) - page markup and translation logic
- [`src/style.css`](./src/style.css) - styling for the demo
- [`vite.config.js`](./vite.config.js) - dev and preview proxy config
- [`.env.example`](./.env.example) - required environment variables

## Troubleshooting

- If translation does not start, check that all three `VITE_MATEZA_*` variables are set.
- If you see CORS errors, make sure the app is using the local `/mateza-api` proxy path.
- If Mateza returns `404` or `401`, the client key or project ID is probably invalid for the configured API host.
- After changing `vite.config.js`, restart `pnpm dev`.
