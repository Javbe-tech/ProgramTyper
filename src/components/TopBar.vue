<script setup>
import { ref, onMounted } from 'vue';
import Dashboard from './Dashboard.vue';
import { authService } from '../services/authService.js';

const theme = ref(localStorage.getItem('pt_theme') || 'default');
const user = ref(null);
const isAuthenticated = ref(false);

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

// Update auth state function
function updateAuthState() {
  isAuthenticated.value = authService.isUserAuthenticated();
  user.value = authService.getUser();
}

onMounted(() => {
  applyTheme(theme.value);
  updateAuthState();
  
  // Check for auth changes periodically
  setInterval(updateAuthState, 1000);
});

function getUserInitials() {
  if (!user.value) return '';
  const name = user.value.name || user.value.email;
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function handleLogout() {
  if (confirm('Are you sure you want to sign out? Your progress will be saved to your Google account.')) {
    authService.logout();
    updateAuthState();
  }
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
        <li>Run</li>
        <li>Terminal</li>
        <li>Help</li>
      </ul>
    </div>
    <div class="right-section">
      <!-- User Info Display -->
      <div v-if="isAuthenticated" class="user-info-topbar">
        <div class="user-avatar-small">
          <img 
            v-if="user.picture" 
            :src="user.picture" 
            :alt="user.name"
            class="avatar-image-small"
          />
          <div v-else class="avatar-placeholder-small">
            {{ getUserInitials() }}
          </div>
        </div>
        <div class="user-details-small">
          <div class="user-name-small">{{ user.name }}</div>
          <div class="user-email-small">{{ user.email }}</div>
        </div>
        <button @click="handleLogout" class="logout-btn-small" title="Sign out">
          <span class="logout-icon-small">🚪</span>
        </button>
      </div>
      
      <!-- Login Option when not authenticated -->
      <div v-else class="login-section-topbar">
        <button @click="handleLogin" class="login-btn-topbar">
          <span class="login-icon-topbar">👤</span>
          Sign in
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

.right-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* User Info in Top Bar */
.user-info-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.user-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-small {
  width: 100%;
  height: 100%;
  background: var(--keyword);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.7rem;
}

.user-details-small {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name-small {
  font-weight: 500;
  color: var(--font-color);
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-email-small {
  color: var(--gray);
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.logout-btn-small {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--gray);
  padding: 1px 3px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 0.7;
}

.logout-btn-small:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
  border-color: var(--font-color);
  opacity: 1;
}

.logout-icon-small {
  font-size: 0.7rem;
}

/* Login Section in Top Bar */
.login-section-topbar {
  display: flex;
  align-items: center;
}

.login-btn-topbar {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--keyword);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.2s ease;
}

.login-btn-topbar:hover {
  background: #6d28d9;
}

.login-icon-topbar {
  font-size: 0.7rem;
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