import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/test-utils'],
  css: ['~/assets/css/main.css'],
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
