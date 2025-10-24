<script setup>
import { ref, onMounted } from 'vue';
import { authService } from '../services/authService.js';

const emit = defineEmits(['close']);

const showWelcome = ref(false);

// Check if user has dismissed the welcome screen
onMounted(async () => {
  try {
    const user = await authService.getUser();
    if (user) {
      // Check user's preferences for welcome screen
      const welcomeDismissed = localStorage.getItem(`welcome_dismissed_${user.id}`);
      if (!welcomeDismissed) {
        showWelcome.value = true;
      }
    } else {
      // For non-authenticated users, check general localStorage
      const welcomeDismissed = localStorage.getItem('welcome_dismissed');
      if (!welcomeDismissed) {
        showWelcome.value = true;
      }
    }
  } catch (error) {
    // If there's an error getting user, show welcome for non-authenticated users
    const welcomeDismissed = localStorage.getItem('welcome_dismissed');
    if (!welcomeDismissed) {
      showWelcome.value = true;
    }
  }
});

function dismissWelcome() {
  showWelcome.value = false;
  emit('close');
}

async function dontShowAgain() {
  try {
    const user = await authService.getUser();
    if (user) {
      // Save preference for authenticated user
      localStorage.setItem(`welcome_dismissed_${user.id}`, 'true');
    } else {
      // Save preference for non-authenticated user
      localStorage.setItem('welcome_dismissed', 'true');
    }
  } catch (error) {
    // Fallback to general localStorage
    localStorage.setItem('welcome_dismissed', 'true');
  }
  
  showWelcome.value = false;
  emit('close');
}
</script>

<template>
  <div v-if="showWelcome" class="welcome-overlay">
    <div class="welcome-modal">
      <div class="welcome-header">
        <h1>Welcome to CodeTyper Pro!</h1>
        <div class="welcome-icon">⌨️</div>
      </div>
      
      <div class="welcome-content">
        <p class="welcome-intro">
          This is a <strong>fake coding environment</strong> where you can practice your typing speed while experiencing immersive story campaigns!
        </p>
        
        <div class="welcome-features">
          <div class="feature-item">
            <span class="feature-icon">🎨</span>
            <span>Choose from <strong>7 unique themes</strong> - Matrix, Cyberpunk, Psychedelic, and more!</span>
          </div>
          
          <div class="feature-item">
            <span class="feature-icon">💬</span>
            <span>Experience <strong>4 story campaigns</strong> with branching narratives and boss battles!</span>
          </div>
          
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <span>Practice typing with <strong>realistic code files</strong> that match each campaign's theme!</span>
          </div>
          
          <div class="feature-item">
            <span class="feature-icon">🏆</span>
            <span>Unlock <strong>hidden campaigns</strong> and discover secret endings!</span>
          </div>
        </div>
        
        <div class="welcome-tip">
          <p><strong>💡 Pro Tip:</strong> Try different themes and campaigns to find hidden gems and unlock new content!</p>
        </div>
      </div>
      
      <div class="welcome-actions">
        <button @click="dismissWelcome" class="welcome-btn primary">
          Let's Code! 🚀
        </button>
        <button @click="dontShowAgain" class="welcome-btn secondary">
          Don't show this message again
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.welcome-modal {
  background: var(--bg-color);
  border: 2px solid var(--keyword);
  border-radius: 12px;
  padding: 25px;
  max-width: 500px;
  width: 85%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.4s ease-out;
}

.welcome-header {
  text-align: center;
  margin-bottom: 20px;
}

.welcome-header h1 {
  color: var(--font-color);
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  font-weight: bold;
}

.welcome-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.welcome-content {
  margin-bottom: 20px;
}

.welcome-intro {
  color: var(--font-color);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 15px;
  text-align: center;
}

.welcome-features {
  margin-bottom: 15px;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: var(--font-color);
  font-size: 0.9rem;
  line-height: 1.4;
}

.feature-icon {
  font-size: 1.3rem;
  margin-right: 10px;
  min-width: 25px;
}

.welcome-tip {
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  margin-top: 15px;
}

.welcome-tip p {
  color: var(--font-color);
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.welcome-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.welcome-btn {
  padding: 12px 24px;
  border: 2px solid var(--keyword);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.welcome-btn.primary {
  background: var(--keyword);
  color: var(--bg-primary);
}

.welcome-btn.primary:hover {
  background: var(--bg-primary);
  color: var(--keyword);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.welcome-btn.secondary {
  background: transparent;
  color: var(--font-color);
}

.welcome-btn.secondary:hover {
  background: var(--keyword);
  color: var(--bg-primary);
  transform: translateY(-2px);
}

/* Theme-specific overrides */
[data-theme="matrix"] .welcome-modal {
  border-color: #00ff95;
  box-shadow: 0 20px 40px rgba(0, 255, 149, 0.2);
}

[data-theme="cyberpunk"] .welcome-modal {
  border-color: #ff2bd6;
  box-shadow: 0 20px 40px rgba(255, 43, 214, 0.2);
}

[data-theme="psychedelic"] .welcome-modal {
  background: linear-gradient(135deg, 
    rgba(244, 114, 182, 0.95) 0%, 
    rgba(96, 165, 250, 0.95) 25%, 
    rgba(52, 211, 153, 0.95) 50%, 
    rgba(251, 191, 36, 0.95) 75%, 
    rgba(168, 139, 250, 0.95) 100%
  );
  backdrop-filter: blur(10px);
}

[data-theme="white"] .welcome-modal {
  background: #ffffff;
  border-color: #000000;
}

[data-theme="white"] .welcome-header h1,
[data-theme="white"] .welcome-intro,
[data-theme="white"] .feature-item,
[data-theme="white"] .welcome-tip p {
  color: #000000;
}

[data-theme="white"] .welcome-btn.secondary {
  color: #000000;
  border-color: #000000;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .welcome-modal {
    padding: 20px;
    margin: 20px;
  }
  
  .welcome-header h1 {
    font-size: 1.8rem;
  }
  
  .welcome-actions {
    flex-direction: column;
  }
  
  .welcome-btn {
    min-width: auto;
    width: 100%;
  }
}
</style>
