<template>
  <div>
    <h2 class="text-2xl font-bold text-slate-900 mb-6">Deployment Control Center</h2>
    
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <div class="h-3 w-3 bg-blue-600 rounded-full animate-bounce"></div>
        <div class="h-3 w-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="h-3 w-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Deployment Form -->
      <div>
        <DeploymentForm 
          :repositories="settings.repositories" 
          :hosts="settings.hosts"
          @deployment-started="handleDeploymentStarted"
          @host-selected="selectedHostId = $event"
        />
      </div>
      
      <!-- Deployment History -->
      <div>
        <DeploymentHistory 
          :hostId="selectedHostId" 
          :repositories="settings.repositories"
          @event-selected="selectedEvent = $event"
        />
      </div>
      
      <!-- Log Viewer -->
      <div>
        <client-only>
          <LogViewer 
            v-if="selectedEvent" 
            :hostId="selectedHostId" 
            :eventId="selectedEvent.id" 
          />
          <div v-else class="card h-full flex items-center justify-center text-slate-500">
            Select a deployment to view logs
          </div>
        </client-only>
      </div>
    </div>
  </div>
</template>

<script setup>
const settings = ref({
  repositories: [],
  hosts: [],
  scripts: []
});

const isLoading = ref(true);
const selectedHostId = ref('');
const selectedEvent = ref(null);

// Access auth state
const isAuthenticated = useState('isAuthenticated');

// Fetch settings on client-side only
const fetchSettings = async () => {
  if (process.server) return;
  
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    const response = await fetch('/api/settings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      settings.value = await response.json();
      
      // Select first host by default if available
      if (settings.value.hosts.length > 0) {
        selectedHostId.value = settings.value.hosts[0].id;
      }
    } else {
      console.error('Failed to fetch settings:', response.status);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
  } finally {
    isLoading.value = false;
  }
};

// Only fetch settings on client-side after mount
onMounted(() => {
  if (process.client) {
    // Use nextTick to ensure this runs after hydration
    nextTick(() => {
      fetchSettings();
    });
  } else {
    // On server side, just mark as not loading to prevent hydration mismatch
    isLoading.value = false;
  }
});

// Also watch for auth changes to re-fetch settings when needed
watch(isAuthenticated, (newValue) => {
  if (process.client && newValue === true) {
    fetchSettings();
  }
});

const handleDeploymentStarted = ({ hostId, deployment }) => {
  // Select the host that was deployed to
  selectedHostId.value = hostId;
  // Select the new deployment event
  selectedEvent.value = deployment;
};
</script>