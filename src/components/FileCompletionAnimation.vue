<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  fileName: { type: String, default: '' },
  stats: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['close']);

const animationStep = ref(0);
const highlightProgress = ref(0);
const animationTimer = ref(null);

// ASCII art for completion messages
const completionMessages = [
  `╔══════════════════════════════════════╗
║          🎉 FILE COMPLETED! 🎉         ║
║                                        ║
║    Your code is now production ready!  ║
║                                        ║
╚══════════════════════════════════════╝`,

  `╔══════════════════════════════════════╗
║         ⚡ CODE MASTERED! ⚡          ║
║                                        ║
║    Another file conquered! Well done!  ║
║                                        ║
╚══════════════════════════════════════╝`,

  `╔══════════════════════════════════════╗
║        🚀 DEPLOYMENT READY! 🚀        ║
║                                        ║
║    This code is ready for production!  ║
║                                        ║
╚══════════════════════════════════════╝`,

  `╔══════════════════════════════════════╗
║         💻 HACKER LEVEL UP! 💻         ║
║                                        ║
║    Your typing skills are legendary!   ║
║                                        ║
╚══════════════════════════════════════╝`,

  `╔══════════════════════════════════════╗
║        🔥 CODE ON FIRE! 🔥            ║
║                                        ║
║    You're coding like a true master!  ║
║                                        ║
╚══════════════════════════════════════╝`
];

// Funny completion stats
const funnyStats = [
  "Your fingers moved faster than light!",
  "You typed so fast, time itself slowed down!",
  "Your code is so clean, it sparkles!",
  "You've achieved typing nirvana!",
  "Your keyboard is now sentient!",
  "You've unlocked the 'Speed Demon' achievement!",
  "Your code is so efficient, it runs backwards!",
  "You've transcended mortal typing limits!",
  "Your fingers are now quantum entangled!",
  "You've achieved the legendary 'Code Whisperer' status!"
];

const currentMessage = ref('');
const currentFunnyStat = ref('');

function startAnimation() {
  if (!props.show) return;
  
  // Select random message and funny stat
  currentMessage.value = completionMessages[Math.floor(Math.random() * completionMessages.length)];
  currentFunnyStat.value = funnyStats[Math.floor(Math.random() * funnyStats.length)];
  
  animationStep.value = 0;
  highlightProgress.value = 0;
  
  // Step 1: Scroll to top and highlight (5-8 seconds)
  animationStep.value = 1;
  const highlightDuration = 6000; // 6 seconds
  const highlightInterval = 50; // Update every 50ms
  const totalSteps = highlightDuration / highlightInterval;
  
  let currentStep = 0;
  animationTimer.value = setInterval(() => {
    currentStep++;
    highlightProgress.value = (currentStep / totalSteps) * 100;
    
    if (currentStep >= totalSteps) {
      clearInterval(animationTimer.value);
      // Step 2: Show completion popup
      animationStep.value = 2;
      
      // Auto-close after 4 seconds
      setTimeout(() => {
        emit('close');
      }, 4000);
    }
  }, highlightInterval);
}

function stopAnimation() {
  if (animationTimer.value) {
    clearInterval(animationTimer.value);
    animationTimer.value = null;
  }
  animationStep.value = 0;
  highlightProgress.value = 0;
}

onMounted(() => {
  if (props.show) {
    startAnimation();
  }
});

// Watch for show prop changes
watch(() => props.show, (newValue) => {
  if (newValue) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

onUnmounted(() => {
  stopAnimation();
});
</script>

<template>
  <div v-if="show" class="file-completion-overlay">
    <!-- Highlight animation -->
    <div v-if="animationStep === 1" class="highlight-animation">
      <div class="highlight-bar" :style="{ width: highlightProgress + '%' }"></div>
    </div>
    
    <!-- Completion popup -->
    <div v-if="animationStep === 2" class="completion-popup">
      <div class="completion-content">
        <pre class="ascii-art">{{ currentMessage }}</pre>
        
        <div class="file-info">
          <h3>{{ fileName }}</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Average WPM</span>
              <span class="stat-value">{{ stats.averageWpm || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Accuracy</span>
              <span class="stat-value">{{ stats.accuracy || 0 }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Time</span>
              <span class="stat-value">{{ stats.time || '0s' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Lines</span>
              <span class="stat-value">{{ stats.lines || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="funny-stat">
          {{ currentFunnyStat }}
        </div>
        
        <div class="next-file-prompt">
          <p>🎯 Ready for your next challenge?</p>
          <p>Select another file from the sidebar to continue!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-completion-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
  pointer-events: none;
}

.highlight-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 255, 0, 0.1) 50%, 
    transparent 100%
  );
  animation: highlightSweep 6s ease-in-out;
}

.highlight-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 255, 0, 0.2) 50%, 
    transparent 100%
  );
  transition: width 0.05s linear;
}

.completion-popup {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-color);
  border: 2px solid var(--completed-green);
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: popupAppear 0.5s ease-out;
}

.completion-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ascii-art {
  color: var(--completed-green);
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  line-height: 1.2;
  margin: 0;
  text-shadow: 0 0 10px var(--completed-green);
}

.file-info h3 {
  color: var(--font-color);
  margin: 0 0 15px 0;
  font-size: 1.2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--sidebar-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.stat-label {
  color: var(--gray);
  font-size: 0.8rem;
  margin-bottom: 5px;
}

.stat-value {
  color: var(--font-color);
  font-size: 1.1rem;
  font-weight: bold;
}

.funny-stat {
  color: var(--keyword);
  font-style: italic;
  font-size: 0.9rem;
  padding: 10px;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.next-file-prompt {
  color: var(--gray);
  font-size: 0.85rem;
  line-height: 1.4;
}

.next-file-prompt p {
  margin: 5px 0;
}

@keyframes highlightSweep {
  0% { 
    background-position: -100% 0;
    opacity: 0;
  }
  50% { 
    opacity: 1;
  }
  100% { 
    background-position: 100% 0;
    opacity: 0;
  }
}

@keyframes popupAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
