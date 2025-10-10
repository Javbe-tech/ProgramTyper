<script setup>
import { ref, onMounted } from 'vue';
import Dashboard from './Dashboard.vue';

const props = defineProps({
  terminalVisible: { type: Boolean, default: true }
});

const emit = defineEmits(['toggle-terminal', 'open-help', 'file-menu']);

const theme = ref(localStorage.getItem('pt_theme') || 'default');

function applyTheme(value) {
  theme.value = value;
  localStorage.setItem('pt_theme', value);
  const root = document.documentElement;
  if (value === 'default') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', value);
  }
}

function toggleTerminal() {
  emit('toggle-terminal');
}

function openHelp() {
  emit('open-help');
}

function openFileMenu() {
  emit('file-menu');
}

onMounted(() => {
  applyTheme(theme.value);
});
</script>

<template>
  <div id="top-bar">
    <div class="left-section">
      <span class="app-title">James Dark</span>
      <ul class="menu-list">
        <li class="menu-file">
          File
          <div class="dropdown">
            <button @click="openFileMenu">New File</button>
            <button @click="openFileMenu">Open File</button>
            <button @click="openFileMenu">Save Progress</button>
            <button @click="openFileMenu">Export Stats</button>
          </div>
        </li>
        <li>Edit</li>
        <li>Selection</li>
        <li class="menu-view">
          View
          <div class="dropdown">
            <button @click="applyTheme('default')">Default</button>
            <button @click="applyTheme('matrix')">Matrix</button>
            <button @click="applyTheme('black-white')">Black & White</button>
            <button @click="applyTheme('black-red')">Black & Red</button>
            <button @click="applyTheme('white')">White</button>
            <button @click="applyTheme('psychedelic')">Psychedelic</button>
          </div>
        </li>
        <li>Run</li>
        <li @click="toggleTerminal" class="menu-terminal" :class="{ 'active': terminalVisible }">
          Terminal {{ terminalVisible ? '▼' : '▶' }}
        </li>
        <li @click="openHelp" class="menu-help">Help</li>
      </ul>
    </div>
    <div class="right-section">
      <Dashboard />
    </div>
  </div>
</template>

<style scoped>
#top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--menu-bar-bg);
  color: var(--font-color);
  padding: 0 15px;
  height: 35px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
  user-select: none;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-title {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--font-color);
}

.menu-list {
  list-style: none;
  display: flex;
  gap: 15px;
  margin: 0;
  padding: 0;
  font-size: 0.9rem;
}

.menu-list li {
  cursor: pointer;
  color: var(--gray);
  transition: color 0.2s ease;
}

.menu-list li:hover {
  color: var(--font-color);
}

.menu-view { position: relative; }
.menu-view .dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--menu-bar-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px;
  display: none;
  z-index: 100;
}
.menu-view:hover .dropdown { display: grid; grid-auto-rows: 1fr; gap: 6px; }
.menu-view .dropdown button {
  background: none;
  border: none;
  color: var(--font-color);
  text-align: left;
  padding: 6px 10px;
  cursor: pointer;
}
.menu-view .dropdown button:hover {
  background: var(--active-line-bg);
}

.menu-terminal {
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-terminal:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
}

.menu-terminal.active {
  background: var(--keyword);
  color: white;
}

.menu-help {
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-help:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
}

.menu-file {
  position: relative;
}

.menu-file:hover .dropdown {
  display: block;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-button {
  background-color: var(--keyword);
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
}

.login-button:hover {
  background-color: #6d28d9; /* A cooler purple on hover */
}
</style>