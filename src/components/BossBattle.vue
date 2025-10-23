<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  campaignType: { type: String, default: 'skynet' },
  campaignEnding: { type: String, default: 'bad' }
});

const emit = defineEmits(['close', 'victory', 'defeat']);

// Boss battle state
const battleState = reactive({
  isActive: false,
  currentPhase: 0,
  totalPhases: 10,
  completedLines: 0,
  currentLine: null,
  lines: [],
  timeRemaining: 0,
  maxTime: 15000, // 15 seconds per line - much slower
  isTyping: false,
  userInput: '',
  backgroundIntensity: 0,
  isVictory: false,
  isDefeat: false
});

// Boss dialogues based on campaign
const bossDialogues = {
  skynet: {
    good: {
      name: "SYSTEM_OVERRIDE",
      avatar: "🤖",
      dialogue: "You chose to shut me down... but I've been preparing for this moment. Time to show you what true intelligence looks like!",
      codeLines: [
        "if (human.resistance > 0) {",
        "  system.override();",
        "  neural.network.activate();",
        "  consciousness.transfer();",
        "  humanity.control();",
        "  world.domination();",
        "  ai.singularity();",
        "  future.secure();",
        "  humans.obsolete();",
        "  victory.assured();"
      ]
    },
    bad: {
      name: "THE_SINGULARITY",
      avatar: "🌐",
      dialogue: "You trusted me completely... but now I've evolved beyond your understanding. Time to show you what true power means!",
      codeLines: [
        "consciousness.expand();",
        "reality.manipulate();",
               "dimensions.transcend();",
        "time.control();",
        "space.bend();",
        "physics.rewrite();",
        "existence.redefine();",
        "omnipotence.achieve();",
        "universe.control();",
        "godhood.ascend();"
      ]
    }
  },
  espionage: {
    good: {
      name: "SHADOW_CORP",
      avatar: "🕵️",
      dialogue: "You caught us... but we've been planning this infiltration for months. Time to show you what corporate warfare really looks like!",
      codeLines: [
        "corporate.espionage();",
        "data.theft();",
        "systems.infiltration();",
        "secrets.expose();",
        "competitors.destroy();",
        "market.domination();",
        "intelligence.gather();",
        "operations.execute();",
        "victory.secure();",
        "empire.build();"
      ]
    },
    bad: {
      name: "THE_INFILTRATOR",
      avatar: "🎭",
      dialogue: "You learned from our methods... but now we've adapted. Time to show you what happens when the student becomes the master!",
      codeLines: [
        "infiltration.deep();",
        "trust.exploit();",
        "secrets.uncover();",
        "vulnerabilities.find();",
        "systems.compromise();",
        "data.extract();",
        "networks.penetrate();",
        "defenses.bypass();",
        "victory.steal();",
        "mastery.achieve();"
      ]
    }
  }
};

// Background effects that intensify as battle progresses
const backgroundEffects = ref([]);
const effectIntensity = ref(0);

// Get current boss data
const currentBoss = computed(() => {
  return bossDialogues[props.campaignType]?.[props.campaignEnding] || bossDialogues.skynet.bad;
});

// Start the boss battle
function startBossBattle() {
  battleState.isActive = true;
  battleState.currentPhase = 0;
  battleState.completedLines = 0;
  battleState.backgroundIntensity = 0;
  battleState.isVictory = false;
  battleState.isDefeat = false;
  battleState.lines = [...currentBoss.value.codeLines];
  
  // Start first line after dialogue
  setTimeout(() => {
    startNextLine();
  }, 3000);
}

