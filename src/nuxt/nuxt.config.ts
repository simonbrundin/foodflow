// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@pinia/nuxt'],

  future: {
    compatibilityVersion: 4
  },

  // Note: aliases (`~`, `~~`, `~/server`) are managed automatically by Nuxt 4
  // based on the project rootDir. Do not hardcode absolute paths here — they
  // break Docker/CI builds where the project lives at a different path.

  devtools: {
    enabled: false
  },

  app: {
    head: {
      title: 'Foodflow - Planera mat veckan',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    appUrl: process.env.APP_URL || '',
    public: {
      appUrl: process.env.APP_URL || ''
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/recipes/**': { prerender: false },
    '/week-plan/**': { prerender: false },
    '/cart/**': { prerender: false },
    '/settings/**': { prerender: false }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
