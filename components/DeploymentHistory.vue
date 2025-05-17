<template>
  <div class="card h-full flex flex-col">
    <div class="p-4 border-b border-slate-200">
      <h3 class="text-lg font-medium text-slate-900">Deployment History</h3>
    </div>
    <div class="flex-grow overflow-auto p-4">
      <div v-if="isLoading" class="flex justify-center p-4">
        <div class="flex items-center space-x-2">
          <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
      <div v-else-if="history.length === 0" class="text-center py-8 text-slate-500">
        No deployment history
      </div>
      <div v-else>
        <div v-for="event in history" :key="event.id" class="mb-3">
          <div 
            class="border rounded-lg p-3 hover:bg-slate-50 transition-colors cursor-pointer"
            :class="{ 'border-blue-200 bg-blue-50 hover:bg-blue-50': selectedEvent?.id === event.id }"
            @click="selectEvent(event)"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">
                  {{ findRepositoryName(event.repository) }}
                </div>
                <div class="text-sm text-slate-500">
                  {{ formatDate(event.timestamp) }}
                </div>
              </div>
              <div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import type { DeploymentEvent, Repository } from '~/utils/types';

const props = defineProps<{
  hostId: string;
  repositories: Repository[];
}>();

const emit = defineEmits(['event-selected']);

const history = ref<DeploymentEvent[]>([]);
const isLoading = ref(false);
const selectedEvent = ref<DeploymentEvent | null>(null);

const fetchHistory = async () => {
  if (!props.hostId || !process.client) return;
  
  isLoading.value = true;
  try {
    const response = await fetch(`/api/history/${props.hostId}`);
    if (response.ok) {
      history.value = await response.json();
      
      // Select the first event if none is selected
      if (history.value.length > 0 && !selectedEvent.value) {
        selectEvent(history.value[0]);
      }
    } else {
      console.error('Failed to fetch history');
    }
  } catch (error) {
    console.error('Error fetching history:', error);
  } finally {
    isLoading.value = false;
  }
};

const selectEvent = (event: DeploymentEvent) => {
  selectedEvent.value = event;
  emit('event-selected', event);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const findRepositoryName = (repoId: string) => {
  const repo = props.repositories.find(r => r.id === repoId);
  return repo ? repo.name : repoId;
};

// Set up automatic refreshing
let refreshInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  if (process.client) {
    fetchHistory();
    refreshInterval = setInterval(fetchHistory, 10000); // Refresh every 10 seconds
  }
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

// Watch for hostId changes
watch(
  () => props.hostId,
  () => {
    if (process.client) {
      selectedEvent.value = null;
      fetchHistory();
    }
  }
);
</script>