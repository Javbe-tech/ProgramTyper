<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close', 'save']);

const filename = ref('');
const codeContent = ref('');

function saveFile() {
  if (filename.value.trim() && codeContent.value.trim()) {
    emit('save', { filename: filename.value.trim(), code: codeContent.value });
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>Create New File</h2>
      <div class="form-group">
        <label for="filename">Filename (e.g., script.js)</label>
        <input type="text" id="filename" v-model="filename" placeholder="my-awesome-script.js">
      </div>
      <div class="form-group">
        <label for="code-content">Paste Your Code Here</label>
        <textarea id="code-content" v-model="codeContent" rows="15"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="saveFile">Save File</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: var(--sidebar-bg);
  padding: 25px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  width: 600px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
h2 {
  margin-top: 0;
  color: var(--font-color);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
label {
  color: var(--gray);
  font-size: 0.9rem;
}
input, textarea {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--font-color);
  padding: 8px;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 0.9rem;
  resize: vertical;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
button {
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.btn-primary {
  background-color: var(--keyword);
  color: white;
}
.btn-secondary {
  background-color: var(--border-color);
  color: var(--font-color);
}
</style>