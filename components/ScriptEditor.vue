<template>
  <div class="card">
    <div class="p-4 border-b border-slate-200 flex justify-between items-center">
      <h3 class="text-lg font-medium text-slate-900">Script Editor</h3>
      <div class="flex space-x-2">
        <button
          v-if="isAdmin"
          @click="saveScript"
          class="btn-primary text-sm"
          :disabled="!hasChanges || isSaving"
        >
          <span v-if="isSaving" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
          <span v-else>Save Script</span>
        </button>
      </div>
    </div>
    <div class="p-4">
      <div v-if="script" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Script Content</label>
          <textarea
            v-model="scriptContent"
            class="font-mono text-sm w-full h-96 input"
            :readonly="!isAdmin"
            :class="{ 'bg-slate-50 cursor-not-allowed': !isAdmin }"
            :disabled="!isAdmin"
            placeholder="#!/bin/bash

# Available environment variables:
# REPOSITORY_ID - The ID of the repository being deployed
# HOST_ID - The ID of the host being deployed to
# TIMESTAMP - Current timestamp

echo 'Starting deployment...'
"
          ></textarea>
        </div>
        
        <div class="text-sm text-slate-500">
          <h4 class="font-medium text-slate-700 mb-1">Available Variables:</h4>
          <ul class="list-disc list-inside space-y-1">
            <li><code class="bg-slate-100 px-1 rounded">REPOSITORY_ID</code> - The ID of the repository being deployed</li>
            <li><code class="bg-slate-100 px-1 rounded">HOST_ID</code> - The ID of the host being deployed to</li>
            <li><code class="bg-slate-100 px-1 rounded">TIMESTAMP</code> - Current timestamp</li>
          </ul>
        </div>
      </div>
      <div v-else class="text-center py-8 text-slate-500">
        Select a script to edit
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Script } from '~/utils/types';
import fs from 'fs-extra';

const props = defineProps<{
  script?: Script;
  isAdmin: boolean;
}>();

const emit = defineEmits(['script-saved']);

const scriptContent = ref('');
const originalContent = ref('');
const isSaving = ref(false);

const hasChanges = computed(() => {
  return scriptContent.value !== originalContent.value;
});

// Load script content when script changes
watch(() => props.script, async (newScript) => {
  if (newScript && process.client) {
    try {
      const response = await fetch(`/api/scripts/${newScript.id}`);
      if (response.ok) {
        const content = await response.text();
        scriptContent.value = content;
        originalContent.value = content;
      }
    } catch (error) {
      console.error('Error loading script:', error);
    }
  }
}, { immediate: true });

const saveScript = async () => {
  if (!props.script || !props.isAdmin) return;
  
  isSaving.value = true;
  try {
    const response = await fetch(`/api/scripts/${props.script.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: scriptContent.value
    });
    
    if (response.ok) {
      originalContent.value = scriptContent.value;
      emit('script-saved');
    }
  } catch (error) {
    console.error('Error saving script:', error);
  } finally {
    isSaving.value = false;
  }
};
</script>