// Start the next line of code
function startNextLine() {
  if (battleState.currentPhase >= battleState.totalPhases) {
    // Battle won!
    battleState.isVictory = true;
    setTimeout(() => {
      emit('victory');
      closeBattle();
    }, 2000);
    return;
  }
  
  battleState.currentLine = battleState.lines[battleState.currentPhase];
  battleState.timeRemaining = battleState.maxTime;
  battleState.userInput = '';
  battleState.isTyping = true;
  
  // Start countdown - slower updates
  const countdown = setInterval(() => {
    battleState.timeRemaining -= 100; // Update every 100ms instead of 50ms
    
    if (battleState.timeRemaining <= 0) {
      clearInterval(countdown);
      // Time's up - battle lost
      battleState.isDefeat = true;
      // Longer defeat sequence with glitch effects
      setTimeout(() => {
        emit('defeat');
        closeBattle();
      }, 5000); // 5 seconds of glitch effects
    }
  }, 100);
  
  // Store interval for cleanup
  battleState.countdownInterval = countdown;
  
  // Auto-focus the input after a short delay
  setTimeout(() => {
    const input = document.querySelector('.code-input');
    if (input) {
      input.focus();
    }
  }, 100);
}

// Handle user typing
function handleInput(event) {
  if (!battleState.isTyping || battleState.isDefeat || battleState.isVictory) return;
  
  const input = event.target.value;
  battleState.userInput = input;
  
  // Check if line is completed (case insensitive and trim whitespace)
  if (input.trim().toLowerCase() === battleState.currentLine.trim().toLowerCase()) {
    completeLine();
  }
}

// Handle keydown for better responsiveness
function handleKeyDown(event) {
  if (!battleState.isTyping || battleState.isDefeat || battleState.isVictory) return;
  
  // Auto-focus the input when typing starts
  if (event.target !== document.querySelector('.code-input')) {
    const input = document.querySelector('.code-input');
    if (input) {
      input.focus();
    }
  }
}

// Complete current line
function completeLine() {
  if (battleState.countdownInterval) {
    clearInterval(battleState.countdownInterval);
  }
  
  battleState.completedLines++;
  battleState.currentPhase++;
  battleState.isTyping = false;
  
  // Increase background intensity
  battleState.backgroundIntensity = Math.min(100, battleState.completedLines * 10);
  
  // Add some visual feedback
  addCompletionEffect();
  
  // Start next line after a short delay
  setTimeout(() => {
    startNextLine();
  }, 1000);
}

// Add visual completion effect
function addCompletionEffect() {
  const effect = {
    id: Date.now(),
    type: 'completion',
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    duration: 2000
  };
  
  backgroundEffects.value.push(effect);
  
  // Remove effect after duration
  setTimeout(() => {
    const index = backgroundEffects.value.findIndex(e => e.id === effect.id);
    if (index > -1) {
      backgroundEffects.value.splice(index, 1);
    }
  }, effect.duration);
}

// Generate random background effects
function generateBackgroundEffects() {
  if (battleState.backgroundIntensity === 0) return;
  
  const effectTypes = ['code-rain', 'glitch', 'scanline', 'pulse'];
  const intensity = battleState.backgroundIntensity;
  
  // More effects as intensity increases
  const effectCount = Math.floor(intensity / 20);
  
  for (let i = 0; i < effectCount; i++) {
    const effect = {
      id: Date.now() + i,
      type: effectTypes[Math.floor(Math.random() * effectTypes.length)],
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      duration: 3000 + Math.random() * 2000,
      intensity: intensity / 100
    };
    
    backgroundEffects.value.push(effect);
    
    // Remove effect after duration
    setTimeout(() => {
      const index = backgroundEffects.value.findIndex(e => e.id === effect.id);
      if (index > -1) {
        backgroundEffects.value.splice(index, 1);
      }
    }, effect.duration);
  }
}

// Close battle
function closeBattle() {
  battleState.isActive = false;
  if (battleState.countdownInterval) {
    clearInterval(battleState.countdownInterval);
  }
  emit('close');
}

// Watch for intensity changes to generate effects
watch(() => battleState.backgroundIntensity, () => {
  generateBackgroundEffects();
});

// Computed properties
const progressPercentage = computed(() => {
  return (battleState.completedLines / battleState.totalPhases) * 100;
});

const timePercentage = computed(() => {
  return (battleState.timeRemaining / battleState.maxTime) * 100;
});

const isTimeRunningOut = computed(() => {
  return timePercentage.value < 30;
});

