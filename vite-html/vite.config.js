import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_MATEZA_')
  const target = env.VITE_MATEZA_BASE_URL?.trim() || 'https://api.mateza.rw'

  const proxy = {
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
  }

  return {
    server: { proxy },
    preview: {
      proxy,
      allowedHosts: ['demo-html.mateza.us'],
    },
  }
})
