/**
 * Debounce a function call
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds (default 1000ms)
 */
export function useDebounceFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 1000
) {
  const timeoutId = ref<NodeJS.Timeout | null>(null)
  const isPending = ref(false)

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
    }

    isPending.value = true
    timeoutId.value = setTimeout(() => {
      fn(...args)
      isPending.value = false
    }, delay)
  }

  // Cancel any pending debounce
  const cancel = () => {
    if (timeoutId.value) {
      clearTimeout(timeoutId.value)
      timeoutId.value = null
      isPending.value = false
    }
  }

  // Flush immediately
  const flush = (...args: Parameters<T>) => {
    cancel()
    fn(...args)
  }

  onUnmounted(() => cancel())

  return {
    debouncedFn,
    isPending: readonly(isPending),
    cancel,
    flush
  }
}

/**
 * Reactive debounced value
 * @param initialValue - The initial value
 * @param delay - Delay in milliseconds (default 1000ms)
 */
export function useDebouncedRef<T>(initialValue: T, delay = 1000) {
  const value = ref(initialValue) as Ref<T>
  const debouncedValue = ref(initialValue) as Ref<T>
  let timeoutId: NodeJS.Timeout | null = null

  watch(value, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return {
    value,
    debouncedValue: readonly(debouncedValue)
  }
}