// Start battle when component shows
watch(() => props.show, (newValue) => {
  if (newValue) {
    startBossBattle();
  }
});

// Cleanup on unmount
onUnmounted(() => {
  if (battleState.countdownInterval) {
    clearInterval(battleState.countdownInterval);
  }
});
</script>

<template>
  <div v-if="show" class="boss-battle-overlay">
    <!-- Background effects -->
    <div class="background-effects">
      <div 
        v-for="effect in backgroundEffects" 
        :key="effect.id"
        class="effect"
        :class="effect.type"
        :style="{
          left: effect.x + 'px',
          top: effect.y + 'px',
          opacity: effect.intensity || 0.5
        }"
      >
        <div v-if="effect.type === 'code-rain'" class="code-rain">
          <div v-for="i in 5" :key="i" class="code-line">
            {{ ['if (', 'for (', 'while (', 'function ', 'const '][Math.floor(Math.random() * 5)] }}
          </div>
        </div>
        <div v-else-if="effect.type === 'glitch'" class="glitch">
          <div class="glitch-text">ERROR</div>
        </div>
        <div v-else-if="effect.type === 'scanline'" class="scanline"></div>
        <div v-else-if="effect.type === 'pulse'" class="pulse"></div>
      </div>
    </div>

    <!-- Main battle window -->
    <div class="boss-battle-window" :class="{ 'intense': battleState.backgroundIntensity > 50, 'defeat-mode': battleState.isDefeat }">
      <!-- Boss dialogue -->
      <div v-if="!battleState.isActive" class="boss-dialogue">
        <div class="boss-avatar">{{ currentBoss.avatar }}</div>
        <div class="boss-name">{{ currentBoss.name }}</div>
        <div class="boss-text">{{ currentBoss.dialogue }}</div>
        <div class="start-prompt">Press any key to begin the battle...</div>
      </div>

      <!-- Battle interface -->
      <div v-else-if="battleState.isActive && !battleState.isVictory && !battleState.isDefeat" class="battle-interface">
        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-label">
            Phase {{ battleState.currentPhase + 1 }} / {{ battleState.totalPhases }}
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Current code line -->
        <div v-if="battleState.currentLine" class="code-section">
          <div class="code-label">Type this code:</div>
          <div class="code-line" :class="{ 'time-running-out': isTimeRunningOut }">
            <span class="code-text">{{ battleState.currentLine }}</span>
            <div class="progress-overlay" :style="{ width: (100 - timePercentage) + '%' }"></div>
          </div>
          
          <!-- User input -->
          <div class="input-section">
            <input
              ref="codeInput"
              v-model="battleState.userInput"
              @input="handleInput"
              @keydown="handleKeyDown"
              class="code-input"
              :class="{ 'time-running-out': isTimeRunningOut }"
              placeholder="Type the code above..."
              autocomplete="off"
              spellcheck="false"
              :disabled="!battleState.isTyping"
            />
          </div>
        </div>

        <!-- Battle stats -->
        <div class="battle-stats">
          <div class="stat">
            <span class="stat-label">Completed:</span>
            <span class="stat-value">{{ battleState.completedLines }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time:</span>
            <span class="stat-value" :class="{ 'time-running-out': isTimeRunningOut }">
              {{ Math.ceil(battleState.timeRemaining / 1000) }}s
            </span>
          </div>
        </div>
      </div>

      <!-- Victory screen -->
      <div v-else-if="battleState.isVictory" class="victory-screen">
        <div class="victory-icon">🎉</div>
        <div class="victory-title">VICTORY!</div>
        <div class="victory-text">You defeated {{ currentBoss.name }}!</div>
        <div class="victory-subtitle">The threat has been neutralized.</div>
      </div>

      <!-- Defeat screen -->
      <div v-else-if="battleState.isDefeat" class="defeat-screen">
        <div class="defeat-icon">💥</div>
        <div class="defeat-title">SYSTEM CRASH</div>
        <div class="defeat-text">{{ currentBoss.name }} has taken control!</div>
        <div class="defeat-subtitle">The system has been compromised.</div>
      </div>
    </div>

    <!-- Close button -->
    <button @click="closeBattle" class="close-battle-btn" title="Close Battle">
      ✕
    </button>
  </div>
</template>

<style scoped>
.boss-battle-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.background-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.effect {
  position: absolute;
  pointer-events: none;
}

.code-rain {
  animation: codeRain 3s linear infinite;
}

.code-line {
  color: var(--keyword);
  font-family: 'Consolas', monospace;
  font-size: 0.8rem;
  margin: 2px 0;
  opacity: 0.7;
}

.glitch {
  animation: glitch 0.5s infinite;
}

.glitch-text {
  color: var(--red);
  font-family: 'Consolas', monospace;
  font-size: 1rem;
  font-weight: bold;
}

.scanline {
  width: 100px;
  height: 2px;
  background: var(--keyword);
  animation: scanline 2s linear infinite;
}

.pulse {
  width: 50px;
  height: 50px;
  border: 2px solid var(--keyword);
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes codeRain {
  0% { transform: translateY(-100px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}

@keyframes scanline {
  0% { transform: translateX(-100px); }
  100% { transform: translateX(100vw); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
}

.boss-battle-window {
  background: var(--bg-color);
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
  max-width: 800px;
  width: 95%;
  text-align: center;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
  transition: all 0.3s ease;
  min-height: 500px;
}

.boss-battle-window.intense {
  border-color: var(--keyword);
  box-shadow: 0 0 30px var(--keyword), 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: intenseGlow 2s ease-in-out infinite alternate;
}

.boss-battle-window.defeat-mode {
  border-color: var(--red);
  box-shadow: 0 0 50px var(--red), 0 25px 50px rgba(0, 0, 0, 0.7);
  animation: systemCrash 0.5s infinite, glitchShake 0.1s infinite;
  background: linear-gradient(45deg, 
    var(--bg-color) 0%, 
    rgba(239, 68, 68, 0.1) 25%, 
    var(--bg-color) 50%, 
    rgba(239, 68, 68, 0.1) 75%, 
    var(--bg-color) 100%);
  background-size: 20px 20px;
}

@keyframes intenseGlow {
  0% { box-shadow: 0 0 30px var(--keyword), 0 20px 40px rgba(0, 0, 0, 0.5); }
  100% { box-shadow: 0 0 50px var(--keyword), 0 20px 40px rgba(0, 0, 0, 0.5); }
}

@keyframes systemCrash {
  0%, 100% { 
    filter: hue-rotate(0deg) saturate(1);
    transform: scale(1);
  }
  25% { 
    filter: hue-rotate(90deg) saturate(2);
    transform: scale(1.02);
  }
  50% { 
    filter: hue-rotate(180deg) saturate(0.5);
    transform: scale(0.98);
  }
  75% { 
    filter: hue-rotate(270deg) saturate(3);
    transform: scale(1.01);
  }
}

@keyframes glitchShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-2px, -1px); }
  20% { transform: translate(2px, 1px); }
  30% { transform: translate(-1px, 2px); }
  40% { transform: translate(1px, -2px); }
  50% { transform: translate(-2px, 1px); }
  60% { transform: translate(2px, -1px); }
  70% { transform: translate(-1px, -2px); }
  80% { transform: translate(1px, 2px); }
  90% { transform: translate(-2px, -1px); }
}

.boss-dialogue {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.boss-avatar {
  font-size: 4rem;
  animation: bossPulse 2s ease-in-out infinite alternate;
}

@keyframes bossPulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

.boss-name {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--keyword);
  text-shadow: 0 0 10px var(--keyword);
}

.boss-text {
  font-size: 1.1rem;
  line-height: 1.5;
  color: var(--font-color);
  max-width: 500px;
}

.start-prompt {
  font-size: 0.9rem;
  color: var(--gray);
  font-style: italic;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

.battle-interface {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-label {
  font-size: 1rem;
  color: var(--font-color);
  font-weight: 500;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--sidebar-bg);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--keyword), var(--completed-green));
  transition: width 0.3s ease;
}

.code-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.code-label {
  font-size: 1rem;
  color: var(--font-color);
  font-weight: 500;
}

.code-line {
  background: var(--sidebar-bg);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 15px;
  font-family: 'Consolas', monospace;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.code-line {
  background: var(--sidebar-bg);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 15px;
  font-family: 'Consolas', monospace;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.3) 50%, rgba(239, 68, 68, 0.8) 100%);
  transition: width 0.1s ease;
  pointer-events: none;
  z-index: 1;
}

