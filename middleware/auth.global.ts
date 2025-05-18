export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip authentication check on server side completely
  if (process.server) return;
  
  const nuxtApp = useNuxtApp();
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false);
  
  // Handle public pages that don't need authentication
  if (to.path === '/login') {
    // If already authenticated and trying to access login, redirect to home
    if (isAuthenticated.value === true) {
      return navigateTo('/');
    }
    return;
  }
  
  // For all other pages, verify authentication status after app is mounted
  await nuxtApp.hooks.callHook('app:mounted');
  
  try {
    const { isAuthenticated: authValid } = await nuxtApp.$auth.getAuthStatus();
    
    if (!authValid) {
      // If not authenticated, redirect to login
      isAuthenticated.value = false;
      return navigateTo('/login');
    }
    
    // User is authenticated
    isAuthenticated.value = true;
  } catch (error) {
    // Handle authentication check failure by redirecting to login
    console.error('Authentication check failed:', error);
    isAuthenticated.value = false;
    return navigateTo('/login');
  }
});