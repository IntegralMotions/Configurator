import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/test-utils', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  i18n: {
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.ts', flag: 'twemoji:flag-united-states' },
      { code: 'nl', language: 'nl-NL', name: 'Nederlands', file: 'nl.ts', flag: 'twemoji:flag-netherlands' }
    ],
    defaultLocale: 'en',
    experimental: {
      typedOptionsAndMessages: 'all'
    },
    strategy: 'prefix',
    langDir: 'locales',
    detectBrowserLanguage: {
      cookieKey: 'i18n_redirected',
      alwaysRedirect: false,
      fallbackLocale: 'en'
    }
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        lib: ['ESNext', 'DOM', 'DOM.Iterable']
      }
    }
  },
  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'tertiary',
        'info',
        'success',
        'warning',
        'error',
        'brand',
        'accent'
      ]
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
    server: {
      watch: {
        usePolling: true
      },
    }
  }
})
