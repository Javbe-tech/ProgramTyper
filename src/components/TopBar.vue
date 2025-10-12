<script setup>
import { ref, onMounted } from 'vue';
import Dashboard from './Dashboard.vue';
import { authService } from '../services/authService.js';

const props = defineProps({
  terminalVisible: { type: Boolean, default: true },
  runButtonActive: { type: Boolean, default: false }
});

const emit = defineEmits(['toggle-terminal', 'open-help', 'open-settings', 'open-pro-upgrade', 'user-logout', 'run-button']);

const theme = ref(localStorage.getItem('pt_theme') || 'default');
const user = ref(null);
const isAuthenticated = ref(false);

function checkProAccess() {
  const isProUser = localStorage.getItem('pt_pro_user') === '1';
  return isAuthenticated.value && isProUser;
}

function applyTheme(value, showUpgradePrompt = true) {
  if (!checkProAccess()) {
    if (showUpgradePrompt) {
      emit('open-pro-upgrade');
    }
    return;
  }
  
  theme.value = value;
  localStorage.setItem('pt_theme', value);
  const root = document.documentElement;
  if (value === 'default') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', value);
  }
}

function updateAuthState() {
  isAuthenticated.value = authService.isUserAuthenticated();
  user.value = authService.getUser();
}

function toggleTerminal() {
  emit('toggle-terminal');
}

function openHelp() {
  emit('open-help');
}

function openSettings() {
  emit('open-settings');
}

function handleRunButton() {
  emit('run-button');
}

async function handleLogin() {
  try {
    await authService.login();
    updateAuthState();
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed. Please try again.');
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to sign out? Your progress will be saved to your Google account.')) {
    authService.logout();
    updateAuthState();
    emit('user-logout');
  }
}

function getUserInitials() {
  if (!user.value) return '';
  const name = user.value.name || user.value.email;
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

onMounted(() => {
  applyTheme(theme.value, false); // Don't show upgrade prompt on initial load
  updateAuthState();
  
  // Check for auth changes periodically
  setInterval(updateAuthState, 1000);
});
</script>

<template>
  <div id="top-bar">
    <div class="left-section">
      <span class="app-title">James Dark</span>
      <ul class="menu-list">
        <li>File</li>
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
        <li @click="handleRunButton" class="menu-run" :class="{ 'active': runButtonActive }">
          Run {{ runButtonActive ? '⚡' : '' }}
        </li>
        <li @click="toggleTerminal" class="menu-terminal" :class="{ 'active': terminalVisible }">
          Terminal {{ terminalVisible ? '▼' : '▶' }}
        </li>
        <li @click="openHelp" class="menu-help">Help</li>
        <li @click="openSettings" class="menu-settings">Settings</li>
      </ul>
    </div>
    <div class="right-section">
      <!-- Compact Login/User Info -->
      <div v-if="!isAuthenticated" class="compact-login">
        <button @click="handleLogin" class="compact-login-btn" title="Sign in">
          <span class="compact-login-icon">👤</span>
        </button>
      </div>
      
      <div v-else class="compact-user-info">
        <div class="compact-avatar">
          <img 
            v-if="user.picture" 
            :src="user.picture" 
            :alt="user.name"
            class="compact-avatar-img"
          />
          <div v-else class="compact-avatar-placeholder">
            {{ getUserInitials() }}
          </div>
        </div>
        <div class="compact-user-details">
          <div class="compact-user-name">{{ user.name }}</div>
        </div>
        <button @click="handleLogout" class="compact-logout-btn" title="Sign out">
          <span class="compact-logout-icon">🚪</span>
        </button>
      </div>
      
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
  background: rgba(124, 58, 237, 0.3);
  color: var(--font-color);
}

.menu-run {
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-run:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
}

.menu-run.active {
  background: var(--completed-green);
  color: white;
  animation: runButtonGlow 2s ease-in-out infinite alternate;
}

.menu-help {
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-help:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
}

.menu-settings {
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-settings:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
}

/* Compact Login Styles */
.compact-login {
  display: flex;
  align-items: center;
}

.compact-login-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background-color 0.2s ease;
}

.compact-login-btn:hover {
  background: #6d28d9;
}

.compact-login-icon {
  font-size: 0.9rem;
}

.compact-user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.compact-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.compact-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.compact-avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--keyword);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.6rem;
}

.compact-user-details {
  min-width: 0;
}

.compact-user-name {
  font-weight: 500;
  color: var(--font-color);
  font-size: 0.7rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.compact-logout-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--gray);
  padding: 1px 3px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.compact-logout-btn:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
  border-color: var(--font-color);
  opacity: 1;
}

.compact-logout-icon {
  font-size: 0.6rem;
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

@keyframes runButtonGlow {
  from { 
    box-shadow: 0 0 5px var(--completed-green), 0 0 10px var(--completed-green);
  }
  to { 
    box-shadow: 0 0 10px var(--completed-green), 0 0 20px var(--completed-green), 0 0 30px var(--completed-green);
  }
}
</style>