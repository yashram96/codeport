<template>
  <div class="card">
    <div class="p-4 border-b border-slate-200">
      <h3 class="text-lg font-medium text-slate-900">Deploy Code</h3>
    </div>
    <div class="p-4">
      <form @submit.prevent="deploy">
        <div class="space-y-4">
          <!-- Repository Selection -->
          <div>
            <label for="repository" class="block text-sm font-medium text-slate-700 mb-1">
              Repository
            </label>
            <select
              id="repository"
              v-model="selectedRepository"
              class="input w-full"
              required
            >
              <option value="" disabled>Select repository</option>
              <option
                v-for="repo in repositories"
                :key="repo.id"
                :value="repo.id"
              >
                {{ repo.name }}
              </option>
            </select>
          </div>
          
          <!-- Host Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Hosts
            </label>
            <div class="space-y-2">
              <div
                v-for="host in hosts"
                :key="host.id"
                class="flex items-center"
              >
                <input
                  :id="`host-${host.id}`"
                  type="checkbox"
                  :value="host.id"
                  v-model="selectedHosts"
                  class="h-4 w-4 text-blue-600 border-slate-300 rounded"
                />
                <label :for="`host-${host.id}`" class="ml-2 block text-sm text-slate-700">
                  {{ host.name }}
                </label>
              </div>
            </div>
            <p v-if="selectedHosts.length === 0" class="mt-1 text-sm text-red-600">
              Please select at least one host
            </p>
          </div>
          
          <!-- Deploy Button -->
          <div class="pt-2">
            <button
              type="submit"
              class="btn-primary w-full"
              :disabled="isDeploying || !canDeploy || !hasWriteAccess"
              :class="{ 'opacity-50 cursor-not-allowed': isDeploying || !canDeploy || !hasWriteAccess }"
            >
              <span v-if="isDeploying" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying...
              </span>
              <span v-else>Deploy</span>
            </button>
            <p v-if="!hasWriteAccess" class="mt-2 text-sm text-amber-600">
              Read-only access. Deployment actions are disabled.
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Repository, Host } from '~/utils/types';

const props = defineProps<{
  repositories: Repository[];
  hosts: Host[];
}>();

const emit = defineEmits(['deployment-started', 'host-selected']);

const { $auth } = useNuxtApp();
const hasWriteAccess = computed(() => $auth.isAdmin());

const selectedRepository = ref('');
const selectedHosts = ref<string[]>([]);
const isDeploying = ref(false);

const canDeploy = computed(() => {
  return selectedRepository.value && selectedHosts.value.length > 0;
});

const deploy = async () => {
  if (!canDeploy.value || !hasWriteAccess.value) return;
  
  isDeploying.value = true;
  
  try {
    // Deploy to each selected host
    for (const hostId of selectedHosts.value) {
      const token = localStorage.getItem('auth_token') || '';
      
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hostId,
          repositoryId: selectedRepository.value
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        emit('deployment-started', { hostId, deployment: result.deployment });
      } else {
        console.error('Deployment failed');
      }
    }
  } catch (error) {
    console.error('Error during deployment:', error);
  } finally {
    isDeploying.value = false;
  }
};

// Select the first host by default when the component is mounted
onMounted(() => {
  if (props.hosts.length > 0) {
    selectedHosts.value = [props.hosts[0].id];
    emit('host-selected', props.hosts[0].id);
  }
});

// Whenever selected hosts change, emit the first selected host
watch(selectedHosts, (newHosts) => {
  if (newHosts.length > 0) {
    emit('host-selected', newHosts[0]);
  }
});
</script>