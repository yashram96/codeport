<template>
  <div>
    <div class="flex justify-between items-center mb-6 relative">
      <h2 class="text-2xl font-bold text-slate-900">Settings</h2>
      <div class="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2">
        <span v-if="showSavedMessage" class="text-sm text-green-600 flex items-center">
          Settings saved successfully
        </span>
        <span v-if="hasChanges" class="text-sm text-amber-600">
          You have unsaved changes
        </span>
      </div>
      <button
        v-if="isAdmin"
        @click="saveSettings"
        class="btn-primary"
        :class="{ 'opacity-50': isSaving }"
        :disabled="isSaving">
        <span v-if="isSaving">Saving...</span>
        <span v-else>Save Changes</span>
      </button>
    </div>

    <div v-if="settings" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Git Repositories -->
      <div class="card">
        <div class="p-4 border-b border-slate-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-slate-900">Git Repositories</h3>
            <button
              v-if="isAdmin"
              @click="addRepository"
              class="btn-secondary text-sm"
            >
              Add Repository
            </button>
          </div>
        </div>
        <div class="p-4">
          <div v-for="(repo, index) in settings.repositories" :key="repo.id" class="mb-4">
            <div class="card border-slate-200 p-4">
              <div class="flex justify-between items-start">
                <div class="flex-grow space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700">Repository Name</label>
                    <input
                      v-model="repo.name"
                      type="text"
                      class="input mt-1 block w-full"
                      :readonly="!isAdmin"
                      :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                      :disabled="!isAdmin"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700">Git URL</label>
                    <input
                      v-model="repo.url"
                      type="text"
                      class="input mt-1 block w-full"
                      :readonly="!isAdmin"
                      :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                      :disabled="!isAdmin"
                      placeholder="https://github.com/username/repo.git"
                    />
                  </div>
                </div>
                <button
                  v-if="isAdmin"
                  @click="removeRepository(index)"
                  class="text-red-600 hover:text-red-800 ml-4"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Deployment Hosts -->
      <div class="card">
        <div class="p-4 border-b border-slate-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-slate-900">Deployment Hosts</h3>
            <button
              v-if="isAdmin"
              @click="addHost"
              class="btn-secondary text-sm"
            >
              Add Host
            </button>
          </div>
        </div>
        <div class="p-4">
          <div v-for="(host, index) in settings.hosts" :key="host.id" class="mb-4">
            <div class="card border-slate-200 p-4">
              <div class="flex justify-between items-start">
                <div class="flex-grow">
                  <label class="block text-sm font-medium text-slate-700">Host Name</label>
                  <input
                    v-model="host.name"
                    type="text"
                    class="input mt-1 block w-full"
                    :readonly="!isAdmin"
                    :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                    :disabled="!isAdmin"
                  />
                </div>
                <button
                  v-if="isAdmin"
                  @click="removeHost(index)"
                  class="text-red-600 hover:text-red-800 ml-4"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div class="card">
        <div class="p-4 border-b border-slate-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-slate-900">User Management</h3>
            <button
              v-if="isAdmin"
              @click="addUser"
              class="btn-secondary text-sm"
            >
              Add User
            </button>
          </div>
        </div>
        <div class="p-4">
          <div v-for="(user, index) in users" :key="user.id" class="mb-4">
            <div class="card border-slate-200 p-4">
              <div class="flex justify-between items-start">
                <div class="flex-grow space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-slate-700">Username</label>
                    <input
                      v-model="user.username"
                      type="text"
                      class="input mt-1 block w-full"
                      :readonly="!isAdmin"
                      :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                      :disabled="!isAdmin"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700">Role</label>
                    <select
                      v-model="user.role"
                      class="input mt-1 block w-full"
                      :disabled="!isAdmin"
                      :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div v-if="isAdmin">
                    <label class="block text-sm font-medium text-slate-700">New Password</label>
                    <input
                      v-model="user.newPassword"
                      type="password"
                      class="input mt-1 block w-full"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                </div>
                <button
                  v-if="isAdmin && users.length > 1"
                  @click="removeUser(index)"
                  class="text-red-600 hover:text-red-800 ml-4"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { isEqual, cloneDeep } from 'lodash-es';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  newPassword?: string;
}

const { $auth } = useNuxtApp();
const isAdmin = computed(() => $auth.isAdmin());

const defaultSettings = {
  repositories: [],
  hosts: []
};

const originalSettings = ref(cloneDeep(defaultSettings));
const settings = ref(cloneDeep(defaultSettings));
const users = ref<User[]>([]);
const isSaving = ref(false);
const showSavedMessage = ref(false);

const hasChanges = computed(() => {
  return !isEqual(settings.value, originalSettings.value) || 
         users.value.some(user => user.newPassword);
});

// Load settings and users
onMounted(async () => {
  if (process.client) {
    try {
      const [settingsResponse, usersResponse] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users')
      ]);

      if (settingsResponse.ok) {
        const data = await settingsResponse.json();
        settings.value = data;
        originalSettings.value = cloneDeep(data);
      }

      if (usersResponse.ok) {
        users.value = await usersResponse.json();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
});

// Navigation guard
onBeforeRouteLeave((to, from, next) => {
  if (hasChanges.value) {
    if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});

// Repository functions
const addRepository = () => {
  settings.value.repositories.push({
    id: `repo-${Date.now()}`,
    name: 'New Repository',
    url: ''
  });
};

const removeRepository = (index: number) => {
  settings.value.repositories.splice(index, 1);
};

// Host functions
const addHost = () => {
  settings.value.hosts.push({
    id: `host-${Date.now()}`,
    name: 'New Host'
  });
};

const removeHost = (index: number) => {
  settings.value.hosts.splice(index, 1);
};

// User functions
const addUser = () => {
  users.value.push({
    id: `user-${Date.now()}`,
    username: '',
    role: 'user'
  });
};

const removeUser = (index: number) => {
  users.value.splice(index, 1);
};

// Save all settings
const saveSettings = async () => {
  if (!isAdmin.value) return;
  
  isSaving.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('No auth token');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Save settings
    await fetch('/api/settings', {
      method: 'POST',
      headers,
      body: JSON.stringify(settings.value)
    });

    // Save users
    await fetch('/api/users', {
      method: 'POST',
      headers,
      body: JSON.stringify(users.value)
    });

    originalSettings.value = cloneDeep(settings.value);
    showSavedMessage.value = true;
    setTimeout(() => {
      showSavedMessage.value = false;
    }, 3000);

    // Clear any new passwords
    users.value.forEach(user => {
      delete user.newPassword;
    });
  } catch (error) {
    console.error('Error saving:', error);
    alert('Failed to save changes');
  } finally {
    isSaving.value = false;
  }
};
</script>