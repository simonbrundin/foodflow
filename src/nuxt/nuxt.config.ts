// https://nuxt.com/docs/api/configuration/nuxt-config
// Trigger workflow for multi-platform build

import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/image', '@pinia/nuxt', 'nuxt-auth-utils'],
  // `~` / `~~` hanteras automatiskt av Nuxt 4 från rootDir — inga absoluta paths.

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
    public: {
      appUrl: process.env.APP_URL || ''
    },
    oauth: {
      // Zitadel OAuth provider configuration (PKCE - no secret)
      zitadel: {
        clientId: process.env.NUXT_OAUTH_ZITADEL_CLIENT_ID || '',
        clientSecret: process.env.NUXT_OAUTH_ZITADEL_CLIENT_SECRET || '',
        domain: process.env.NUXT_OAUTH_ZITADEL_DOMAIN || '',
        // Full absolute callback URL registered with the Zitadel client
        redirectUrl: process.env.NUXT_OAUTH_ZITADEL_REDIRECT_URL || ''
      }
    }
  },

  // Alias-override: i Nuxt 4 antas `~/server` peka på `app/server`, men det här
  // projektet har `server/` direkt i rootDir. Vi åsidosätter bara `~/server` och
  // låter `~` / `~~` hanteras automatiskt av Nuxt.
  alias: {
    '~/server': fileURLToPath(new URL('./server', import.meta.url))
  },

  routeRules: {
    '/': { prerender: true },
    '/login/**': { prerender: false },
    '/recipes/**': { prerender: false },
    '/week-plan/**': { prerender: false },
    '/cart/**': { prerender: false },
    '/settings/**': { prerender: false }
  },

  future: {
    compatibilityVersion: 4
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
