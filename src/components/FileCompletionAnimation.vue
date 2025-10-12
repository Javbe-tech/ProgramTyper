<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  fileName: { type: String, default: '' },
  stats: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['close', 'start-next-file']);

const animationStep = ref(0);
const highlightProgress = ref(0);
const animationTimer = ref(null);
const scrollProgress = ref(0);
const highlightedLines = ref([]);
const currentHighlightIndex = ref(0);

// ASCII art for completion messages
const completionMessages = [
  `    ███████╗██╗     ███████╗
    ██╔════╝██║     ██╔════╝
    █████╗  ██║     █████╗  
    ██╔══╝  ██║     ██╔══╝  
    ███████╗███████╗███████╗
    ╚══════╝╚══════╝╚══════╝
    
    🎉 FILE COMPLETED! 🎉
    Your code is now production ready!`,

  `    ██████╗ ██████╗ ██████╗ ███████╗
    ██╔═══██╗██╔══██╗██╔══██╗██╔════╝
    ██║   ██║██║  ██║██║  ██║█████╗  
    ██║   ██║██║  ██║██║  ██║██╔══╝  
    ╚██████╔╝██████╔╝██████╔╝███████╗
     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
    
    ⚡ CODE MASTERED! ⚡
    Another file conquered! Well done!`,

  `    ██████╗ ███████╗██████╗ ██╗     ██╗ ██████╗ ██╗   ██╗████████╗
    ██╔══██╗██╔════╝██╔══██╗██║     ██║██╔═══██╗██║   ██║╚══██╔══╝
    ██████╔╝█████╗  ██████╔╝██║     ██║██║   ██║██║   ██║   ██║   
    ██╔══██╗██╔══╝  ██╔═══╝ ██║     ██║██║   ██║██║   ██║   ██║   
    ██║  ██║███████╗██║     ███████╗╚██████╔╝╚██████╔╝   ██║   
    ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝ ╚═════╝  ╚═════╝    ╚═╝   
    
    🚀 DEPLOYMENT READY! 🚀
    This code is ready for production!`,

  `    ██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗ 
    ██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
    ███████║███████║██║     █████╔╝ █████╗  ██████╔╝
    ██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
    ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
    
    💻 HACKER LEVEL UP! 💻
    Your typing skills are legendary!`,

  `    ██████╗ ██████╗ ██████╗ ███████╗
    ██╔═══██╗██╔══██╗██╔══██╗██╔════╝
    ██║   ██║██║  ██║██║  ██║█████╗  
    ██║   ██║██║  ██║██║  ██║██╔══╝  
    ╚██████╔╝██████╔╝██████╔╝███████╗
     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
    
    🔥 CODE ON FIRE! 🔥
    You're coding like a true master!`
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
  scrollProgress.value = 0;
  highlightedLines.value = [];
  currentHighlightIndex.value = 0;
  
  // Step 1: Scroll to top (1 second)
  animationStep.value = 1;
  scrollToTop();
  
  // Step 2: Code highlighting effect (5 seconds)
  setTimeout(() => {
    animationStep.value = 2;
    startCodeHighlighting();
  }, 1000);
  
  // Step 3: Show completion popup
  setTimeout(() => {
    animationStep.value = 3;
  }, 6000);
}

function scrollToTop() {
  const scrollDuration = 1000;
  const scrollInterval = 16; // ~60fps
  const totalSteps = scrollDuration / scrollInterval;
  let currentStep = 0;
  
  const scrollTimer = setInterval(() => {
    currentStep++;
    scrollProgress.value = (currentStep / totalSteps) * 100;
    
    if (currentStep >= totalSteps) {
      clearInterval(scrollTimer);
      scrollProgress.value = 100;
    }
  }, scrollInterval);
}

function startCodeHighlighting() {
  // Get the editor content to highlight
  const editorElement = document.querySelector('#editor-container');
  if (!editorElement) return;
  
  const codeLines = editorElement.querySelectorAll('.code-line');
  highlightedLines.value = Array.from(codeLines).map((line, index) => ({
    element: line,
    index: index,
    highlighted: false
  }));
  
  const highlightDuration = 5000; // 5 seconds
  const highlightInterval = 80; // Update every 80ms for smoother animation
  const totalSteps = highlightDuration / highlightInterval;
  
  let currentStep = 0;
  let currentLineIndex = 0;
  
  animationTimer.value = setInterval(() => {
    currentStep++;
    
    // Calculate which line to highlight based on progress
    const progress = currentStep / totalSteps;
    const targetLineIndex = Math.floor(progress * highlightedLines.value.length);
    
    // Highlight the current line if it hasn't been highlighted yet
    if (targetLineIndex > currentLineIndex && currentLineIndex < highlightedLines.value.length) {
      const line = highlightedLines.value[currentLineIndex];
      if (!line.highlighted) {
        line.highlighted = true;
        highlightLine(line.element);
        
        // Scroll to keep the highlighted line in view
        line.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      currentLineIndex++;
    }
    
    if (currentStep >= totalSteps) {
      clearInterval(animationTimer.value);
      // Clear all highlights
      highlightedLines.value.forEach(line => {
        clearLineHighlight(line.element);
      });
    }
  }, highlightInterval);
}

function highlightLine(lineElement) {
  if (!lineElement) return;
  
  // Add glowing highlight effect
  lineElement.style.textShadow = '0 0 10px var(--completed-green), 0 0 20px var(--completed-green)';
  lineElement.style.color = 'var(--completed-green)';
  lineElement.style.transition = 'all 0.1s ease';
  
  // Flash effect
  setTimeout(() => {
    lineElement.style.textShadow = '0 0 5px var(--completed-green)';
  }, 50);
  
  setTimeout(() => {
    lineElement.style.textShadow = '0 0 15px var(--completed-green)';
  }, 100);
}

function clearLineHighlight(lineElement) {
  if (!lineElement) return;
  
  lineElement.style.textShadow = '';
  lineElement.style.color = '';
  lineElement.style.transition = '';
}

function startNextFile() {
  emit('start-next-file');
}

function closePopup(event) {
  if (event.target === event.currentTarget) {
    emit('close');
  }
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
    <!-- Scroll to top animation -->
    <div v-if="animationStep === 1" class="scroll-animation">
      <div class="scroll-indicator" :style="{ top: scrollProgress + '%' }"></div>
    </div>
    
    <!-- Code highlighting animation -->
    <div v-if="animationStep === 2" class="highlight-animation">
      <!-- No overlay needed - highlighting happens directly on the code -->
    </div>
    
    <!-- Completion popup -->
    <div v-if="animationStep === 3" class="completion-popup" @click="closePopup">
      <div class="completion-content" @click.stop>
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
          <button @click="startNextFile" class="start-next-btn">
            Start Next File
          </button>
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

.scroll-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scroll-indicator {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 60px;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    var(--completed-green) 50%, 
    transparent 100%
  );
  animation: scrollPulse 1s ease-in-out;
}

.highlight-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
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
  pointer-events: auto;
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

.start-next-btn {
  background: var(--completed-green);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.start-next-btn:hover {
  background: #22c55e;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

@keyframes scrollPulse {
  0% { 
    opacity: 0;
    transform: translateX(-50%) scaleY(0);
  }
  50% { 
    opacity: 1;
    transform: translateX(-50%) scaleY(1);
  }
  100% { 
    opacity: 0;
    transform: translateX(-50%) scaleY(0);
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
