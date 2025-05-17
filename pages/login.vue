<template>
  <div class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600">
          Use your credentials to access the deployment dashboard
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="card p-6 space-y-6">
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {{ error }}
          </div>
          
          <div>
            <label for="username" class="block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="input mt-1 block w-full"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="input mt-1 block w-full"
              placeholder="Enter your password"
            />
          </div>
          
          <div>
            <button
              type="submit"
              class="btn-primary w-full"
              :disabled="isLoading"
              :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
            >
              <span v-if="isLoading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
              <span v-else>Sign in</span>
            </button>
          </div>
        </div>
        
        <div class="text-center text-sm">
          <p class="text-slate-600">
            Default credentials:<br>
            Admin: admin / admin123<br>
            Read-only: user / user123
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const { $auth } = useNuxtApp();

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;
  
  try {
    if (!username.value || !password.value) {
      error.value = 'Please enter both username and password';
      return;
    }

    const success = await $auth.login(username.value, password.value);
    
    if (success) {
      router.push('/');
    } else {
      error.value = 'Invalid username or password';
      password.value = ''; // Clear password on failed attempt
    }
  } catch (e) {
    error.value = 'An error occurred during login';
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};
</script>