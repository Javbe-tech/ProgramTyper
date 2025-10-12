<script setup>
import { ref, onMounted } from 'vue';
import { authService } from '../services/authService.js';

const props = defineProps({
  showAds: { type: Boolean, default: true }
});
const emit = defineEmits(['remove-ads']);

const adBlocked = ref(false);
const user = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const loginError = ref('');

// Update auth state function
function updateAuthState() {
  isAuthenticated.value = authService.isUserAuthenticated();
  user.value = authService.getUser();
}

onMounted(() => {
  // Simple ad-block detection: many blockers hide elements with these class names
  const bait = document.createElement('div');
  bait.className = 'ads ad adsbox ad-banner sponsored';
  bait.style.position = 'absolute';
  bait.style.left = '-9999px';
  document.body.appendChild(bait);
  setTimeout(() => {
    const blocked = getComputedStyle(bait).display === 'none' || bait.clientHeight === 0;
    adBlocked.value = blocked;
    document.body.removeChild(bait);
  }, 50);
  
  // Initialize auth state
  updateAuthState();
  
  // Check for auth changes periodically
  setInterval(updateAuthState, 1000);
});

async function handleLogin() {
  isLoading.value = true;
  loginError.value = '';
  
  try {
    await authService.login();
    updateAuthState();
  } catch (error) {
    console.error('Login failed:', error);
    loginError.value = error.message || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to sign out? Your progress will be saved to your Google account.')) {
    authService.logout();
    updateAuthState();
  }
}

function getUserInitials() {
  if (!user.value) return '';
  const name = user.value.name || user.value.email;
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function openRemoveAds() {
  emit('remove-ads');
}
</script>

<template>
  <aside class="right-ad-bar" v-show="showAds">
    <!-- Login Section -->
    <div class="login-section-right">
      <div v-if="!isAuthenticated" class="login-prompt-right">
        <div class="login-icon-large">👤</div>
        <h3>Sign in to save progress</h3>
        <p>Your stats will sync across devices</p>
        
        <button 
          @click="handleLogin" 
          :disabled="isLoading"
          class="google-login-btn-large"
        >
          <div v-if="isLoading" class="loading-spinner-small"></div>
          <div v-else class="google-icon-large">G</div>
          <span>{{ isLoading ? 'Signing in...' : 'Sign in with Google' }}</span>
        </button>
        
        <div v-if="loginError" class="error-message-small">
          {{ loginError }}
        </div>
      </div>
      
      <!-- Authenticated User Display -->
      <div v-else class="user-info-right">
        <div class="user-avatar-large">
          <img 
            v-if="user.picture" 
            :src="user.picture" 
            :alt="user.name"
            class="avatar-image-large"
          />
          <div v-else class="avatar-placeholder-large">
            {{ getUserInitials() }}
          </div>
        </div>
        
        <div class="user-details-right">
          <div class="user-name-right">{{ user.name }}</div>
          <div class="user-email-right">{{ user.email }}</div>
        </div>
        
        <button @click="handleLogout" class="logout-btn-right" title="Sign out">
          <span class="logout-icon-right">🚪</span>
        </button>
      </div>
    </div>
    
    <div class="ad-wrapper" aria-label="Advertisement">
      <div class="ad-placeholder">Banner Ad</div>
    </div>
    <button class="remove-ads-btn" @click="openRemoveAds">🛑 Remove ads ($5)</button>
    <div class="adblock-warning" v-if="adBlocked && showAds" title="Ad blocker detected">
      <!-- white icon with red X -->
      <svg width="28" height="28" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#ffffff"/>
        <path d="M6 6 L18 18 M18 6 L6 18" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>
  </aside>
  <aside class="right-ad-bar" v-show="!showAds">
    <div class="ad-free">Thanks for supporting ProgramTyper ✨</div>
  </aside>
</template>

<style scoped>
.right-ad-bar { 
  width: 320px; 
  border-left: 1px solid var(--border-color); 
  background: var(--sidebar-bg); 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 10px; 
  padding: 10px; 
}

/* Login Section Styles */
.login-section-right {
  width: 100%;
  margin-bottom: 10px;
}

.login-prompt-right {
  text-align: center;
  padding: 20px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.login-icon-large {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.8;
}

.login-prompt-right h3 {
  margin: 0 0 8px 0;
  color: var(--font-color);
  font-size: 1.1rem;
}

.login-prompt-right p {
  margin: 0 0 16px 0;
  color: var(--gray);
  font-size: 0.9rem;
}

.google-login-btn-large {
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

.google-login-btn-large:hover:not(:disabled) {
  background: #3367d6;
  transform: translateY(-1px);
}

.google-login-btn-large:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.google-icon-large {
  width: 20px;
  height: 20px;
  background: white;
  color: #4285f4;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  /* animation: spin 1s linear infinite; */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message-small {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(248, 81, 73, 0.1);
  color: var(--red);
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid rgba(248, 81, 73, 0.2);
}

/* User Info Styles */
.user-info-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.user-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  width: 100%;
  height: 100%;
  background: var(--keyword);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-details-right {
  text-align: center;
  min-width: 0;
}

.user-name-right {
  font-weight: 500;
  color: var(--font-color);
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.user-email-right {
  color: var(--gray);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.logout-btn-right {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--gray);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
}

.logout-btn-right:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
  border-color: var(--font-color);
  opacity: 1;
}

.logout-icon-right {
  font-size: 0.9rem;
}

/* Ad Styles */
.ad-wrapper { width: 100%; }
.ad-placeholder { width: 100%; height: 250px; border: 1px dashed var(--border-color); border-radius: 6px; color: var(--gray); display: flex; align-items: center; justify-content: center; background: var(--bg-color); }
.remove-ads-btn { width: 100%; background: var(--keyword); color: #fff; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; }
.remove-ads-btn:hover { background: #6d28d9; }
.adblock-warning { margin-top: 6px; }
.ad-free { color: var(--gray); font-size: 0.9rem; text-align: center; }
</style>


