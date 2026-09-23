<script setup lang="ts">
import type { Recipe } from '~/types'

interface Props {
  recipe: Recipe
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const { isInWeekPlan, getTotalServings, addToWeekPlan, removeFromWeekPlan, getWeekPlanEntries } = useWeekPlan()

const isInPlan = computed(() => isInWeekPlan(props.recipe.id))
const totalServings = computed(() => getTotalServings(props.recipe.id))
const weekPlanEntries = computed(() => getWeekPlanEntries(props.recipe.id))

const showServingsPicker = ref(false)
const selectedServings = ref(props.recipe.servings)
const selectedDay = ref(0)

const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

const totalTime = computed(() => props.recipe.prepTime + props.recipe.cookTime)

async function handleAddToPlan() {
  showServingsPicker.value = true
  selectedServings.value = props.recipe.servings
}

async function confirmAddToPlan() {
  const success = await addToWeekPlan(props.recipe, selectedDay.value, selectedServings.value)
  if (success) {
    showServingsPicker.value = false
  }
}

async function handleRemove(entryId: string) {
  await removeFromWeekPlan(entryId)
}

// Rating display
const fullStars = computed(() => Math.floor(props.recipe.rating || 0))
const hasHalfStar = computed(() => (props.recipe.rating || 0) % 1 >= 0.5)
const emptyStars = computed(() => 5 - fullStars.value - (hasHalfStar.value ? 1 : 0))
</script>

<template>
  <UCard
    class="group overflow-hidden rounded-2xl border border-emerald-400/10 bg-slate-900/80 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300/40 hover:shadow-xl hover:shadow-black/30"
    :class="{ 'ring-2 ring-emerald-500 ring-offset-2': isInPlan }"
  >
    <!-- Image -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-950/70 to-slate-800">
      <img
        v-if="recipe.imageUrl"
        :src="recipe.imageUrl"
        :alt="recipe.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      >
      <div
        v-else
        class="flex h-full items-center justify-center"
      >
        <UIcon
          name="i-lucide-image"
          class="h-12 w-12 text-gray-300"
        />
      </div>

      <!-- In Week Plan Indicator -->
      <div
        v-if="isInPlan"
        class="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/20"
        :title="`${totalServings} portioner i veckoplanen`"
      >
        {{ totalServings }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="line-clamp-1 text-base font-bold tracking-tight text-slate-100">
        {{ recipe.title }}
      </h3>

      <!-- Meta: Time, Rating, Price -->
      <div class="mt-3 flex items-center gap-4 text-sm">
        <!-- Time -->
        <div class="flex items-center gap-1.5 text-gray-400">
          <UIcon
            name="i-lucide-clock"
            class="h-4 w-4"
          />
          <span class="text-xs">{{ totalTime }} min</span>
        </div>

        <!-- Rating -->
        <div
          v-if="recipe.rating"
          class="flex items-center gap-0.5 text-amber-400"
        >
          <template
            v-for="i in fullStars"
            :key="'full-' + i"
          >
            <UIcon
              name="i-lucide-star"
              class="h-3.5 w-3.5 fill-current"
            />
          </template>
          <UIcon
            v-if="hasHalfStar"
            name="i-lucide-star-half"
            class="h-3.5 w-3.5 fill-current"
          />
          <template
            v-for="i in emptyStars"
            :key="'empty-' + i"
          >
            <UIcon
              name="i-lucide-star"
              class="h-3.5 w-3.5 opacity-30"
            />
          </template>
          <span class="ml-0.5 text-xs text-gray-500">{{ recipe.rating.toFixed(1) }}</span>
        </div>
        <div
          v-else
          class="flex items-center gap-1 text-xs text-gray-600"
        >
          <UIcon
            name="i-lucide-star"
            class="h-3.5 w-3.5"
          />
          <span>Ingen rating</span>
        </div>

        <!-- Price per serving -->
        <div class="ml-auto flex items-center gap-1 text-xs text-gray-500">
          <UIcon
            name="i-lucide-receipt"
            class="h-3.5 w-3.5"
          />
          <span>— kr/port</span>
        </div>
      </div>

      <!-- Week Plan Entries (when in plan) -->
      <div
        v-if="isInPlan"
        class="mt-3 space-y-1"
      >
        <div
          v-for="entry in weekPlanEntries"
          :key="entry.id"
          class="flex items-center justify-between rounded bg-emerald-50 px-2 py-1 text-xs"
        >
          <span class="text-emerald-700">
            {{ days[entry.dayOfWeek || 0] }} · {{ entry.servings }} portioner
          </span>
          <button
            class="text-emerald-500 hover:text-red-500"
            @click.stop="handleRemove(entry.id)"
          >
            <UIcon
              name="i-lucide-x"
              class="h-3 w-3"
            />
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div
        v-if="showActions"
        class="mt-4 flex gap-2"
      >
        <UButton
          :to="`/recipes/${recipe.id}`"
          variant="outline"
          size="sm"
          block
        >
          Visa
        </UButton>
        <UButton
          v-if="!isInPlan"
          color="primary"
          size="sm"
          icon="i-lucide-plus"
          @click="handleAddToPlan"
        >
          Lägg till
        </UButton>
        <UButton
          v-else
          color="emerald"
          size="sm"
          icon="i-lucide-check"
          @click="handleAddToPlan"
        >
          Lägg till mer
        </UButton>
      </div>
    </div>

    <!-- Servings Picker Modal -->
    <UModal
      v-model:open="showServingsPicker"
      title="Lägg till i veckoplanen"
      size="sm"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">Dag</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(day, idx) in days"
              :key="day"
              class="rounded-lg px-3 py-2 text-sm transition-colors"
              :class="selectedDay === idx
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              @click="selectedDay = idx"
            >
              {{ day }}
            </button>
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">Antal portioner</label>
          <div class="flex items-center gap-3">
            <UButton
              variant="outline"
              size="sm"
              :disabled="selectedServings <= 1"
              @click="selectedServings--"
            >
              -
            </UButton>
            <span class="w-12 text-center text-xl font-bold">{{ selectedServings }}</span>
            <UButton
              variant="outline"
              size="sm"
              @click="selectedServings++"
            >
              +
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            @click="showServingsPicker = false"
          >
            Avbryt
          </UButton>
          <UButton
            color="primary"
            @click="confirmAddToPlan"
          >
            <UIcon
              name="i-lucide-plus"
              class="mr-1 h-4 w-4"
            />
            Lägg till
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
