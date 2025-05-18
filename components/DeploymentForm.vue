<template>
  <div class="card">
    <div class="p-4 border-b border-slate-200">
      <h3 class="text-lg font-medium text-slate-900">New Deployment</h3>
    </div>
    <div class="p-4">
      <form @submit.prevent="deploy">
        <div class="space-y-4">
          <!-- Deployment Name -->
          <div>
            <label for="deploymentName" class="block text-sm font-medium text-slate-700 mb-1">
              Deployment Name <span class="text-red-600">*</span>
            </label>
            <input
              id="deploymentName"
              v-model="deploymentName"
              type="text"
              class="input w-full border-slate-300"
              placeholder="Enter deployment name"
              required
            />
            <p class="mt-1 text-xs text-slate-500">
              A descriptive name for this deployment
            </p>
          </div>

          <!-- Playbook Selection -->
          <div>
            <label for="playbook" class="block text-sm font-medium text-slate-700 mb-1">
              Playbook <span class="text-red-600">*</span>
            </label>
            <select
              id="playbook"
              v-model="selectedPlaybook"
              class="input w-full"
              required
            >
              <option value="" disabled>Choose a deployment playbook</option>
              <option
                v-for="playbook in playbooks"
                :key="playbook.id"
                :value="playbook.id"
              >
                {{ playbook.name }} [{{ playbook.section }}]
              </option>
            </select>
            <p class="mt-1 text-xs text-slate-500">
              Select a deployment playbook to execute
            </p>
          </div>
          
          <!-- Repository Selection -->
          <div>
            <label for="repository" class="block text-sm font-medium text-slate-700 mb-1">
              Repository <span class="text-red-600">*</span>
            </label>
            <select
              id="repository"
              v-model="selectedRepository"
              class="input w-full border-slate-300"
              required
            >
              <option value="" disabled>Choose a repository</option>
              <option
                v-for="repo in repositories"
                :key="repo.id"
                :value="repo.id"
              >
                {{ repo.name }}
              </option>
            </select>
            <p class="mt-1 text-xs text-slate-500">
              Select a repository to deploy
            </p>
          </div>
          
          <!-- Host Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Target Hosts <span class="text-red-600">*</span>
            </label>
            <div class="space-y-2 border rounded-md p-3 border-slate-300">
              <div class="flex items-center mb-2">
                <input
                  id="all-hosts"
                  type="checkbox"
                  v-model="selectAllHosts"
                  class="h-4 w-4 text-blue-600 border-slate-300 rounded"
                  @change="toggleAllHosts"
                />
                <label for="all-hosts" class="ml-2 block text-sm text-slate-700 font-medium">
                  Select All Hosts
                </label>
              </div>
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
            <p v-if="!isDeploying && selectedHosts.length === 0" class="mt-1 text-sm text-red-600">
              Please select at least one host
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Select the target hosts for deployment
            </p>
          </div>
          
          <!-- Arguments -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-slate-700">
                Arguments (Optional)
              </label>
              <button
                type="button"
                @click="addArgument"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Argument
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(arg, index) in deploymentArguments"
                :key="index"
                class="flex items-center space-x-2"
              >
                <input
                  v-model="arg.key"
                  type="text"
                  class="input flex-1 border-slate-300"
                  placeholder="Key"
                />
                <input
                  v-model="arg.value"
                  type="text"
                  class="input flex-1 border-slate-300"
                  placeholder="Value"
                />
                <button
                  type="button"
                  @click="removeArgument(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
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
import type { Repository, Host, Script, DeploymentArgument } from '~/utils/types';
interface Playbook {
  id: string;
  name: string;
  description: string;
  tags: string[];
  section: string;
}

const props = defineProps<{
  repositories: Repository[];
  hosts: Host[];
}>();

const emit = defineEmits(['deployment-started', 'host-selected']);

const { $auth } = useNuxtApp();
const hasWriteAccess = computed(() => $auth.isAdmin());

const deploymentName = ref('');
const selectedRepository = ref('');
const selectedPlaybook = ref('');
const selectedHosts = ref<string[]>([]);
const selectAllHosts = ref(false);
const deploymentArguments = ref<DeploymentArgument[]>([]);
const playbooks = ref<Playbook[]>([]);
const isDeploying = ref(false);

// Fetch playbooks on mount
onMounted(async () => {
  try {
    const response = await fetch('/api/playbooks');
    if (response.ok) {
      const data = await response.json();
      console.log('Fetched playbooks:', data); // Debug log
      playbooks.value = data;
    }
  } catch (error) {
    console.error('Error fetching playbooks:', error);
  }
});

const canDeploy = computed(() => {
  return deploymentName.value && 
         selectedPlaybook.value && 
         selectedRepository.value &&
         selectedHosts.value.length > 0;
});

const addArgument = () => {
  deploymentArguments.value.push({ key: '', value: '' });
};

const removeArgument = (index: number) => {
  deploymentArguments.value.splice(index, 1);
};

const toggleAllHosts = () => {
  if (selectAllHosts.value) {
    selectedHosts.value = props.hosts.map(host => host.id);
  } else {
    selectedHosts.value = [];
  }
};

const deploy = async () => {
  if (!canDeploy.value || !hasWriteAccess.value) return;
  
  isDeploying.value = true;
  
  try {
    // Deploy to each selected host
    for (const hostId of selectedHosts.value) {
      const token = localStorage.getItem('auth_token') || '';
      
      console.log('Sending deployment request:', {
        hostId,
        name: deploymentName.value,
        repositoryId: selectedRepository.value,
        playbookId: selectedPlaybook.value,
        arguments: deploymentArguments.value
      });

      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hostId,
          name: deploymentName.value.trim(),
          repositoryId: selectedRepository.value,
          playbookId: selectedPlaybook.value,
          arguments: deploymentArguments.value.filter(arg => arg.key && arg.value)
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        emit('deployment-started', { hostId: selectedHosts.value[0], deployment: result.deployment });
        
        if (!result.success) {
          console.warn('Deployment completed with errors:', result.deployment.logs);
        }
      } else {
        const error = await response.text();
        console.error('Deployment response error:', error);
        throw new Error('Failed to process deployment response');
      }
    }
  } catch (error) {
    console.error('Error during deployment:', error);
    // Continue execution, error is already logged
  } finally {
    isDeploying.value = false;
    // Reset form on success
    deploymentName.value = '';
    selectedRepository.value = '';
    selectedPlaybook.value = '';
    selectedHosts.value = [];
    selectAllHosts.value = false;
    deploymentArguments.value = [];
  }
};

// Select the first host by default when the component is mounted
onMounted(() => {
  if (props.hosts.length > 0) {
    // Don't auto-select any host
    selectedHosts.value = [];
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