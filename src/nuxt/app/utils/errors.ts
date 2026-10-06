export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message

  if (typeof error === 'object' && error !== null) {
    const responseError = error as {
      data?: { message?: unknown }
      message?: unknown
    }

    if (typeof responseError.data?.message === 'string') {
      return responseError.data.message
    }

    if (typeof responseError.message === 'string') {
      return responseError.message
    }
  }

  return fallback
}
