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

const difficultyConfig = {
  easy: { label: 'Lätt', color: 'text-green-600 bg-green-50' },
  medium: { label: 'Medel', color: 'text-amber-600 bg-amber-50' },
  hard: { label: 'Svår', color: 'text-red-600 bg-red-50' }
}

const difficulty = computed(() => difficultyConfig[props.recipe.difficulty])
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
</script>

<template>
  <UCard
    class="group overflow-hidden transition-all hover:shadow-lg"
    :class="{ 'ring-2 ring-emerald-500': isInPlan }"
  >
    <!-- Image -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-100">
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

      <!-- Difficulty Badge -->
      <div
        class="absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-medium"
        :class="difficulty.color"
      >
        {{ difficulty.label }}
      </div>

      <!-- In Week Plan Indicator (like Dinnia's cart indicator) -->
      <div
        v-if="isInPlan"
        class="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-lg"
        :title="`${totalServings} portioner i veckoplanen`"
      >
        {{ totalServings }}
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <h3 class="line-clamp-1 text-lg font-semibold text-gray-900">
        {{ recipe.title }}
      </h3>

      <p class="mt-1 line-clamp-2 text-sm text-gray-500">
        {{ recipe.description }}
      </p>

      <!-- Meta -->
      <div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <div class="flex items-center gap-1">
          <UIcon
            name="i-lucide-clock"
            class="h-4 w-4"
          />
          <span>{{ totalTime }} min</span>
        </div>
        <div class="flex items-center gap-1">
          <UIcon
            name="i-lucide-users"
            class="h-4 w-4"
          />
          <span>{{ recipe.servings }} portioner</span>
        </div>
      </div>

      <!-- Tags -->
      <div
        v-if="recipe.tags && recipe.tags.length > 0"
        class="mt-3 flex flex-wrap gap-1"
      >
        <UBadge
          v-for="tag in recipe.tags.slice(0, 3)"
          :key="tag"
          size="sm"
          variant="subtle"
          color="gray"
        >
          {{ tag }}
        </UBadge>
        <UBadge
          v-if="recipe.tags.length > 3"
          size="sm"
          variant="subtle"
          color="gray"
        >
          +{{ recipe.tags.length - 3 }}
        </UBadge>
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
