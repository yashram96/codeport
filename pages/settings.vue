<template>
  <div>
    <div class="flex justify-between items-center mb-6 relative">
      <h2 class="text-2xl font-bold text-slate-900">Settings</h2>
      <div class="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2">
        <span v-if="showSavedMessage" class="text-sm text-green-600 flex items-center">
          <svg class="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          Settings saved
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
        <span v-if="isSaving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </span>
        <span v-else>Save Changes</span>
      </button>
    </div>

    <div v-if="settings" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Repositories -->
      <div class="card">
        <div class="p-4 border-b border-slate-200">
          <h3 class="text-lg font-medium text-slate-900">Repositories</h3>
        </div>
        <div class="p-4">
          <div v-for="(repo, index) in settings.repositories" :key="repo.id" class="mb-4">
            <div class="flex items-start space-x-4">
              <div class="flex-grow space-y-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    v-model="repo.name"
                    :type="isAdmin ? 'text' : 'text'"
                    class="input mt-1 block w-full"
                    :readonly="!isAdmin"
                    :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                    :disabled="!isAdmin"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700">URL</label>
                  <input
                    v-model="repo.url"
                    :type="isAdmin ? 'text' : 'text'"
                    class="input mt-1 block w-full"
                    :readonly="!isAdmin"
                    :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                    :disabled="!isAdmin"
                  />
                </div>
              </div>
              <button
                v-if="isAdmin"
                @click="removeRepository(index)"
                class="text-red-600 hover:text-red-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <button
            v-if="isAdmin"
            @click="addRepository"
            class="btn-secondary mt-4 w-full"
          >
            Add Repository
          </button>
        </div>
      </div>

      <!-- Hosts -->
      <div class="card">
        <div class="p-4 border-b border-slate-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-slate-900">Hosts</h3>
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
              <div class="flex justify-between items-start mb-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    v-model="host.name"
                    type="text"
                    class="input mt-1 block w-64"
                    :readonly="!isAdmin"
                    :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                    :disabled="!isAdmin"
                  />
                </div>
                <button
                  v-if="isAdmin"
                  @click="removeHost(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Available Scripts</label>
                <div class="space-y-2">
                  <div
                    v-for="script in availableScripts"
                    :key="script.id"
                    class="flex items-center"
                  >
                    <input
                      :id="`script-${host.id}-${script.id}`"
                      type="checkbox"
                      :value="script.id"
                      v-model="host.scripts"
                      class="h-4 w-4 text-blue-600 border-slate-300 rounded"
                      :disabled="!isAdmin"
                    />
                    <label
                      :for="`script-${host.id}-${script.id}`"
                      class="ml-2 block text-sm text-slate-700"
                    >
                      {{ script.name }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scripts -->
      <div class="space-y-6">
        <div class="card">
        <div class="p-4 border-b border-slate-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-slate-900">Deploy Scripts</h3>
            <button
              v-if="isAdmin"
              @click="addScript"
              class="btn-secondary text-sm"
            >
              Add Script
            </button>
          </div>
        </div>
        <div class="p-4">
          <div v-for="(script, index) in settings.scripts" :key="script.id" class="mb-4">
            <div class="card border-slate-200 p-4">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700">Name</label>
                  <input
                    v-model="script.name"
                    type="text"
                    class="input mt-1 block w-64"
                    :readonly="!isAdmin"
                    :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                    :disabled="!isAdmin"
                  />
                </div>
                <button
                  v-if="isAdmin"
                  @click="removeScript(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700">Path</label>
                <input
                  v-model="script.path"
                  type="text"
                  class="input mt-1 block w-full"
                  :readonly="!isAdmin"
                  :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
                  :disabled="!isAdmin"
                />
                <button
                  @click="editScript(script)"
                  class="btn-secondary text-sm mt-2"
                >
                  Edit Script
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        
        <!-- Script Editor -->
        <ScriptEditor
          :script="selectedScript"
          :is-admin="isAdmin"
          @script-saved="handleScriptSaved"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { isEqual } from 'lodash-es';
import type { Settings, Script } from '~/utils/types';

const { $auth } = useNuxtApp();
const isAdmin = computed(() => $auth.isAdmin());

const defaultSettings: Settings = {
  repositories: [],
  hosts: [],
  scripts: []
};

const originalSettings = ref<Settings>(structuredClone(defaultSettings));
const settings = ref<Settings>(structuredClone(defaultSettings));
const isSaving = ref(false);
const showSavedMessage = ref(false);
const selectedScript = ref<Script | undefined>();

const availableScripts = computed(() => settings.value.scripts);

// Use lodash isEqual for deep comparison instead of JSON.stringify
const hasChanges = computed(() => {
  return !isEqual(settings.value, originalSettings.value);
});

// Load settings
onMounted(async () => {
  if (process.client) {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        settings.value = data;
        originalSettings.value = structuredClone(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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
    id: `repo${Date.now()}`,
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
    id: `host${Date.now()}`,
    name: 'New Host',
    scripts: []
  });
};

const removeHost = (index: number) => {
  settings.value.hosts.splice(index, 1);
};

// Script functions
const addScript = () => {
  settings.value.scripts.push({
    id: `script${Date.now()}`,
    name: 'New Script',
    path: './deploy-scripts/new-script.sh'
  });
};

const removeScript = (index: number) => {
  settings.value.scripts.splice(index, 1);
};

const editScript = (script: Script) => {
  selectedScript.value = script;
};

const handleScriptSaved = () => {
  showSavedMessage.value = true;
  setTimeout(() => {
    showSavedMessage.value = false;
  }, 3000);
};

// Save settings
const saveSettings = async () => {
  if (!isAdmin.value) return;
  
  isSaving.value = true;
  try {
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(settings.value)
    });
    
    if (response.ok) {
      originalSettings.value = structuredClone(settings.value);
      showSavedMessage.value = true;
      setTimeout(() => {
        showSavedMessage.value = false;
      }, 3000);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
  } finally {
    isSaving.value = false;
  }
};
</script>