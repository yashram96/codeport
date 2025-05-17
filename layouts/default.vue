<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <header class="bg-white shadow">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 class="text-xl font-semibold text-slate-900">Deployment Dashboard</h1>
        <div v-if="isAuthenticated" class="flex items-center space-x-6">
          <NuxtLink 
            to="/" 
            class="text-sm text-slate-600 hover:text-slate-900"
          >
            Dashboard
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