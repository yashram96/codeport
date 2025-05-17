export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip authentication check on server side completely
  if (process.server) return;
  
  const { $auth } = useNuxtApp();
  const isAuthenticated = useState<boolean>('isAuthenticated');
  
  // Handle public pages that don't need authentication
  if (to.path === '/login') {
    // If already authenticated and trying to access login, redirect to home
    if (isAuthenticated.value === true) {
      return navigateTo('/');
    }
    return;
  }
  
  // For all other pages, verify authentication status
  const { isAuthenticated: authValid } = await $auth.getAuthStatus();
  
  if (!authValid) {
    // If not authenticated, redirect to login
    isAuthenticated.value = false;
    return navigateTo('/login');
  }
  
  // User is authenticated
  isAuthenticated.value = true;
});