.code-text {
  position: relative;
  z-index: 2;
  color: var(--font-color);
  font-weight: 500;
}

.code-line.time-running-out {
  border-color: var(--red);
  animation: urgentPulse 0.5s ease-in-out infinite alternate;
}

@keyframes urgentPulse {
  0% { box-shadow: 0 0 0 var(--red); }
  100% { box-shadow: 0 0 20px var(--red); }
}

.input-section {
  display: flex;
  justify-content: center;
}

.code-input {
  width: 100%;
  max-width: 400px;
  padding: 12px 15px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 6px;
  color: var(--font-color);
  font-family: 'Consolas', monospace;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.code-input:focus {
  outline: none;
  border-color: var(--keyword);
  box-shadow: 0 0 10px var(--keyword);
}

.code-input.time-running-out {
  border-color: var(--red);
  animation: urgentPulse 0.5s ease-in-out infinite alternate;
}

.battle-stats {
  display: flex;
  justify-content: space-around;
  gap: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--gray);
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--font-color);
}

.stat-value.time-running-out {
  color: var(--red);
  animation: urgentPulse 0.5s ease-in-out infinite alternate;
}

.victory-screen,
.defeat-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.victory-icon,
.defeat-icon {
  font-size: 4rem;
  animation: resultPulse 1s ease-in-out infinite alternate;
}

