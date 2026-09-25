// ============================================
// Foodflow - Auth Type Declarations
// ============================================

declare module '#auth-utils' {
  interface User {
    id: string
    sub: string
    email: string
    name: string
    accessToken?: string
    refreshToken?: string
    idToken?: string
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
