<script setup lang="ts">
const { loggedIn, user, session, clear } = useUserSession()

const handleLogout = async () => {
  await clear()
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div class="w-full max-w-md">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500 mb-4">
          <UIcon
            name="i-lucide-utensils"
            class="h-8 w-8 text-white"
          />
        </div>
        <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Foodflow
        </h1>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Planera veckan, handla smart
        </p>
      </div>

      <UCard class="border-0 shadow-xl shadow-emerald-900/10">
        <!-- Logged in state -->
        <template v-if="loggedIn">
          <div class="text-center space-y-6 py-6">
            <div class="space-y-2">
              <div class="flex justify-center">
                <div class="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-user"
                    class="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Välkommen!
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                {{ user?.name || user?.email }}
              </p>
              <p v-if="session?.loggedInAt" class="text-xs text-gray-400">
                Inloggad {{ new Date(session.loggedInAt).toLocaleString('sv-SE') }}
              </p>
            </div>

            <div class="flex flex-col gap-3">
              <UButton
                to="/"
                color="primary"
                size="lg"
                block
                icon="i-lucide-home"
              >
                Till startsidan
              </UButton>
              <UButton
                @click="handleLogout"
                color="error"
                variant="outline"
                size="lg"
                block
                icon="i-lucide-log-out"
              >
                Logga ut
              </UButton>
            </div>
          </div>
        </template>

        <!-- Not logged in state -->
        <template v-else>
          <div class="text-center space-y-6 py-6">
            <div class="space-y-2">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Logga in
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Logga in för att planera dina veckomiddagar och skapa smarta inköpslistor
              </p>
            </div>

            <UButton
              to="/api/auth/zitadel"
              color="primary"
              size="lg"
              block
              icon="i-lucide-log-in"
            >
              Fortsätt med Zitadel
            </UButton>

            <p class="text-xs text-gray-400">
              Din data lagras säkert och delas aldrig med tredje part
            </p>
          </div>
        </template>
      </UCard>

      <!-- Footer -->
      <p class="text-center mt-6 text-xs text-gray-400">
        <NuxtLink to="/" class="hover:text-emerald-500 transition-colors">
          ← Tillbaka till startsidan
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
