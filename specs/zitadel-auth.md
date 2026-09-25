---
status: implemented
priority: critical
tags: [auth, zitadel, security]
created: 2025-09-25
updated: 2025-09-25
---

# Foodflow - Zitadel Authentication

## Bakgrund

Implementera inloggning med Zitadel OAuth 2.0 + PKCE i Foodflow. Användaren ska kunna logga in med sitt Zitadel-konto och få en personlig upplevelse.

## Teknisk implementation

### Beroenden

Lägg till `nuxt-auth-utils` till `package.json`:

```json
{
  "dependencies": {
    "nuxt-auth-utils": "^0.5.25"
  }
}
```

### Konfiguration

#### 1. `nuxt.config.ts` - Lägg till auth-modul och OAuth-config

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@pinia/nuxt',
    'nuxt-auth-utils'  // <-- Lägg till här
  ],

  runtimeConfig: {
    public: {
      appUrl: process.env.APP_URL || ''
    },
    oauth: {
      zitadel: {
        clientId: process.env.NUXT_OAUTH_ZITADEL_CLIENT_ID || '',
        clientSecret: process.env.NUXT_OAUTH_ZITADEL_CLIENT_SECRET || '',
        domain: process.env.NUXT_OAUTH_ZITADEL_DOMAIN || '',
        redirectUrl: process.env.NUXT_OAUTH_ZITADEL_REDIRECT_URL || ''
      }
    }
  }
})
```

### Miljövariabler

Skapa `.env` med:

```env
# Zitadel OAuth (PKCE - ingen klienthemlighet krävs)
NUXT_OAUTH_ZITADEL_CLIENT_ID=your-client-id
NUXT_OAUTH_ZITADEL_DOMAIN=your-instance.zitadel.cloud
NUXT_OAUTH_ZITADEL_REDIRECT_URL=https://your-domain.com/api/auth/zitadel

# App URL
APP_URL=https://your-domain.com
```

### Filstruktur

#### 1. `app/auth.d.ts` - Type declarations

```typescript
declare module '#auth-utils' {
  interface User {
    id: string
    sub: string
    email: string
    name: string
    accessToken?: string
    refreshToken?: string
    idToken?: string
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
```

#### 2. `server/api/auth/zitadel.get.ts` - OAuth handler

Se `src/nuxt/server/api/auth/zitadel.get.ts` i plan-repot för full implementation.

Key features:
- PKCE (Proof Key for Code Exchange) för säkerhet
- State validation för CSRF-skydd
- Token exchange med Zitadel
- UserInfo-hämtning
- Session-sättning med `setUserSession()`

#### 3. `app/pages/login/index.vue` - Login-sida

Design: Emerald-grön tematik som matchar Foodflow's design language.

```vue
<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

const handleLogout = async () => {
  await clear()
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <UCard class="max-w-md w-full">
      <template #header>
        <h1 class="text-2xl font-bold text-center">Foodflow</h1>
      </template>

      <div v-if="loggedIn" class="text-center space-y-4">
        <p>Välkommen, {{ user?.name || user?.email }}</p>
        <UButton @click="handleLogout" color="error">
          Logga ut
        </UButton>
      </div>

      <div v-else class="text-center space-y-6">
        <p class="text-gray-600 dark:text-gray-400">
          Logga in för att planera dina veckomiddagar
        </p>
        <UButton
          to="/api/auth/zitadel"
          color="primary"
          size="lg"
          block
          icon="i-lucide-log-in"
        >
          Logga in med Zitadel
        </UButton>
      </div>
    </UCard>
  </div>
</template>
```

#### 4. `app/middleware/auth.ts` - Auth middleware

```typescript
export default defineNuxtRouteMiddleware((to) => {
  if (process.env.NODE_ENV === 'development') return

  const { user } = useUserSession()

  // Allow access to login and API health
  if (to.path === '/login' || to.path === '/api/health') {
    return
  }

  // Redirect to login if not authenticated
  if (!user.value) {
    return navigateTo('/login')
  }
})
```

#### 5. `app/layouts/default.vue` - Uppdatera navigation

Lägg till user menu i sidebar/header:

```vue
<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()

const handleLogout = async () => {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <!-- ... existing layout ... -->
  
  <!-- Lägg till user menu där det passar -->
  <div v-if="loggedIn" class="flex items-center gap-2">
    <span class="text-sm">{{ user?.name || user?.email }}</span>
    <UButton size="xs" @click="handleLogout" icon="i-lucide-log-out">
      Logga ut
    </UButton>
  </div>
</template>
```

### API Routes

Skydda alla API-routes som kräver autentisering:

```typescript
// Exempel: server/api/recipes/index.get.ts
export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }
  
  // ... rest of handler
})
```

## Design Language

Använd Foodflow's existande färgpalett:
- Primary: `#10B981` (Emerald green)
- Dark theme support med `.dark` class

## Acceptanskriterier

- [x] Användare kan logga in via Zitadel OAuth
- [x] Användare kan logga ut
- [x] Skyddade routes redirectar till login
- [x] User info visas i UI
- [x] Sessionen persists över sidladdningar
- [x] Development mode skippar auth (enligt plan)

## Anteckningar

- Zitadel-klient måste konfigureras med:
  - Redirect URI: `https://your-domain.com/api/auth/zitadel`
  - PKCE måste vara aktiverat
  - Scopes: `openid email profile`
