<script setup lang="ts">
import type { WeekPlan, Recipe, ShoppingCart } from '~/types'

// Get current week info
const today = new Date()
const startOfYear = new Date(today.getFullYear(), 0, 1)
const pastDaysOfYear = (today.getTime() - startOfYear.getTime()) / 86400000
const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)

// Fetch current week plan
const { data: weekPlan } = await useFetch<WeekPlan>('/api/week-plan/current', {
  default: () => null
})

// Fetch recent recipes
const { data: recentRecipes } = await useFetch<Recipe[]>('/api/recipes', {
  query: { limit: 4 },
  default: () => []
})

// Fetch cart
const { data: cart } = await useFetch<ShoppingCart>('/api/cart', {
  default: () => null
})

const stats = computed(() => ({
  recipesThisWeek: weekPlan.value?.recipes?.length ?? 0,
  cartItems: cart.value?.items?.length ?? 0,
  cartTotal: cart.value?.totalPrice ?? 0
}))
</script>

<template>
  <div class="page-shell space-y-8">
    <!-- Hero Section -->
    <div class="hero-panel rounded-[2rem] p-7 text-white sm:p-10">
      <div class="relative z-10">
        <div class="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-emerald-50 ring-1 ring-white/20">
          <UIcon name="i-lucide-sparkles" class="h-3.5 w-3.5" />
          Din vecka, lite enklare
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Välkommen till Foodflow
        </h1>
        <p class="mt-3 max-w-md text-sm leading-6 text-emerald-50/85 sm:text-base">
          Planera veckan {{ weekNumber }}, {{ today.getFullYear() }} och få koll på middagarna innan veckan börjar.
        </p>
        <NuxtLink to="/week-plan" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-lg shadow-emerald-950/15 hover:-translate-y-0.5 hover:bg-emerald-50">
          Öppna veckoplanen
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
      
      <!-- Decorative circles -->
      <div class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div class="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/5" />
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-4 md:grid-cols-3">
      <UCard class="surface-card border-0">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <UIcon name="i-lucide-calendar" class="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.recipesThisWeek }}</p>
            <p class="text-sm text-gray-500">Recept denna vecka</p>
          </div>
        </div>
      </UCard>
      
      <UCard class="surface-card border-0">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
            <UIcon name="i-lucide-shopping-cart" class="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.cartItems }}</p>
            <p class="text-sm text-gray-500">Varor i varukorgen</p>
          </div>
        </div>
      </UCard>
      
      <UCard class="surface-card border-0">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
            <UIcon name="i-lucide-receipt" class="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.cartTotal.toFixed(2) }} kr</p>
            <p class="text-sm text-gray-500">Beräknad totalsumma</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick Actions -->
    <div>
      <div class="mb-4">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Kom igång</p>
        <h2 class="mt-1 text-xl font-extrabold tracking-tight text-gray-950">Vad vill du göra?</h2>
      </div>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NuxtLink to="/week-plan">
          <UCard class="surface-card border-0 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/10">
            <div class="flex flex-col items-center text-center">
              <UIcon name="i-lucide-plus-circle" class="mb-2 h-8 w-8 text-emerald-500" />
              <span class="font-medium text-gray-900">Planera vecka</span>
              <span class="mt-1 text-sm text-gray-500">Välj recept för veckan</span>
            </div>
          </UCard>
        </NuxtLink>
        
        <NuxtLink to="/recipes">
          <UCard class="surface-card border-0 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/10">
            <div class="flex flex-col items-center text-center">
              <UIcon name="i-lucide-book-open" class="mb-2 h-8 w-8 text-emerald-500" />
              <span class="font-medium text-gray-900">Browse recept</span>
              <span class="mt-1 text-sm text-gray-500">Utforska alla recept</span>
            </div>
          </UCard>
        </NuxtLink>
        
        <NuxtLink to="/cart">
          <UCard class="surface-card border-0 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/10">
            <div class="flex flex-col items-center text-center">
              <UIcon name="i-lucide-list" class="mb-2 h-8 w-8 text-emerald-500" />
              <span class="font-medium text-gray-900">Inköpslista</span>
              <span class="mt-1 text-sm text-gray-500">Se vad du ska handla</span>
            </div>
          </UCard>
        </NuxtLink>
        
        <NuxtLink to="/recipes?import=true">
          <UCard class="surface-card border-0 transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/10">
            <div class="flex flex-col items-center text-center">
              <UIcon name="i-lucide-download" class="mb-2 h-8 w-8 text-emerald-500" />
              <span class="font-medium text-gray-900">Importera recept</span>
              <span class="mt-1 text-sm text-gray-500">Lägg till från webben</span>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Recipes -->
    <div v-if="recentRecipes && recentRecipes.length > 0">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Senaste recept</h2>
        <NuxtLink to="/recipes" class="text-sm text-emerald-600 hover:text-emerald-700">
          Visa alla →
        </NuxtLink>
      </div>
      
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RecipeCard
          v-for="recipe in recentRecipes"
          :key="recipe.id"
          :recipe="recipe"
        />
      </div>
    </div>

    <!-- Empty State -->
    <UCard v-else class="text-center">
      <div class="py-8">
        <UIcon name="i-lucide-chef-hat" class="mx-auto h-16 w-16 text-gray-300" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Inga recept ännu</h3>
        <p class="mt-2 text-sm text-gray-500">
          Kom igång genom att lägga till dina första recept
        </p>
        <div class="mt-4 flex justify-center gap-3">
          <UButton to="/recipes?import=true" color="primary">
            Importera recept
          </UButton>
          <UButton to="/recipes" variant="outline">
            Bläddra
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
