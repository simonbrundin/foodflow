<script setup lang="ts">
import type { StoreProduct, ProductMapping } from '~/types'

interface Props {
  storeId: string
  searchQuery: string
  selectedProductId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [product: StoreProduct]
  close: []
}>()

interface ProductResult {
  id: string
  name: string
  brand: string | null
  category: string | null
  price: number
  unit: string
  pricePerKg: number
  imageUrl: string | null
}

const { data: products, pending } = await useFetch<ProductResult[]>('/api/stores/search', {
  method: 'POST',
  body: {
    storeId: props.storeId,
    searchQuery: props.searchQuery
  }
})

function formatPrice(price: number): string {
  return price.toFixed(2) + ' kr'
}
</script>

<template>
  <div class="rounded-lg border bg-white shadow-lg">
    <!-- Header -->
    <div class="flex items-center justify-between border-b px-4 py-3">
      <h3 class="font-semibold text-gray-900">Välj produkt</h3>
      <button
        class="rounded p-1 hover:bg-gray-100"
        @click="emit('close')"
      >
        <UIcon name="i-lucide-x" class="h-5 w-5 text-gray-500" />
      </button>
    </div>

    <!-- Search results -->
    <div class="max-h-80 overflow-y-auto">
      <div v-if="pending" class="p-4 text-center text-gray-500">
        Söker...
      </div>
      
      <div v-else-if="!products || products.length === 0" class="p-4 text-center text-gray-500">
        Inga produkter hittades
      </div>
      
      <div v-else class="divide-y divide-gray-100">
        <button
          v-for="product in products"
          :key="product.id"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
          :class="{ 'bg-emerald-50': product.id === selectedProductId }"
          @click="emit('select', product)"
        >
          <!-- Product image placeholder -->
          <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <UIcon v-if="!product.imageUrl" name="i-lucide-package" class="h-6 w-6 text-gray-400" />
            <img v-else :src="product.imageUrl" class="h-12 w-12 rounded-lg object-cover" />
          </div>

          <!-- Product info -->
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-gray-900">
              {{ product.name }}
            </p>
            <p v-if="product.brand" class="text-sm text-gray-500">
              {{ product.brand }}
            </p>
            <p v-if="product.category" class="text-xs text-gray-400">
              {{ product.category }}
            </p>
          </div>

          <!-- Price info -->
          <div class="text-right">
            <p class="font-medium text-gray-900">{{ formatPrice(product.price) }}</p>
            <p class="text-xs text-gray-500">{{ product.unit }}</p>
            <p class="text-xs text-emerald-600">
              {{ formatPrice(product.pricePerKg) }}/kg
            </p>
          </div>

          <!-- Selected indicator -->
          <UIcon
            v-if="product.id === selectedProductId"
            name="i-lucide-check-circle"
            class="h-5 w-5 flex-shrink-0 text-emerald-500"
          />
        </button>
      </div>
    </div>
  </div>
</template>
