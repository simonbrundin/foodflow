<script setup lang="ts">
const route = useRoute()

const navigation = [
  { name: 'Hem', to: '/', icon: 'i-lucide-home' },
  { name: 'Recept', to: '/recipes', icon: 'i-lucide-book-open' },
  { name: 'Vecka', to: '/week-plan', icon: 'i-lucide-calendar' },
  { name: 'Varukorg', to: '/cart', icon: 'i-lucide-shopping-cart' },
  { name: 'Inställningar', to: '/settings', icon: 'i-lucide-settings' }
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Desktop Layout -->
    <div class="hidden md:flex">
      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div class="flex h-full flex-col">
          <!-- Logo -->
          <div class="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
            <UIcon name="i-lucide-leaf" class="h-8 w-8 text-emerald-500" />
            <span class="text-xl font-bold text-gray-900">Foodflow</span>
          </div>
          
          <!-- Navigation -->
          <nav class="flex-1 space-y-1 p-4">
            <NuxtLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              :class="[
                route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to))
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-700 hover:bg-gray-100'
              ]"
            >
              <UIcon :name="item.icon" class="h-5 w-5" />
              {{ item.name }}
            </NuxtLink>
          </nav>
          
          <!-- Footer -->
          <div class="border-t border-gray-200 p-4">
            <p class="text-xs text-gray-500">
              Planera din mat veckan
            </p>
          </div>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="pl-64">
        <div class="mx-auto max-w-7xl p-8">
          <slot />
        </div>
      </main>
    </div>
    
    <!-- Mobile Layout -->
    <div class="md:hidden">
      <!-- Header -->
      <header class="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div class="flex h-14 items-center px-4">
          <UIcon name="i-lucide-leaf" class="mr-2 h-6 w-6 text-emerald-500" />
          <span class="text-lg font-bold text-gray-900">Foodflow</span>
        </div>
      </header>
      
      <!-- Content -->
      <main class="pb-20">
        <div class="p-4">
          <slot />
        </div>
      </main>
      
      <!-- Bottom Navigation -->
      <nav class="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white">
        <div class="flex justify-around">
          <NuxtLink
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            class="flex flex-col items-center py-2 px-3"
            :class="[
              route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to))
                ? 'text-emerald-600'
                : 'text-gray-500'
            ]"
          >
            <UIcon :name="item.icon" class="h-6 w-6" />
            <span class="mt-1 text-xs">{{ item.name }}</span>
          </NuxtLink>
        </div>
      </nav>
    </div>
  </div>
</template>
