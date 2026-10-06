<script setup lang="ts">
import type { Recipe } from '~/types'

interface Props {
  recipe: Recipe
  storeId?: string
}

const props = withDefaults(defineProps<Props>(), {
  storeId: ''
})

const { isInWeekPlan } = useWeekPlan()

const totalTime = computed(() => props.recipe.prepTime + props.recipe.cookTime)

// Fetch price data
const { data: priceData } = await useFetch(`/api/recipes/${props.recipe.id}/price`, {
  query: computed(() => ({
    storeId: props.storeId || undefined,
    servings: props.recipe.servings
  })),
  default: () => null
})

const showPrice = computed(() => priceData.value?.hasPrice === true)
const formattedPrice = computed(() => {
  if (!priceData.value?.hasPrice) return ''
  const price = priceData.value.pricePerServing
  return price % 1 === 0 ? `${price.toFixed(0)} kr` : `${price.toFixed(2)} kr`
})

// Format time nicely
const formattedTime = computed(() => {
  const mins = totalTime.value
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return remainingMins > 0 ? `${hours}t ${remainingMins}m` : `${hours}t`
  }
  return `${mins} min`
})

// Rating
const ratingPercent = computed(() => {
  const r = props.recipe.rating || 0
  return (r / 10) * 100
})

const showRating = computed(() => props.recipe.rating !== undefined && props.recipe.rating !== null && props.recipe.rating > 0)

const formattedRating = computed(() => {
  const r = props.recipe.rating
  if (r === undefined || r === null) return ''
  return r.toFixed(1)
})
</script>

<template>
  <NuxtLink
    :to="`/recipes/${recipe.id}`"
    class="group block h-full"
  >
    <article class="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <!-- Image Container -->
      <div class="relative aspect-[4/3] overflow-hidden">
        <img
          v-if="recipe.imageUrl"
          :src="recipe.imageUrl"
          :alt="recipe.title"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        >
        <div
          v-else
          class="flex h-full items-center justify-center bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500"
        >
          <UIcon
            name="i-lucide-utensils-crossed"
            class="h-16 w-16 text-white/40"
          />
        </div>

        <!-- Subtle dark overlay at bottom for readability -->
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

        <!-- In Week Plan Badge -->
        <div
          v-if="isInWeekPlan(recipe.id)"
          class="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg"
        >
          <UIcon
            name="i-lucide-check"
            class="h-3 w-3"
          />
          I planen
        </div>

        <!-- Rating Badge on image -->
        <div
          v-if="showRating"
          class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gray-950/90 px-2 py-1 text-[11px] font-bold text-white shadow-lg shadow-black/25 backdrop-blur-sm"
        >
          <div class="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            <UIcon
              name="i-lucide-star"
              class="block h-3.5 w-3.5 text-gray-600"
            />
            <div
              class="absolute inset-0 overflow-hidden"
              :style="{ width: ratingPercent + '%' }"
            >
              <UIcon
                name="i-lucide-star"
                class="block h-3.5 w-3.5 fill-amber-400 text-amber-400"
              />
            </div>
          </div>
          <span class="leading-none">{{ formattedRating }}</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex flex-1 flex-col p-5">
        <!-- Title -->
        <h3 class="line-clamp-2 min-h-[2.75rem] text-lg font-bold leading-tight text-gray-900 transition-colors group-hover:text-emerald-600">
          {{ recipe.title }}
        </h3>

        <!-- Meta badges -->
        <div class="mt-3 flex min-h-7 items-center justify-between gap-2 pt-3">
          <!-- Time Badge -->
          <div class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
            <UIcon
              name="i-lucide-timer"
              class="h-3.5 w-3.5 text-emerald-600"
            />
            <span>{{ formattedTime }}</span>
          </div>

          <!-- Price Badge -->
          <div
            v-if="showPrice"
            class="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-900/20"
          >
            <UIcon
              name="i-lucide-wallet-cards"
              class="h-3.5 w-3.5 text-emerald-100"
            />
            <span>{{ formattedPrice }}</span>
          </div>
        </div>
      </div>
    </article>
  </NuxtLink>
</template>
