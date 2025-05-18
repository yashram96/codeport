<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <header class="bg-white shadow">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <div class="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <path d="M3.3 7l8.7 5 8.7-5"/>
                <path d="M12 22V12"/>
              </svg>
            </div>
            <div class="ml-3">
              <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CodePort</h1>
              <p class="text-xs text-slate-500">Deployment Platform</p>
            </div>
          </div>
        </div>
         <client-only>
        <div v-if="isAuthenticated" class="flex items-center space-x-6">
         
          <NuxtLink 
            to="/" 
            class="text-sm text-slate-600 hover:text-slate-900"
          >
            Dashboard
          </NuxtLink>
          
          <NuxtLink 
            to="/playbooks" 
            class="text-sm text-slate-600 hover:text-slate-900"
          >
            Playbooks
          </NuxtLink>
          
          <NuxtLink 
            to="/history" 
            class="text-sm text-slate-600 hover:text-slate-900"
          >
            History
          </NuxtLink>
          
          <NuxtLink 
            to="/settings" 
            class="text-sm text-slate-600 hover:text-slate-900"
          >
            Settings
          </NuxtLink>
          
          <span class="text-sm text-slate-600">
            Logged in as <span class="font-medium">{{ userRole === 'admin' ? 'Admin' : 'User' }}</span>
          </span>
          
          <button
            @click="handleSignOut"
            class="btn-secondary text-sm"
          >
            Sign Out
          </button>
            
        </div>
          </client-only>
      </nav>
    </header>
    
    <main class="flex-grow py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
    
    <footer class="bg-white border-t border-slate-200 py-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-sm text-center text-slate-500">
          Deployment Dashboard &copy; {{ new Date().getFullYear() }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
const { $auth } = useNuxtApp();
const router = useRouter();
const isAuthenticated = useState('isAuthenticated', () => false);
const userRole = useState('userRole', () => null);

const handleSignOut = () => {
  $auth.logout();
  router.push('/login');
};
</script>