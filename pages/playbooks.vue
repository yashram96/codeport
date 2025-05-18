<template>
  <div>
    <div class="flex justify-between items-center mb-6 relative">
      <h2 class="text-2xl font-bold text-slate-900">Playbooks</h2>
      <!-- Error message for duplicate IDs -->
      <div v-if="duplicateIds.length > 0" class="absolute left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">
        Warning: Duplicate IDs found: {{ duplicateIds.join(', ') }}
      </div>
      <div class="flex space-x-4">
        <button
          v-if="isAdmin"
          @click="createNewPlaybook"
          class="btn-primary text-sm"
        >
          Add Playbook
        </button>
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search playbooks..."
            class="input pl-9"
          />
          <span class="absolute left-3 top-2.5 text-slate-400">
            🔍
          </span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-6 space-y-4">
      <select v-model="selectedSection" class="input w-48">
        <option value="">All Sections</option>
        <option v-for="section in allSections" :key="section" :value="section">
          {{ section }}
        </option>
      </select>
      
      <select v-model="selectedTag" class="input w-48 ml-4">
        <option value="">All Tags</option>
        <option v-for="tag in allTags" :key="tag" :value="tag">
          {{ tag }}
        </option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="flex items-center space-x-2">
        <div class="h-3 w-3 bg-blue-600 rounded-full animate-bounce"></div>
        <div class="h-3 w-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="h-3 w-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="playbooks.length === 0" class="text-center py-12">
      <p class="text-slate-500">No playbooks found</p>
    </div>

    <!-- Playbooks Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="playbook in filteredPlaybooks"
        :key="playbook.id"
        class="card hover:shadow-md transition-shadow"
      >
        <div class="p-4 border-b border-slate-200">
          <div>
            <h3 class="text-lg font-medium text-slate-900">{{ playbook.name }}</h3>
            <p class="text-sm text-slate-500 mt-1">[{{ playbook.path.split('/').pop() }}]</p>
          </div>
        </div>
        <div class="p-4">
          <div class="mb-4">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in playbook.tags"
                :key="tag"
                class="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="mb-4">
            <div class="text-sm text-slate-500">
              {{ playbook.description }}
            </div>
          </div>
          <div class="flex justify-between items-center">
            <div class="text-sm text-slate-500">
              Section: {{ playbook.section }}
            </div>
            <div class="flex space-x-2">
              <button
                v-if="isAdmin"
                @click="deletePlaybook(playbook)"
                class="btn-secondary text-sm text-red-600 hover:text-red-700"
              >
                Delete
              </button>
              <button
                @click="viewPlaybook(playbook)"
                class="btn-primary text-sm"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Playbook Details Modal -->
    <div v-if="selectedPlaybook" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-medium text-slate-900">{{ selectedPlaybook.name }}</h3>
            <p class="text-sm text-slate-500 mt-1">[{{ selectedPlaybook.path.split('/').pop() }}]</p>
          </div>
          <div class="flex items-center space-x-2">
            <button
              v-if="isAdmin && !isEditing"
              @click="startEditing"
              class="btn-secondary text-sm"
            >
              Edit
            </button>
            <template v-if="isEditing">
              <button
                @click="validateScript"
                class="btn-secondary text-sm"
                :disabled="isSaving"
              >
                Validate
              </button>
              <button
                @click="saveScript"
                class="btn-primary text-sm"
                :disabled="isSaving"
              >
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
              <button
                v-if="!isNewPlaybook"
                @click="cancelEditing"
                class="btn-secondary text-sm"
              >
                Cancel
              </button>
            </template>
            <button 
              v-if="!isEditing || isNewPlaybook"
              @click="closeModal" 
              class="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="p-4 overflow-y-auto">
          <div class="mb-4">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in selectedPlaybook.tags"
                :key="tag"
                class="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          <div class="mb-4">
            <h4 class="font-medium text-slate-700 mb-2">Description</h4>
            <p class="text-slate-600">{{ selectedPlaybook.description }}</p>
          </div>
          <div class="mb-4">
            <h4 class="font-medium text-slate-700 mb-2">Script Content</h4>
            <div v-if="isEditing" class="relative">
              <textarea
                v-model="editedContent"
                class="font-mono text-sm w-full h-96 input font-mono"
                :disabled="isSaving"
              ></textarea>
            </div>
            <pre v-else class="bg-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">{{ selectedPlaybook.content || 'Loading...' }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Playbook {
  id: string;
  name: string;
  description: string;
  tags: string[];
  section: string;
  path: string;
  content?: string;
}

const { $auth } = useNuxtApp();
const isAdmin = computed(() => $auth.isAdmin());
const isEditing = ref(false);
const editedContent = ref('');
const isSaving = ref(false);
const isNewPlaybook = ref(false);

const searchQuery = ref('');
const selectedTag = ref('');
const selectedSection = ref('');
const selectedPlaybook = ref<Playbook | null>(null);
const playbooks = ref<Playbook[]>([]);
const isLoading = ref(true);
const duplicateIds = ref<string[]>([]);

// Fetch playbooks on component mount
onMounted(async () => {
  try {
    const response = await fetch('/api/playbooks');
    if (response.ok) {
      const fetchedPlaybooks = await response.json();
      
      // Check for duplicate IDs
      const idCounts = new Map<string, number>();
      fetchedPlaybooks.forEach((playbook: Playbook) => {
        idCounts.set(playbook.id, (idCounts.get(playbook.id) || 0) + 1);
      });
      
      duplicateIds.value = Array.from(idCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([id]) => id);
      
      playbooks.value = fetchedPlaybooks;
    }
  } catch (error) {
    console.error('Error fetching playbooks:', error);
  } finally {
    isLoading.value = false;
  }
});

// Compute all unique tags
const allTags = computed(() => {
  const tags = new Set<string>();
  playbooks.value.forEach(playbook => {
    playbook.tags.forEach(tag => tags.add(tag));
  });
  return Array.from(tags).sort();
});

// Compute all unique sections
const allSections = computed(() => {
  const sections = new Set<string>();
  playbooks.value.forEach(playbook => {
    sections.add(playbook.section);
  });
  return Array.from(sections).sort();
});

const createNewPlaybook = async () => {
  const timestamp = Date.now();
  const newFileName = `playbook_${timestamp}.sh`;
  const defaultId = `playbook-${timestamp}`;
  const templateContent = `# METADATA: {
  "id": "${defaultId}",
  "name": "New Playbook",
  "description": "Add a description for your playbook",
  "tags": ["default"],
  "section": "General"
}

#!/bin/bash

echo "Starting deployment..."
# Add your deployment steps here
echo "Deployment complete!"
`;
  
  const newPlaybook = {
    id: defaultId,
    name: 'New Playbook',
    description: 'Add a description for your playbook',
    tags: ['default'],
    section: 'General',
    path: `playbooks/${newFileName}`,
    content: templateContent
  };
  
  selectedPlaybook.value = newPlaybook;
  editedContent.value = templateContent;
  isNewPlaybook.value = true;
  isEditing.value = true;
};

// Filter playbooks based on search, tags, and sections
const filteredPlaybooks = computed(() => {
  return playbooks.value.filter(playbook => {
    // Filter by search query
    const matchesSearch = searchQuery.value === '' || 
      playbook.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      playbook.description.toLowerCase().includes(searchQuery.value.toLowerCase());

    // Filter by selected tag
    const matchesTag = !selectedTag.value || playbook.tags.includes(selectedTag.value);

    // Filter by selected section
    const matchesSection = !selectedSection.value || playbook.section === selectedSection.value;

    return matchesSearch && matchesTag && matchesSection;
  });
});

const viewPlaybook = async (playbook: Playbook) => {
  selectedPlaybook.value = { ...playbook };
  isNewPlaybook.value = false;
  
  try {
    const response = await fetch(`/api/playbooks/${playbook.id}`);
    if (response.ok) {
      const { content } = await response.json();
      selectedPlaybook.value = {
        ...playbook,
        content
      };
    }
  } catch (error) {
    console.error('Error loading playbook content:', error);
    selectedPlaybook.value.content = 'Error loading playbook content';
  }
};

const startEditing = () => {
  editedContent.value = selectedPlaybook.value?.content || '';
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
  editedContent.value = '';
  // Reload the original content
  if (selectedPlaybook.value) {
    viewPlaybook(selectedPlaybook.value);
  }
};

const closeModal = () => {
  if (isEditing.value && !isNewPlaybook.value) {
    if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
  }
  isEditing.value = false;
  isNewPlaybook.value = false;
  selectedPlaybook.value = null;
}

const validateScript = async () => {
  try {
    // Check if metadata is valid JSON
    const metadataMatch = editedContent.value.match(/^#\s*METADATA:\s*({[\s\S]*?})/m);
    if (!metadataMatch) {
      alert('Invalid script: Missing METADATA section');
      return false;
    }

    try {
      const metadata = JSON.parse(metadataMatch[1]);
      if (!metadata.id || !metadata.name || !metadata.description || !metadata.tags || !metadata.section) {
        alert('Invalid metadata: Missing required fields');
        return false;
      }
    } catch (error) {
      alert('Invalid metadata: JSON parsing failed');
      return false;
    }

    alert('Script validation successful!');
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    alert('Validation failed');
    return false;
  }
};

const saveScript = async () => {
  if (!selectedPlaybook.value?.id || !isAdmin.value) return;
  
  if (!await validateScript()) return;
  
  isSaving.value = true;
  try {
    // For new playbooks, create the file first
    if (isNewPlaybook.value) {
      const createResponse = await fetch('/api/playbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ 
          filename: selectedPlaybook.value.path.split('/').pop(),
          content: editedContent.value
        })
      });
      
      if (!createResponse.ok) {
        throw new Error('Failed to create playbook');
      }
      
      const newPlaybook = await createResponse.json();
      // Update the selected playbook with the server response data
      selectedPlaybook.value = {
        ...selectedPlaybook.value,
        ...newPlaybook
      };
      
      // Add the new playbook to the list
      playbooks.value.push(selectedPlaybook.value);
    }
    
    // Now save the content
    const response = await fetch(`/api/playbooks/${selectedPlaybook.value.id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      body: editedContent.value
    });

    if (response.ok) {
      const result = await response.json();
      selectedPlaybook.value.content = editedContent.value;
      isEditing.value = false;
      isNewPlaybook.value = false;
      alert(result.message || 'Script saved successfully!');
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save script');
    }
  } catch (error) {
    console.error('Error saving script:', error);
    alert(error.message || 'Failed to save script');
  } finally {
    isSaving.value = false;
  }
};

const deletePlaybook = async (playbook: Playbook) => {
  if (!confirm(`Are you sure you want to delete "${playbook.name}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/playbooks/${playbook.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });

    if (response.ok) {
      playbooks.value = playbooks.value.filter(p => p.id !== playbook.id);
      alert('Playbook deleted successfully');
    } else {
      throw new Error('Failed to delete playbook');
    }
  } catch (error) {
    console.error('Error deleting playbook:', error);
    alert(error.message || 'Failed to delete playbook');
  }
};
</script>