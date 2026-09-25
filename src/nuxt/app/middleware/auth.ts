/**
 * Auth middleware - protects routes requiring authentication
 *
 * In development mode, auth is bypassed for easier testing.
 * In production, unauthenticated users are redirected to login.
 */
export default defineNuxtRouteMiddleware((to) => {
  // Skip auth in development mode
  if (process.env.NODE_ENV === 'development') {
    return
  }

  const { user } = useUserSession()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/api/health',
    '/api/auth/zitadel'
  ]

  // Check if the current route is public
  if (publicRoutes.some(route => to.path === route || to.path.startsWith(route + '/'))) {
    return
  }

  // Redirect to login if not authenticated
  if (!user.value) {
    return navigateTo('/login')
  }
})
