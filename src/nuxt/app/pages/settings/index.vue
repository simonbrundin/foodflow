<script setup lang="ts">
const tabs = [
  { label: 'Allmänt', to: '/settings', icon: 'i-lucide-settings' },
  { label: 'Butiker', to: '/settings/stores', icon: 'i-lucide-store' },
  { label: 'Mappningar', to: '/settings/mappings', icon: 'i-lucide-link' }
]

// API Key settings
const showApiKey = ref(false)
const apiKeyInput = ref('')
const isSaving = ref(false)
const saveMessage = ref('')

// Load current settings
const { data: settings, refresh: refreshSettings } = await useFetch('/api/settings')

// Check if OpenAI key is configured
const hasApiKey = computed(() => {
  return settings.value?.openai_api_key?.value !== undefined
})

const maskedApiKey = computed(() => {
  return settings.value?.openai_api_key?.value || ''
})

async function saveApiKey() {
  if (!apiKeyInput.value.trim()) return
  
  isSaving.value = true
  saveMessage.value = ''
  
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: {
        key: 'openai_api_key',
        value: apiKeyInput.value.trim(),
        description: 'OpenAI API-nyckel för AI-receptimport'
      }
    })
    
    saveMessage.value = 'Nyckeln sparad!'
    apiKeyInput.value = ''
    showApiKey.value = false
    await refreshSettings()
  } catch (e: any) {
    saveMessage.value = `Fel: ${e.message}`
  } finally {
    isSaving.value = false
  }
}

async function testApiKey() {
  isSaving.value = true
  saveMessage.value = 'Testar...'
  
  try {
    await $fetch('/api/recipes/parse-ai', {
      method: 'POST',
      body: { text: 'Test' }
    })
    saveMessage.value = 'Nyckeln fungerar!'
  } catch (e: any) {
    saveMessage.value = `Test misslyckades: ${e.data?.message || e.message}`
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Inställningar</h1>
      <p class="mt-1 text-sm text-gray-500">
        Hantera dina butiker, produktmappningar och inställningar
      </p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-200">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
        :class="[
          $route.path === tab.to
            ? 'border-b-2 border-emerald-500 text-emerald-600'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        <UIcon :name="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </NuxtLink>
    </div>

    <!-- API Key Card -->
    <UCard>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <UIcon name="i-lucide-key" class="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900">OpenAI API-nyckel</h3>
              <p class="text-sm text-gray-500">För AI-parsning av importerade recept</p>
            </div>
          </div>
          
          <UBadge
            :color="hasApiKey ? 'emerald' : 'amber'"
            variant="soft"
          >
            {{ hasApiKey ? 'Konfigurerad' : 'Ej konfigurerad' }}
          </UBadge>
        </div>
        
        <!-- Masked key display -->
        <div v-if="hasApiKey && !showApiKey" class="flex items-center gap-2">
          <code class="flex-1 rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-600">
            {{ maskedApiKey }}
          </code>
          <UButton variant="outline" size="sm" @click="showApiKey = true">
            Ändra
          </UButton>
        </div>
        
        <!-- Save new key form -->
        <div v-if="showApiKey || !hasApiKey" class="space-y-3">
          <UInput
            v-model="apiKeyInput"
            type="password"
            placeholder="sk-..."
            class="w-full font-mono"
          />
          <div class="flex items-center gap-2">
            <UButton
              color="primary"
              :loading="isSaving"
              :disabled="!apiKeyInput.trim()"
              @click="saveApiKey"
            >
              Spara nyckel
            </UButton>
            <UButton
              v-if="hasApiKey"
              variant="ghost"
              @click="showApiKey = false"
            >
              Avbryt
            </UButton>
            <UButton
              v-if="hasApiKey"
              variant="outline"
              size="sm"
              @click="testApiKey"
            >
              Testa
            </UButton>
          </div>
        </div>
        
        <!-- Status message -->
        <UAlert v-if="saveMessage" color="info" variant="soft">
          {{ saveMessage }}
        </UAlert>
        
        <!-- Help text -->
        <p class="text-xs text-gray-400">
          Få en API-nyckel på 
          <a href="https://platform.openai.com/api-keys" target="_blank" class="underline">
            platform.openai.com
          </a>
        </p>
      </div>
    </UCard>

    <!-- Quick links -->
    <UCard>
      <div class="py-4 text-center">
        <h3 class="text-lg font-medium text-gray-900">Snabblänkar</h3>
        <div class="mt-4 flex justify-center gap-3">
          <NuxtLink to="/settings/stores">
            <UButton variant="outline">
              <UIcon name="i-lucide-store" class="mr-2 h-4 w-4" />
              Hantera butiker
            </UButton>
          </NuxtLink>
          <NuxtLink to="/settings/mappings">
            <UButton variant="outline">
              <UIcon name="i-lucide-link" class="mr-2 h-4 w-4" />
              Produktmappningar
            </UButton>
          </NuxtLink>
        </div>
      </div>
    </UCard>

    <!-- Info Card -->
    <UCard class="border-blue-200 bg-blue-50">
      <div class="flex gap-4">
        <UIcon name="i-lucide-info" class="h-6 w-6 flex-shrink-0 text-blue-600" />
        <div>
          <h4 class="font-medium text-blue-900">Om Foodflow</h4>
          <p class="mt-1 text-sm text-blue-700">
            Foodflow är en meal kit-applikation för att planera veckans middagar
            och skapa inköpslistor. Välj recept, koppla ingredienser till produkter
            i din favoritbutik, och handla smart!
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
