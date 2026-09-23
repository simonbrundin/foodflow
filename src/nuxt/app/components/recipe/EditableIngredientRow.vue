<script setup lang="ts">
import type { RecipeIngredient } from '~/types'

interface Props {
  ingredient: RecipeIngredient
  scaledAmount?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [id: string, updates: Partial<RecipeIngredient>]
  remove: [id: string]
}>()

// Local editable state
const isEditing = ref(false)
const editedAmount = ref(props.ingredient.amount)
const editedUnit = ref(props.ingredient.unit)
const editedNotes = ref(props.ingredient.notes || '')

// Debounced save (like Dinnia's v-debounce directive)
const { debouncedFn, isPending } = useDebounceFn(async () => {
  emit('update', props.ingredient.id, {
    amount: editedAmount.value,
    unit: editedUnit.value,
    notes: editedNotes.value || undefined
  })
}, 1000)

function startEdit() {
  isEditing.value = true
  editedAmount.value = props.ingredient.amount
  editedUnit.value = props.ingredient.unit
  editedNotes.value = props.ingredient.notes || ''
}

function saveAndClose() {
  debouncedFn.flush()
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  // Reset to original values
  editedAmount.value = props.ingredient.amount
  editedUnit.value = props.ingredient.unit
  editedNotes.value = props.ingredient.notes || ''
}

function handleAmountChange() {
  debouncedFn()
}

function handleRemove() {
  emit('remove', props.ingredient.id)
}

// Units dropdown options
const unitOptions = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'st', label: 'st' },
  { value: 'msk', label: 'msk' },
  { value: 'tsk', label: 'tsk' },
  { value: 'krm', label: 'krm' }
]
</script>

<template>
  <div class="group relative">
    <!-- Normal View -->
    <div
      v-if="!isEditing"
      class="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
      @click="startEdit"
    >
      <UIcon
        name="i-lucide-check-circle"
        class="mt-1 h-5 w-5 flex-shrink-0 text-emerald-500"
      />

      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ scaledAmount || ingredient.amount }}</span>
          <span class="text-gray-600">{{ ingredient.unit }}</span>
          <span class="text-gray-800">{{ ingredient.ingredientTypeName || ingredient.ingredientTypeId }}</span>
        </div>
        <span
          v-if="ingredient.notes"
          class="text-sm text-gray-400"
        >({{ ingredient.notes }})</span>
      </div>

      <!-- Saving indicator -->
      <div
        v-if="isPending"
        class="flex items-center text-xs text-amber-500"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="h-4 w-4 animate-spin"
        />
        <span class="ml-1">Sparar...</span>
      </div>

      <!-- Hover actions -->
      <div class="opacity-0 transition-opacity group-hover:opacity-100">
        <UButton
          variant="ghost"
          size="xs"
          color="error"
          @click.stop="handleRemove"
        >
          <UIcon
            name="i-lucide-trash-2"
            class="h-4 w-4"
          />
        </UButton>
      </div>
    </div>

    <!-- Edit View -->
    <div
      v-else
      class="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">Redigerar ingrediens</span>
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            size="xs"
            @click="cancelEdit"
          >
            Avbryt
          </UButton>
          <UButton
            color="primary"
            size="xs"
            @click="saveAndClose"
          >
            Spara
          </UButton>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <!-- Amount -->
        <div class="flex items-center gap-2">
          <UInput
            v-model.number="editedAmount"
            type="number"
            size="sm"
            class="w-24"
            min="0"
            step="0.5"
            @input="handleAmountChange"
          />

          <!-- Unit selector -->
          <USelect
            v-model="editedUnit"
            :items="unitOptions"
            size="sm"
            class="w-20"
            @change="handleAmountChange"
          />

          <span class="text-gray-600">{{ ingredient.ingredientTypeName || ingredient.ingredientTypeId }}</span>
        </div>

        <!-- Notes -->
        <UInput
          v-model="editedNotes"
          placeholder="T.ex. finhackad, i klyftor..."
          size="sm"
          @input="handleAmountChange"
        />
      </div>

      <!-- Pending indicator -->
      <div
        v-if="isPending"
        class="mt-2 flex items-center text-xs text-amber-500"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="h-4 w-4 animate-spin"
        />
        <span class="ml-1">Automatiskt sparande...</span>
      </div>
    </div>
  </div>
</template>
