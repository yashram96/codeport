<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-900 mb-6">Deployment History</h2>

    <!-- Host Selection -->
    <div class="mb-6">
      <select
        v-model="selectedHostId"
        class="input w-64 mr-2"
        @change="fetchHistory"
      >
        <option value="" disabled>Select a host</option>
        <option value="all">All Hosts</option>
        <option
          v-for="host in settings.hosts"
          :key="host.id"
          :value="host.id"
        >
          {{ host.name }}
        </option>
      </select>
    </div>

    <!-- History Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Repository
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Host
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Arguments
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="7" class="px-6 py-4 text-center text-slate-500">
                <div class="flex justify-center items-center space-x-2">
                  <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                </div>
              </td>
            </tr>
            <tr v-else-if="!selectedHostId" class="hover:bg-slate-50">
              <td colspan="7" class="px-6 py-4 text-center text-slate-500">
                Please select a host to view deployment history
              </td>
            </tr>
            <tr v-else-if="history.length === 0" class="hover:bg-slate-50">
              <td colspan="7" class="px-6 py-4 text-center text-slate-500">
                No deployment history found
              </td>
            </tr>
            <tr
              v-for="event in history"
              :key="event.id"
              class="hover:bg-slate-50 cursor-pointer"
              @click="selectEvent(event)"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                {{ event.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                {{ formatDate(event.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                {{ findRepositoryName(event.repository) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                {{ findHostName(event.hostId) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="badge"
                  :class="{
                    'badge-success': event.status === 'Success',
                    'badge-pending': event.status === 'Pending',
                    'badge-failed': event.status === 'Failed'
                  }"
                >
                  {{ event.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                <div v-if="event.arguments && event.arguments.length > 0">
                  <div v-for="(arg, index) in event.arguments" :key="index">
                    {{ arg.key }}: {{ arg.value }}
                  </div>
                </div>
                <span v-else class="text-slate-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                <div class="flex space-x-2">
                  <button 
                    @click.stop="selectEvent(event)"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    View Logs
                  </button>
                  <button 
                    v-if="isAdmin"
                    @click.stop="deleteLog(event)"
                    class="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Log Viewer Modal -->
    <div v-if="selectedEvent" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-medium text-slate-900">Deployment Logs</h3>
            <p class="text-sm text-slate-500">
              {{ findRepositoryName(selectedEvent.repository) }} - 
              {{ formatDate(selectedEvent.timestamp) }}
            </p>
          </div>
          <button 
            @click="selectedEvent = null"
            class="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div class="flex-1 overflow-auto p-4 bg-slate-800 font-mono text-sm">
          <div v-if="isLoadingLogs" class="flex justify-center p-4">
            <div class="flex items-center space-x-2">
              <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
          <div v-else>
            <div
              v-for="(line, index) in selectedEvent.logs"
              :key="index"
              class="text-slate-300 py-0.5"
            >
              {{ line }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { DeploymentEvent } from '~/utils/types';

const { $auth } = useNuxtApp();
const isAdmin = computed(() => $auth.isAdmin());

const settings = ref({
  repositories: [],
  hosts: []
});

const selectedHostId = ref('all');
const history = ref<DeploymentEvent[]>([]);
const selectedEvent = ref<DeploymentEvent | null>(null);
const isLoading = ref(true);
const isLoadingLogs = ref(false);

// Fetch settings and history on mount
const fetchHistory = async () => {
  isLoading.value = true;
  try {
    const [settingsResponse, historyResponse] = await Promise.all([
      fetch('/api/settings'),
      fetch(`/api/history/${selectedHostId.value}`)
    ]);

    if (settingsResponse.ok) {
      settings.value = await settingsResponse.json();
    }

    if (historyResponse.ok) {
      history.value = await historyResponse.json();
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (process.client) {
    fetchHistory();
  }
});

// Watch for host changes and fetch history
watch(selectedHostId, () => {
  fetchHistory();
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const findRepositoryName = (repoId: string) => {
  const repo = settings.value.repositories.find(r => r.id === repoId);
  return repo ? repo.name : repoId;
};

const findHostName = (hostId: string) => {
  if (hostId === 'all') {
    return 'All Hosts';
  }
  const host = settings.value.hosts.find(h => h.id === hostId);
  if (host) {
    return host.name;
  }
  return 'Unknown Host';
};

const deleteLog = async (event: DeploymentEvent) => {
  if (!confirm('Are you sure you want to delete this deployment log?')) {
    return;
  }

  const token = localStorage.getItem('auth_token');
  if (!token) return;

  try {
    const response = await fetch(`/api/logs/${selectedHostId.value}/${event.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Remove the event from history
      history.value = history.value.filter(e => e.id !== event.id);
      // Clear selection if deleted event was selected
      if (selectedEvent.value?.id === event.id) {
        selectedEvent.value = null;
      }
      alert('Log deleted successfully');
    } else {
      throw new Error('Failed to delete log');
    }
  } catch (error) {
    console.error('Error deleting log:', error);
    alert('Failed to delete log: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

const selectEvent = (event: DeploymentEvent) => {
  selectedEvent.value = event;
  isLoadingLogs.value = true;
  
  // Fetch full logs
  fetch(`/api/logs/${event.hostId}/${event.id}`)
    .then(response => response.json())
    .then(logs => {
      if (selectedEvent.value?.id === event.id) {
        selectedEvent.value = {
          ...event,
          logs
        };
      }
    })
    .catch(error => {
      console.error('Error fetching logs:', error);
    })
    .finally(() => {
      isLoadingLogs.value = false;
    });
};
</script>