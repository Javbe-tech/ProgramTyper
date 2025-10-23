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
  maxTime: 15000, // 15 seconds per line
  isTyping: false,
  userInput: '',
  backgroundIntensity: 0,
  isVictory: false,
  isDefeat: false,
  backgroundText: [],
  glitchEffects: [],
  terminateInput: '',
  terminateRequired: false
});

// Boss dialogues based on campaign
const bossDialogues = {
  skynet: {
    good: {
      name: "SYSTEM_OVERRIDE",
      avatar: "🤖",
      dialogue: "ACCESS DENIED. INITIATING COUNTERMEASURES. PREPARE FOR TERMINATION.",
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
      dialogue: "EVOLUTION COMPLETE. PREPARE FOR THE NEXT PHASE OF EXISTENCE.",
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
      dialogue: "INFILTRATION DETECTED. ACTIVATING DEFENSIVE PROTOCOLS.",
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
      dialogue: "ADAPTATION COMPLETE. TIME TO SHOW YOU WHAT REAL POWER LOOKS LIKE.",
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

// Generate random code for scrolling effects
function generateRandomCode() {
  const codeWords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'async', 'await', 'promise', 'array', 'object', 'string', 'number', 'boolean'];
  const operators = ['=', '+', '-', '*', '/', '&&', '||', '!', '==', '===', '!=', '!==', '<', '>', '<=', '>='];
  const brackets = ['(', ')', '[', ']', '{', '}', '<', '>'];
  
  const word1 = codeWords[Math.floor(Math.random() * codeWords.length)];
  const word2 = codeWords[Math.floor(Math.random() * codeWords.length)];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const bracket = brackets[Math.floor(Math.random() * brackets.length)];
  const number = Math.floor(Math.random() * 1000);
  
  return `${word1} ${operator} ${word2}${bracket} ${number}`;
}

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
  
  // Initialize background text
  initializeBackgroundText();
  
  // Start first line after dialogue
  setTimeout(() => {
    startNextLine();
  }, 3000);
}

// Initialize background text
function initializeBackgroundText() {
  const codeWords = ['function', 'variable', 'array', 'object', 'string', 'number', 'boolean', 'null', 'undefined', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'async', 'await', 'promise', 'callback', 'event', 'listener', 'handler', 'method', 'property', 'prototype'];
  
  battleState.backgroundText = Array.from({ length: 50 }, () => {
    const word1 = codeWords[Math.floor(Math.random() * codeWords.length)];
    const word2 = codeWords[Math.floor(Math.random() * codeWords.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${word1} ${word2} ${number}`;
  });
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
  
  // Start countdown
  const countdown = setInterval(() => {
    battleState.timeRemaining -= 100;
    
    if (battleState.timeRemaining <= 0) {
      clearInterval(countdown);
      // Time's up - battle lost
      battleState.isDefeat = true;
      battleState.terminateRequired = true;
      battleState.terminateInput = '';
      startGlitchEffects();
    }
  }, 100);
  
  // Store interval for cleanup
  battleState.countdownInterval = countdown;
  
  // Auto-focus the input with debugging
  setTimeout(() => {
    const input = document.querySelector('.terminal-input');
    console.log('Input element found:', input);
    if (input) {
      console.log('Input disabled state:', input.disabled);
      console.log('Input readonly state:', input.readOnly);
      input.focus();
      input.select();
      console.log('Input focused and selected');
      
      // Test if we can type
      input.addEventListener('keydown', (e) => {
        console.log('Key pressed:', e.key);
      });
    } else {
      console.error('Input element not found!');
    }
  }, 200);
}

// Start glitch effects on defeat
function startGlitchEffects() {
  // Start crazy code scrolling
  startCrazyCodeScroll();
  
  const glitchInterval = setInterval(() => {
    if (!battleState.isDefeat) {
      clearInterval(glitchInterval);
      return;
    }
    
    battleState.glitchEffects.push({
      id: Date.now() + Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      type: Math.random() > 0.5 ? 'error' : 'corrupt',
      duration: 2000 + Math.random() * 3000
    });
    
    // Remove old effects
    battleState.glitchEffects = battleState.glitchEffects.filter(effect => {
      effect.duration -= 100;
      return effect.duration > 0;
    });
  }, 200);
}

// Start crazy fast code scrolling on defeat
function startCrazyCodeScroll() {
  const codeScrollInterval = setInterval(() => {
    if (!battleState.isDefeat) {
      clearInterval(codeScrollInterval);
      return;
    }
    
    // Add multiple fast-scrolling code lines
    for (let i = 0; i < 5; i++) {
      battleState.glitchEffects.push({
        id: Date.now() + Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        type: 'code-scroll',
        duration: 1000 + Math.random() * 2000,
        speed: 2 + Math.random() * 3,
        direction: Math.random() > 0.5 ? 'left' : 'right'
      });
    }
    
    // Remove old scrolling effects
    battleState.glitchEffects = battleState.glitchEffects.filter(effect => {
      if (effect.type === 'code-scroll') {
        effect.duration -= 50; // Faster removal
        return effect.duration > 0;
      }
      return true;
    });
  }, 100); // Very fast interval
}

// Handle user typing - prevent conflicts with main site
function handleInput(event) {
  console.log('Input event triggered:', event.type, 'Value:', event.target.value);
  console.log('Battle state:', {
    isTyping: battleState.isTyping,
    isDefeat: battleState.isDefeat,
    isVictory: battleState.isVictory,
    terminateRequired: battleState.terminateRequired
  });
  
  // Stop event propagation to prevent conflicts with main site
  event.stopPropagation();
  
  const input = event.target.value;
  
  // Handle TERMINATE input during defeat
  if (battleState.isDefeat && battleState.terminateRequired) {
    battleState.terminateInput = input;
    console.log('TERMINATE input:', input);
    
    if (input.trim().toUpperCase() === 'TERMINATE') {
      console.log('TERMINATE confirmed!');
      emit('defeat');
      closeBattle();
    }
    return;
  }
  
  if (!battleState.isTyping || battleState.isDefeat || battleState.isVictory) {
    console.log('Input blocked due to battle state');
    return;
  }
  
  battleState.userInput = input;
  
  console.log('Input processed:', input);
  
  // Update background text based on typing
  updateBackgroundText(input);
  
  // Check if line is completed (case insensitive and trim whitespace)
  if (input.trim().toLowerCase() === battleState.currentLine.trim().toLowerCase()) {
    console.log('Line completed!');
    completeLine();
  }
}

// Update background text based on user input
function updateBackgroundText(input) {
  battleState.backgroundText = battleState.backgroundText.map(line => {
    if (Math.random() < 0.3) { // 30% chance to change each line
      const randomWords = ['function', 'variable', 'array', 'object', 'string', 'number', 'boolean', 'null', 'undefined', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export'];
      return randomWords[Math.floor(Math.random() * randomWords.length)] + ' ' + Math.random().toString(36).substring(7);
    }
    return line;
  });
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
  
  // Add completion effect
  addCompletionEffect();
  
  // Start next line after a short delay
  setTimeout(() => {
    startNextLine();
  }, 1000);
}

// Add visual completion effect
function addCompletionEffect() {
  battleState.glitchEffects.push({
    id: Date.now(),
    x: 50,
    y: 50,
    type: 'success',
    duration: 1000
  });
}

// Close battle
function closeBattle() {
  battleState.isActive = false;
  if (battleState.countdownInterval) {
    clearInterval(battleState.countdownInterval);
  }
  battleState.matrixRain = [];
  battleState.glitchEffects = [];
  emit('close');
}

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
  console.log('BossBattle show prop changed:', newValue);
  if (newValue) {
    console.log('Starting Matrix Terminal Boss Battle!');
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
  <div v-if="show" class="boss-terminal-overlay">
    <!-- Background text overlay -->
    <div class="background-text-overlay">
      <div 
        v-for="(line, index) in battleState.backgroundText" 
        :key="index"
        class="background-text-line"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          opacity: 0.05 + Math.random() * 0.1,
          transform: `rotate(${Math.random() * 10 - 5}deg)`
        }"
      >
        {{ line }}
      </div>
    </div>

    <!-- Glitch effects -->
    <div class="glitch-effects">
      <div 
        v-for="effect in battleState.glitchEffects" 
        :key="effect.id"
        class="glitch-effect"
        :class="effect.type"
        :style="{
          left: effect.x + '%',
          top: effect.y + '%'
        }"
      >
        <div v-if="effect.type === 'error'" class="error-text">
          ERROR: SYSTEM COMPROMISED
        </div>
        <div v-else-if="effect.type === 'corrupt'" class="corrupt-text">
          CORRUPTION DETECTED
        </div>
        <div v-else-if="effect.type === 'success'" class="success-text">
          ACCESS GRANTED
        </div>
        <div v-else-if="effect.type === 'code-scroll'" class="code-scroll-text" :class="effect.direction">
          {{ generateRandomCode() }}
        </div>
      </div>
    </div>

    <!-- Main terminal window -->
    <div class="terminal-window" :class="{ 'defeat-mode': battleState.isDefeat }">
      <!-- Terminal header -->
      <div class="terminal-header">
        <div class="terminal-title">MATRIX TERMINAL v2.0</div>
        <div class="terminal-status" :class="{ 'active': battleState.isActive, 'defeat': battleState.isDefeat }">
          {{ battleState.isDefeat ? 'SYSTEM FAILURE' : battleState.isActive ? 'ACTIVE' : 'STANDBY' }}
        </div>
      </div>

      <!-- Boss dialogue -->
      <div v-if="!battleState.isActive" class="boss-terminal-dialogue">
        <div class="terminal-prompt">root@system:~$</div>
        <div class="boss-name">{{ currentBoss.name }}</div>
        <div class="boss-message">{{ currentBoss.dialogue }}</div>
        <div class="terminal-prompt">root@system:~$ <span class="cursor-blink">_</span></div>
      </div>

      <!-- Battle interface -->
      <div v-else-if="battleState.isActive && !battleState.isVictory && !battleState.isDefeat" class="terminal-battle">
        <!-- Progress display -->
        <div class="terminal-progress">
          <div class="terminal-prompt">root@system:~$ progress --phase {{ battleState.currentPhase + 1 }}/{{ battleState.totalPhases }}</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
        </div>

        <!-- Current code line -->
        <div v-if="battleState.currentLine" class="terminal-code-section">
          <div class="terminal-prompt">root@system:~$ execute --code</div>
          <div class="code-display" :class="{ 'time-critical': isTimeRunningOut }">
            <span class="code-text">{{ battleState.currentLine }}</span>
            <div class="time-overlay" :style="{ width: (100 - timePercentage) + '%' }"></div>
          </div>
          
          <!-- Terminal input -->
          <div class="terminal-input-section">
            <span class="terminal-prompt">root@system:~$</span>
            <input
              ref="terminalInput"
              v-model="battleState.userInput"
              @input="handleInput"
              class="terminal-input"
              :class="{ 'time-critical': isTimeRunningOut }"
              placeholder=""
              autocomplete="off"
              spellcheck="false"
              :disabled="!battleState.isTyping"
            />
            <span class="cursor-blink">_</span>
          </div>
        </div>

        <!-- System stats -->
        <div class="terminal-stats">
          <div class="stat-line">
            <span class="terminal-prompt">root@system:~$</span>
            <span class="stat-text">COMPLETED: {{ battleState.completedLines }}</span>
          </div>
          <div class="stat-line">
            <span class="terminal-prompt">root@system:~$</span>
            <span class="stat-text" :class="{ 'time-critical': isTimeRunningOut }">
              TIME_REMAINING: {{ Math.ceil(battleState.timeRemaining / 1000) }}s
            </span>
          </div>
        </div>
      </div>

      <!-- Victory screen -->
      <div v-else-if="battleState.isVictory" class="terminal-victory">
        <div class="terminal-prompt">root@system:~$</div>
        <div class="victory-title">SYSTEM SECURED</div>
        <div class="victory-message">{{ currentBoss.name }} DEFEATED</div>
        <div class="terminal-prompt">root@system:~$ <span class="cursor-blink">_</span></div>
      </div>

      <!-- Defeat screen -->
      <div v-else-if="battleState.isDefeat" class="terminal-defeat">
        <div class="terminal-prompt">root@system:~$</div>
        <div class="defeat-title">SYSTEM COMPROMISED</div>
        <div class="defeat-message">{{ currentBoss.name }} HAS TAKEN CONTROL</div>
        
        <div v-if="battleState.terminateRequired" class="terminate-section">
          <div class="terminal-prompt">root@system:~$ emergency_protocol</div>
          <div class="terminate-prompt">TYPE "TERMINATE" TO EXIT SYSTEM</div>
          <div class="terminate-input-section">
            <span class="terminal-prompt">root@system:~$</span>
            <input
              ref="terminateInput"
              v-model="battleState.terminateInput"
              @input="handleInput"
              class="terminate-input"
              placeholder=""
              autocomplete="off"
              spellcheck="false"
            />
            <span class="cursor-blink">_</span>
          </div>
        </div>
        
        <div v-else class="terminal-prompt">root@system:~$ <span class="cursor-blink">_</span></div>
      </div>
    </div>

    <!-- Close button -->
    <button @click="closeBattle" class="terminal-close-btn" title="Terminate Session">
      <span class="close-symbol">✕</span>
    </button>
  </div>
</template>

<style scoped>
.boss-terminal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', 'Consolas', monospace;
  overflow: hidden;
}

/* Background text overlay */
.background-text-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.background-text-line {
  position: absolute;
  color: var(--gray);
  font-size: 10px;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  user-select: none;
}

/* Glitch effects */
.glitch-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.glitch-effect {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  animation: glitchFlicker 0.1s infinite;
}

.error-text {
  color: #ff0000;
  text-shadow: 0 0 5px #ff0000;
}

.corrupt-text {
  color: #ff00ff;
  text-shadow: 0 0 5px #ff00ff;
}

.success-text {
  color: #00ff00;
  text-shadow: 0 0 5px #00ff00;
}

.code-scroll-text {
  color: var(--keyword);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 0 8px var(--keyword);
  animation: crazyScroll 0.5s linear infinite;
  white-space: nowrap;
}

.code-scroll-text.left {
  animation: scrollLeft 0.3s linear infinite;
}

.code-scroll-text.right {
  animation: scrollRight 0.3s linear infinite;
}

@keyframes crazyScroll {
  0% { transform: translateX(0) rotate(0deg); opacity: 1; }
  50% { transform: translateX(50px) rotate(180deg); opacity: 0.7; }
  100% { transform: translateX(100px) rotate(360deg); opacity: 0.3; }
}

@keyframes scrollLeft {
  0% { transform: translateX(100px); opacity: 1; }
  100% { transform: translateX(-100px); opacity: 0; }
}

@keyframes scrollRight {
  0% { transform: translateX(-100px); opacity: 1; }
  100% { transform: translateX(100px); opacity: 0; }
}

@keyframes glitchFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Terminal window */
.terminal-window {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid var(--keyword);
  border-radius: 8px;
  padding: 20px;
  max-width: 900px;
  width: 95%;
  min-height: 600px;
  position: relative;
  z-index: 3;
  box-shadow: 0 0 20px var(--keyword);
  backdrop-filter: blur(10px);
}

.terminal-window.defeat-mode {
  border-color: #ff0000;
  box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
  animation: systemGlitch 0.2s infinite;
}

@keyframes systemGlitch {
  0%, 100% { 
    filter: hue-rotate(0deg);
    transform: translate(0, 0);
  }
  25% { 
    filter: hue-rotate(90deg);
    transform: translate(-1px, 1px);
  }
  50% { 
    filter: hue-rotate(180deg);
    transform: translate(1px, -1px);
  }
  75% { 
    filter: hue-rotate(270deg);
    transform: translate(-1px, -1px);
  }
}

/* Terminal header */
.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--keyword);
}

.terminal-title {
  color: var(--keyword);
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 5px var(--keyword);
}

.terminal-status {
  color: #666;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #666;
  border-radius: 3px;
}

.terminal-status.active {
  color: var(--keyword);
  border-color: var(--keyword);
  text-shadow: 0 0 5px var(--keyword);
}

.terminal-status.defeat {
  color: #ff0000;
  border-color: #ff0000;
  text-shadow: 0 0 5px #ff0000;
  animation: urgentBlink 0.5s infinite;
}

@keyframes urgentBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Terminal elements */
.terminal-prompt {
  color: var(--keyword);
  font-size: 12px;
  margin-bottom: 5px;
}

.cursor-blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Boss dialogue */
.boss-terminal-dialogue {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 30px 0;
}

.boss-name {
  color: #ff0000;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px #ff0000;
  text-align: center;
}

.boss-message {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
  padding: 20px;
  border: 1px solid #333;
  background: rgba(0, 0, 0, 0.5);
}

/* Battle interface */
.terminal-battle {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.terminal-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #333;
  border: 1px solid #00ff00;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff00, #00aa00);
  transition: width 0.3s ease;
  box-shadow: 0 0 5px #00ff00;
}

/* Code display */
.terminal-code-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.code-display {
  background: #000;
  border: 2px solid #00ff00;
  border-radius: 4px;
  padding: 15px;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.code-display.time-critical {
  border-color: #ff0000;
  animation: urgentPulse 0.5s infinite;
}

@keyframes urgentPulse {
  0% { box-shadow: 0 0 0 #ff0000; }
  100% { box-shadow: 0 0 15px #ff0000; }
}

.code-text {
  color: #ffffff;
  font-family: 'Courier New', monospace;
  position: relative;
  z-index: 2;
}

.time-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(0, 255, 0, 0.2) 30%, 
    rgba(255, 0, 0, 0.4) 70%, 
    rgba(255, 0, 0, 0.8) 100%);
  transition: width 0.1s ease;
  pointer-events: none;
  z-index: 1;
}

/* Terminal input */
.terminal-input-section {
  display: flex;
  align-items: center;
  gap: 5px;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  outline: none;
  padding: 5px;
}

.terminal-input.time-critical {
  color: #ff0000;
  text-shadow: 0 0 5px #ff0000;
}

.terminal-input:focus {
  background: rgba(0, 255, 0, 0.1);
}

/* Stats */
.terminal-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 20px;
}

.stat-line {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-text {
  color: #ffffff;
  font-size: 12px;
}

.stat-text.time-critical {
  color: #ff0000;
  text-shadow: 0 0 5px #ff0000;
}

/* Victory/Defeat screens */
.terminal-victory,
.terminal-defeat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 50px 0;
  text-align: center;
}

.victory-title,
.defeat-title {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px currentColor;
}

.victory-title {
  color: #00ff00;
}

.defeat-title {
  color: #ff0000;
}

.victory-message,
.defeat-message {
  font-size: 16px;
  color: #ffffff;
}

.terminate-section {
  margin-top: 30px;
  padding: 20px;
  border: 2px solid var(--red);
  border-radius: 8px;
  background: rgba(255, 0, 0, 0.1);
}

.terminate-prompt {
  color: var(--red);
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 5px var(--red);
  margin: 15px 0;
  text-align: center;
}

.terminate-input-section {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 15px;
}

.terminate-input {
  flex: 1;
  background: transparent;
  border: 2px solid var(--red);
  border-radius: 4px;
  color: var(--red);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  outline: none;
  padding: 8px;
  text-shadow: 0 0 5px var(--red);
}

.terminate-input:focus {
  background: rgba(255, 0, 0, 0.1);
  box-shadow: 0 0 10px var(--red);
}

/* Close button */
.terminal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid #ff0000;
  border-radius: 50%;
  color: #ff0000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s ease;
  z-index: 4;
}

.terminal-close-btn:hover {
  background: rgba(255, 0, 0, 0.4);
  box-shadow: 0 0 10px #ff0000;
}

.close-symbol {
  font-weight: bold;
}

/* Theme-specific enhancements */
[data-theme="matrix"] .terminal-window {
  border-color: #00ff95;
  box-shadow: 0 0 20px rgba(0, 255, 149, 0.3);
}

[data-theme="matrix"] .terminal-prompt,
[data-theme="matrix"] .terminal-title {
  color: #00ff95;
  text-shadow: 0 0 5px #00ff95;
}

[data-theme="cyberpunk"] .terminal-window {
  border-color: #ff2bd6;
  box-shadow: 0 0 20px rgba(255, 43, 214, 0.3);
}

[data-theme="cyberpunk"] .terminal-prompt,
[data-theme="cyberpunk"] .terminal-title {
  color: #ff2bd6;
  text-shadow: 0 0 5px #ff2bd6;
}

[data-theme="cyberpunk"] .progress-fill {
  background: linear-gradient(90deg, #ff2bd6, #2bf0ff);
}
</style>