<script setup lang="ts">
import type { ShoppingCart } from '~/types'

const { data: cart, pending, refresh } = await useFetch<ShoppingCart>('/api/cart')

const groupedItems = computed(() => {
  if (!cart.value?.items) return {}
  
  // Group by ingredient category
  return cart.value.items.reduce((acc, item) => {
    const key = item.ingredientTypeName?.charAt(0).toUpperCase() || 'Ö'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, typeof cart.value.items>)
})

function updateQuantity(itemId: string, delta: number) {
  // Would call PUT /api/cart/items/:id
  console.log('Update quantity:', itemId, delta)
}

function removeItem(itemId: string) {
  // Would call DELETE /api/cart/items/:id
  console.log('Remove item:', itemId)
  refresh()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Varukorg</h1>
        <p v-if="cart?.storeName" class="text-sm text-gray-500">
          Från {{ cart.storeName }}
        </p>
      </div>
      <UButton variant="outline" size="sm">
        <UIcon name="i-lucide-edit" class="mr-2 h-4 w-4" />
        Redigera
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <USkeleton v-for="i in 5" :key="i" class="h-20 rounded-lg" />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="!cart || cart.items?.length === 0">
      <div class="py-12 text-center">
        <UIcon name="i-lucide-shopping-cart" class="mx-auto h-16 w-16 text-gray-300" />
        <h3 class="mt-4 text-lg font-medium text-gray-900">Din varukorg är tom</h3>
        <p class="mt-2 text-sm text-gray-500">
          Välj recept för veckan och skapa en inköpslista
        </p>
        <UButton to="/week-plan" color="primary" class="mt-4">
          Gå till veckoplanering
        </UButton>
      </div>
    </UCard>

    <!-- Cart Content -->
    <div v-else class="grid gap-6 lg:grid-cols-3">
      <!-- Items List -->
      <div class="lg:col-span-2 space-y-4">
        <UCard
          v-for="(items, letter) in groupedItems"
          :key="letter"
        >
          <template #header>
            <h2 class="text-lg font-semibold">{{ letter }}</h2>
          </template>

          <div class="divide-y divide-gray-100">
            <div
              v-for="item in items"
              :key="item.id"
              class="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <!-- Product Image Placeholder -->
              <div class="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                <UIcon name="i-lucide-package" class="h-8 w-8 text-gray-400" />
              </div>

              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <p class="truncate text-sm font-medium text-gray-900">
                  {{ item.storeProductName }}
                </p>
                <p v-if="item.brand" class="text-xs text-gray-500">
                  {{ item.brand }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ item.pricePerUnit.toFixed(2) }} kr/{{ item.unit === 'g' || item.unit === 'ml' ? item.unit : 'st' }}
                </p>
              </div>

              <!-- Quantity Controls -->
              <div class="flex items-center gap-2">
                <UButton
                  variant="outline"
                  size="xs"
                  :disabled="item.quantity <= 0.5"
                  @click="updateQuantity(item.id, -0.5)"
                >
                  -
                </UButton>
                <span class="w-16 text-center text-sm font-medium">
                  {{ item.quantity.toFixed(item.quantity < 1 ? 1 : 0) }} {{ item.unit }}
                </span>
                <UButton
                  variant="outline"
                  size="xs"
                  @click="updateQuantity(item.id, 0.5)"
                >
                  +
                </UButton>
              </div>

              <!-- Price -->
              <div class="w-20 text-right">
                <p class="font-medium text-gray-900">{{ item.totalPrice.toFixed(2) }} kr</p>
              </div>

              <!-- Remove -->
              <UButton
                variant="ghost"
                size="xs"
                color="error"
                @click="removeItem(item.id)"
              >
                <UIcon name="i-lucide-trash-2" class="h-4 w-4" />
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-1">
        <UCard class="sticky top-4">
          <template #header>
            <h2 class="text-lg font-semibold">Sammanfattning</h2>
          </template>

          <div class="space-y-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Antal varor</span>
              <span class="font-medium">{{ cart.items?.length || 0 }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Artiklar</span>
              <span class="font-medium">{{ Object.keys(groupedItems).length }}</span>
            </div>
            <UDivider />
            <div class="flex justify-between">
              <span class="text-lg font-semibold">Totalt</span>
              <span class="text-lg font-bold text-emerald-600">
                {{ cart.totalPrice.toFixed(2) }} kr
              </span>
            </div>
          </div>

          <template #footer>
            <div class="space-y-2">
              <UButton color="primary" class="w-full" block>
                <UIcon name="i-lucide-external-link" class="mr-2 h-4 w-4" />
                Öppna i butiken
              </UButton>
              <UButton variant="outline" class="w-full" block>
                <UIcon name="i-lucide-copy" class="mr-2 h-4 w-4" />
                Kopiera lista
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>
