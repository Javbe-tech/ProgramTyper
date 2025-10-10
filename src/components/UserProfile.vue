<script setup>
import { ref, onMounted, watch } from 'vue';
import { authService } from '../services/authService.js';

const user = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const loginError = ref('');

// Watch for authentication changes
watch(() => authService.isAuthenticated, (newValue) => {
  isAuthenticated.value = newValue;
  user.value = authService.getUser();
});

onMounted(() => {
  // Initialize user state
  isAuthenticated.value = authService.isUserAuthenticated();
  user.value = authService.getUser();
});

async function handleLogin() {
  isLoading.value = true;
  loginError.value = '';
  
  try {
    const userInfo = await authService.login();
    console.log('Login successful:', userInfo);
  } catch (error) {
    console.error('Login failed:', error);
    loginError.value = error.message || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

function handleLogout() {
  authService.logout();
  user.value = null;
  isAuthenticated.value = false;
}

function getUserInitials() {
  if (!user.value) return '';
  const name = user.value.name || user.value.email;
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
</script>

<template>
  <div class="user-profile">
    <!-- Not Authenticated State -->
    <div v-if="!isAuthenticated" class="login-section">
        <div class="login-prompt">
          <div class="login-icon">👤</div>
          <h3>Guest Mode</h3>
          <p>You're using the app as a guest. Your progress will be saved locally in your browser.</p>
          
          <div class="guest-info">
            <div class="info-item">
              <span class="info-icon">💾</span>
              <span>Stats saved locally</span>
            </div>
            <div class="info-item">
              <span class="info-icon">🔒</span>
              <span>Private to this browser</span>
            </div>
            <div class="info-item">
              <span class="info-icon">⚡</span>
              <span>No account required</span>
            </div>
          </div>
          
          <div class="note">
            <small>To enable Google login, configure OAuth in the environment variables.</small>
          </div>
        </div>
    </div>

    <!-- Authenticated State -->
    <div v-else class="user-section">
      <div class="user-info">
        <div class="user-avatar">
          <img 
            v-if="user.picture" 
            :src="user.picture" 
            :alt="user.name"
            class="avatar-image"
          />
          <div v-else class="avatar-placeholder">
            {{ getUserInitials() }}
          </div>
        </div>
        
        <div class="user-details">
          <div class="user-name">{{ user.name }}</div>
          <div class="user-email">{{ user.email }}</div>
        </div>
        
        <button @click="handleLogout" class="logout-btn" title="Sign out">
          <span class="logout-icon">🚪</span>
        </button>
      </div>
      
      <div class="user-stats-preview">
        <div class="stats-item">
          <span class="stats-label">Sessions</span>
          <span class="stats-value">{{ user.stats?.sessions || 0 }}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">Best WPM</span>
          <span class="stats-value">{{ user.stats?.bestWpm || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  background: var(--sidebar-bg);
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
  border: 1px solid var(--border-color);
}

.login-section {
  text-align: center;
}

.login-prompt {
  padding: 20px 0;
}

.login-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.7;
}

.login-prompt h3 {
  margin: 0 0 8px 0;
  color: var(--font-color);
  font-size: 1.1rem;
}

.login-prompt p {
  margin: 0 0 20px 0;
  color: var(--gray);
  font-size: 0.9rem;
  line-height: 1.4;
}

.google-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.google-login-btn:hover:not(:disabled) {
  background: #3367d6;
  transform: translateY(-1px);
}

.google-login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon {
  width: 18px;
  height: 18px;
  background: white;
  color: #4285f4;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(248, 81, 73, 0.1);
  color: var(--red);
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid rgba(248, 81, 73, 0.2);
}

.guest-info {
  margin: 16px 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: var(--gray);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
}

.note {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(124, 58, 237, 0.1);
  color: var(--keyword);
  border-radius: 4px;
  font-size: 0.75rem;
  border: 1px solid rgba(124, 58, 237, 0.2);
  text-align: center;
}

.user-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: var(--keyword);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: var(--font-color);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  color: var(--gray);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--gray);
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.logout-btn:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
  border-color: var(--font-color);
}

.logout-icon {
  font-size: 0.9rem;
}

.user-stats-preview {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stats-label {
  font-size: 0.7rem;
  color: var(--gray);
  margin-bottom: 4px;
}

.stats-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--font-color);
}
</style>