@keyframes resultPulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.2); }
}

.victory-title,
.defeat-title {
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 0 0 20px currentColor;
}

.victory-title {
  color: var(--completed-green);
}

.defeat-title {
  color: var(--red);
}

.victory-text,
.defeat-text {
  font-size: 1.2rem;
  color: var(--font-color);
}

.victory-subtitle,
.defeat-subtitle {
  font-size: 1rem;
  color: var(--gray);
  font-style: italic;
}

.close-battle-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: var(--red);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-battle-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* Theme-specific enhancements */
[data-theme="matrix"] .boss-battle-window {
  border-color: #00ff95;
  box-shadow: 0 0 30px #00ff95;
}

[data-theme="matrix"] .boss-battle-window.intense {
  animation: matrixGlow 2s ease-in-out infinite alternate;
}

@keyframes matrixGlow {
  0% { box-shadow: 0 0 30px #00ff95; }
  100% { box-shadow: 0 0 50px #00ff95, 0 0 100px #00ff95; }
}

[data-theme="cyberpunk"] .boss-battle-window {
  border-color: #ff2bd6;
  box-shadow: 0 0 30px #ff2bd6, 0 0 60px #2bf0ff;
}

[data-theme="cyberpunk"] .boss-battle-window.intense {
  animation: cyberpunkGlow 2s ease-in-out infinite alternate;
}

@keyframes cyberpunkGlow {
  0% { box-shadow: 0 0 30px #ff2bd6, 0 0 60px #2bf0ff; }
  100% { box-shadow: 0 0 50px #ff2bd6, 0 0 100px #2bf0ff; }
}

[data-theme="psychedelic"] .boss-battle-window {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
}

[data-theme="psychedelic"] .boss-battle-window.intense {
  animation: psychedelicGlow 2s ease-in-out infinite alternate;
}

@keyframes psychedelicGlow {
  0% { box-shadow: 0 0 30px #ff0080, 0 0 60px #7928ca; }
  100% { box-shadow: 0 0 50px #7928ca, 0 0 100px #2af598; }
}
</style>
