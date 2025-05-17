<template>
  <div class="card h-full flex flex-col">
    <div class="p-4 border-b border-slate-200 flex justify-between items-center">
      <h3 class="text-lg font-medium text-slate-900">Deployment Logs</h3>
      <div class="flex space-x-2">
        <span
          v-if="isLoading"
          class="inline-flex items-center text-sm text-blue-600"
        >
          <span class="mr-2 h-2 w-2 bg-blue-600 rounded-full animate-pulse"></span>
          Loading...
        </span>
        <button
          v-if="logs.length > 0"
          @click="refreshLogs"
          class="text-sm text-slate-500 hover:text-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
    <div class="flex-grow overflow-auto bg-slate-800 p-4 font-mono text-sm text-slate-100">
      <div v-if="logs.length === 0 && !isLoading" class="flex items-center justify-center h-full text-slate-400">
        <span>No logs available</span>
      </div>
      <div v-else>
        <div v-for="(line, index) in logs" :key="index" class="py-0.5">
          {{ line }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';

const props = defineProps<{
  hostId: string;
  eventId: string;
}>();

const logs = ref<string[]>([]);
const isLoading = ref(false);

const fetchLogs = async () => {
  if (!props.hostId || !props.eventId || !process.client) return;
  
  isLoading.value = true;
  try {
    const response = await fetch(`/api/logs/${props.hostId}/${props.eventId}`);
    if (response.ok) {
      logs.value = await response.json();
    } else {
      console.error('Failed to fetch logs');
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
  } finally {
    isLoading.value = false;
  }
};

const refreshLogs = () => {
  if (process.client) {
    fetchLogs();
  }
};

// Set up automatic refreshing
let refreshInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  if (process.client) {
    fetchLogs();
    refreshInterval = setInterval(fetchLogs, 3000); // Refresh every 3 seconds
  }
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch for prop changes
watch(
  () => [props.hostId, props.eventId],
  () => {
    if (process.client) {
      fetchLogs();
    }
  }
);
</script>