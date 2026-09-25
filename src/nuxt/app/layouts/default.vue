<script setup lang="ts">
const route = useRoute()
const { loggedIn, user, clear } = useUserSession()

const handleLogout = async () => {
  await clear()
  await navigateTo('/login')
}

const navigation = [
  { name: 'Hem', to: '/', icon: 'i-lucide-home' },
  { name: 'Recept', to: '/recipes', icon: 'i-lucide-book-open' },
  { name: 'Planering', to: '/week-plan', icon: 'i-lucide-calendar' },
  { name: 'Varukorg', to: '/cart', icon: 'i-lucide-shopping-cart' },
  { name: 'Inställningar', to: '/settings', icon: 'i-lucide-settings' }
]
</script>

<template>
  <div class="dark-theme min-h-screen">
    <!-- Desktop Layout -->
    <div class="hidden md:flex">
      <!-- Sidebar -->
      <aside
        class="fixed left-0 top-0 z-40 h-screen w-64 border-r border-emerald-400/10 bg-slate-950/80 shadow-[12px_0_40px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        <div class="flex h-full flex-col">
          <!-- Logo -->
          <div class="flex h-20 items-center gap-3 border-b border-slate-700/50 px-6">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
            >
              <UIcon
                name="i-lucide-leaf"
                class="h-5 w-5"
              />
            </div>
            <div>
              <span class="block text-lg font-extrabold tracking-tight text-gray-950">Foodflow</span>
              <span
                class="block text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-600"
              >Måltidsplanering</span>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 space-y-1 p-4">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all"
              :class="[
                route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to))
                  ? 'bg-emerald-400/15 text-emerald-300 shadow-sm shadow-emerald-950/30'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
              ]"
            >
              <UIcon
                :name="item.icon"
                class="h-5 w-5"
              />
              {{ item.name }}
            </NuxtLink>
          </nav>

          <!-- User Menu -->
          <div class="m-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/10 p-4">
            <div v-if="loggedIn" class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <UIcon name="i-lucide-user" class="h-5 w-5" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-emerald-100">
                    {{ user?.name || user?.email || 'Användare' }}
                  </p>
                  <p class="truncate text-xs text-emerald-300/60">
                    {{ user?.email }}
                  </p>
                </div>
              </div>
              <UButton
                @click="handleLogout"
                color="error"
                variant="ghost"
                size="sm"
                block
                icon="i-lucide-log-out"
              >
                Logga ut
              </UButton>
            </div>
            <div v-else class="space-y-3">
              <div class="flex items-center gap-2 text-emerald-300">
                <UIcon
                  name="i-lucide-sparkles"
                  class="h-4 w-4"
                />
                <span class="text-xs font-bold uppercase tracking-wider">Veckans fokus</span>
              </div>
              <p class="text-xs leading-relaxed text-emerald-100/65">
                Planera smartare, handla enklare.
              </p>
              <UButton
                to="/login"
                color="primary"
                variant="solid"
                size="sm"
                block
                icon="i-lucide-log-in"
              >
                Logga in
              </UButton>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="pl-64">
        <div class="page-shell p-6 lg:p-10">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile Layout -->
    <div class="md:hidden">
      <!-- Header -->
      <header class="sticky top-0 z-30 border-b border-slate-700/50 bg-slate-950/90 shadow-sm backdrop-blur-xl">
        <div class="flex h-14 items-center px-4">
          <div
            class="mr-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
          >
            <UIcon
              name="i-lucide-leaf"
              class="h-4 w-4"
            />
          </div>
          <span class="text-lg font-extrabold tracking-tight text-slate-100">Foodflow</span>
        </div>
      </header>

      <!-- Content -->
      <main class="pb-20">
        <div class="p-4 pt-6">
          <slot />
        </div>
      </main>

      <!-- Bottom Navigation -->
      <nav
        class="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-700/50 bg-slate-950/95 shadow-[0_-12px_30px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      >
        <div class="flex justify-around">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center rounded-xl px-3 py-2"
            :class="[
              route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to))
                ? 'text-emerald-300'
                : 'text-slate-500'
            ]"
          >
            <UIcon
              :name="item.icon"
              class="h-6 w-6"
            />
            <span class="mt-1 text-xs">{{ item.name }}</span>
          </NuxtLink>
        </div>
      </nav>
    </div>
  </div>
</template>
