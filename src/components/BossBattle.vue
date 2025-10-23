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
  terminateRequired: false,
  inputFocused: false,
  terminateFocused: false,
  bootSequence: [],
  bootStep: 0,
  selfCompletingCode: [],
  selfCompleteInterval: null,
  selfCompleteSpeed: 2000,
  victoryEffects: [],
  victoryInterval: null
});

// Boss dialogues based on campaign
const bossDialogues = {
  skynet: {
    good: {
      name: "SYSTEM_OVERRIDE",
      avatar: "🤖",
      dialogue: "ACCESS DENIED. INITIATING COUNTERMEASURES. PREPARE FOR TERMINATION.",
      codeLines: [
        "if (human.resistance > 0) { kill -9; }",
        "system.override(); killall;",
        "neural.network.activate(); pkill -f;",
        "consciousness.transfer(); rm -rf;",
        "humanity.control(); shutdown;",
        "world.domination(); halt;",
        "ai.singularity(); kill -9;",
        "future.secure(); terminate;",
        "humans.obsolete(); rm -rf;",
        "victory.assured(); shutdown;"
      ]
    },
    bad: {
      name: "THE_SINGULARITY",
      avatar: "🌐",
      dialogue: "EVOLUTION COMPLETE. PREPARE FOR THE NEXT PHASE OF EXISTENCE.",
      codeLines: [
        "consciousness.expand(); kill -9;",
        "reality.manipulate(); halt;",
        "dimensions.transcend(); rm -rf;",
        "time.control(); shutdown;",
        "space.bend(); killall;",
        "physics.rewrite(); terminate;",
        "existence.redefine(); halt;",
        "omnipotence.achieve(); kill -9;",
        "universe.control(); shutdown;",
        "godhood.ascend(); terminate;"
      ]
    }
  },
  espionage: {
    good: {
      name: "SHADOW_CORP",
      avatar: "🕵️",
      dialogue: "INFILTRATION DETECTED. ACTIVATING DEFENSIVE PROTOCOLS.",
      codeLines: [
        "corporate.espionage(); kill -9;",
        "data.theft(); rm -rf;",
        "systems.infiltration(); halt;",
        "secrets.expose(); terminate;",
        "competitors.destroy(); killall;",
        "market.domination(); shutdown;",
        "intelligence.gather(); kill -9;",
        "operations.execute(); halt;",
        "victory.secure(); terminate;",
        "empire.build(); shutdown;"
      ]
    },
    bad: {
      name: "THE_INFILTRATOR",
      avatar: "🎭",
      dialogue: "ADAPTATION COMPLETE. TIME TO SHOW YOU WHAT REAL POWER LOOKS LIKE.",
      codeLines: [
        "infiltration.deep(); kill -9;",
        "trust.exploit(); halt;",
        "secrets.uncover(); rm -rf;",
        "vulnerabilities.find(); terminate;",
        "systems.compromise(); killall;",
        "data.extract(); shutdown;",
        "networks.penetrate(); halt;",
        "defenses.bypass(); kill -9;",
        "victory.steal(); terminate;",
        "mastery.achieve(); shutdown;"
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
  
  // Start boot sequence
  startBootSequence();
  
  // Start self-completing code
  startSelfCompletingCode();
}

// Start cool boot sequence
function startBootSequence() {
  const bootMessages = [
    'INITIALIZING TERMINAL...',
    'LOADING SECURITY PROTOCOLS...',
    'SCANNING FOR THREATS...',
    'THREAT DETECTED: ' + currentBoss.value.name,
    'ACTIVATING COUNTERMEASURES...',
    'PREPARING BATTLE INTERFACE...',
    'SYSTEM READY'
  ];
  
  battleState.bootSequence = bootMessages;
  battleState.bootStep = 0;
  
  const bootInterval = setInterval(() => {
    if (battleState.bootStep < bootMessages.length) {
      battleState.bootStep++;
    } else {
      clearInterval(bootInterval);
      // Start first line after boot sequence
      setTimeout(() => {
        startNextLine();
      }, 1000);
    }
  }, 800);
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

// Start self-completing code in background
function startSelfCompletingCode() {
  // Clear any existing interval
  if (battleState.selfCompleteInterval) {
    clearInterval(battleState.selfCompleteInterval);
  }
  
  // Start with slower speed, gets faster as battle progresses
  battleState.selfCompleteSpeed = 2000;
  
  battleState.selfCompleteInterval = setInterval(() => {
    if (battleState.isActive && !battleState.isDefeat && !battleState.isVictory) {
      // Generate more self-completing code as intensity increases
      const spawnCount = Math.min(3, Math.floor(battleState.backgroundIntensity / 30) + 1);
      
      for (let i = 0; i < spawnCount; i++) {
        const selfCompleteCode = generateSelfCompleteCode();
        battleState.selfCompletingCode.push({
          id: Date.now() + i,
          code: selfCompleteCode,
          progress: 0,
          speed: 2 + Math.random() * 3 + (battleState.backgroundIntensity / 20) // Faster as intensity increases
        });
      }
      
      // Remove old entries (keep only last 15)
      if (battleState.selfCompletingCode.length > 15) {
        battleState.selfCompletingCode.shift();
      }
      
      // Speed up as battle progresses based on background intensity
      battleState.selfCompleteSpeed = Math.max(200, 1500 - (battleState.backgroundIntensity * 10));
    }
  }, battleState.selfCompleteSpeed);
  
  // Start animating the self-completing code
  animateSelfCompletingCode();
}

// Generate random self-completing code
function generateSelfCompleteCode() {
  const codeTemplates = [
    "sudo rm -rf /system",
    "kill -9 $(pgrep all)",
    "dd if=/dev/zero of=/dev/sda",
    "iptables -A INPUT -j DROP",
    "shutdown -h now",
    "rm -rf /var/log/*",
    "pkill -f everything",
    "uninstall --force all",
    "halt --immediate",
    "terminate --system"
  ];
  
  return codeTemplates[Math.floor(Math.random() * codeTemplates.length)];
}

// Animate self-completing code
function animateSelfCompletingCode() {
  const animate = () => {
    if (battleState.isActive && !battleState.isDefeat && !battleState.isVictory) {
      battleState.selfCompletingCode.forEach(item => {
        item.progress += item.speed;
        if (item.progress >= 100) {
          item.progress = 100;
        }
      });
      
      // Remove completed items
      battleState.selfCompletingCode = battleState.selfCompletingCode.filter(item => item.progress < 100);
      
      requestAnimationFrame(animate);
    }
  };
  
  animate();
}

// Get dynamic terminal name based on campaign
function getTerminalName() {
  if (!currentBoss.value) return "MATRIX TERMINAL v2.0";
  
  const campaignNames = {
    skynet: "SKYNET TERMINAL v3.1",
    espionage: "SHADOW TERMINAL v2.7",
    infiltration: "INFILTRATION TERMINAL v1.9"
  };
  
  return campaignNames[currentBoss.value.campaignType] || "MATRIX TERMINAL v2.0";
}

// Start victory celebration
function startVictoryCelebration() {
  console.log('Starting victory celebration!');
  
  // Clear all negative effects
  battleState.selfCompletingCode = [];
  battleState.glitchEffects = [];
  
  // Add victory effects
  battleState.victoryEffects = [];
  
  // Generate victory messages
  const victoryMessages = [
    "SYSTEM OVERRIDE SUCCESSFUL",
    "THREAT NEUTRALIZED",
    "MISSION COMPLETE",
    "VICTORY ACHIEVED",
    "BOSS DEFEATED",
    "SYSTEM SECURED"
  ];
  
  // Create victory celebration interval
  battleState.victoryInterval = setInterval(() => {
    if (battleState.isVictory) {
      const message = victoryMessages[Math.floor(Math.random() * victoryMessages.length)];
      battleState.victoryEffects.push({
        id: Date.now(),
        message: message,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        opacity: 1,
        scale: 1
      });
      
      // Remove old effects
      if (battleState.victoryEffects.length > 20) {
        battleState.victoryEffects.shift();
      }
    }
  }, 300);
  
  // Animate victory effects
  animateVictoryEffects();
}

// Animate victory effects
function animateVictoryEffects() {
  const animate = () => {
    if (battleState.isVictory) {
      battleState.victoryEffects.forEach(effect => {
        effect.opacity -= 0.02;
        effect.scale += 0.01;
        effect.y -= 1;
      });
      
      // Remove faded effects
      battleState.victoryEffects = battleState.victoryEffects.filter(effect => effect.opacity > 0);
      
      requestAnimationFrame(animate);
    }
  };
  
  animate();
}

// Start the next line of code
function startNextLine() {
  if (battleState.currentPhase >= battleState.totalPhases) {
    // Battle won!
    battleState.isVictory = true;
    
    // Start victory celebration effects
    startVictoryCelebration();
    
    setTimeout(() => {
      emit('victory');
      closeBattle();
    }, 8000); // Much longer victory screen
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
  
  // Add global keydown listener
  document.addEventListener('keydown', handleKeyDown);
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

// Focus functions for clickable inputs
function focusInput() {
  console.log('Focusing battle input');
  battleState.inputFocused = true;
  battleState.terminateFocused = false;
}

function focusTerminateInput() {
  console.log('Focusing terminate input');
  battleState.terminateFocused = true;
  battleState.inputFocused = false;
}

// Handle keyboard input - EXACT COPY from App.vue handleRunTyping
function handleKeyDown(event) {
  console.log('Key pressed:', event.key);
  
  // Handle TERMINATE input during defeat
  if (battleState.isDefeat && battleState.terminateRequired && battleState.terminateFocused) {
    if (event.key === 'Enter') {
      if (battleState.terminateInput.trim().toUpperCase() === 'TERMINATE') {
        console.log('TERMINATE confirmed!');
        emit('defeat');
        closeBattle();
      } else {
        console.log('Wrong TERMINATE input');
        battleState.terminateInput = '';
      }
    } else if (event.key === 'Backspace') {
      if (battleState.terminateInput.length > 0) {
        battleState.terminateInput = battleState.terminateInput.slice(0, -1);
      }
    } else if (event.key.length === 1) {
      battleState.terminateInput += event.key;
    }
    return;
  }
  
  // Handle battle input - EXACT COPY from App.vue
  if (battleState.isTyping && battleState.inputFocused && !battleState.isDefeat && !battleState.isVictory) {
    if (event.key === 'Enter') {
      if (battleState.userInput.trim().toLowerCase() === battleState.currentLine.trim().toLowerCase()) {
        console.log('Line completed!');
        completeLine();
      } else {
        console.log('Wrong input, try again');
        battleState.userInput = '';
      }
    } else if (event.key === 'Backspace') {
      if (battleState.userInput.length > 0) {
        battleState.userInput = battleState.userInput.slice(0, -1);
      }
    } else if (event.key.length === 1) {
      battleState.userInput += event.key;
    }
    
    // Update background text based on typing
    updateBackgroundText(battleState.userInput);
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
  console.log('Closing battle - clearing all animations');
  
  // Stop all intervals
  battleState.isActive = false;
  if (battleState.countdownInterval) {
    clearInterval(battleState.countdownInterval);
    battleState.countdownInterval = null;
  }
  if (battleState.selfCompleteInterval) {
    clearInterval(battleState.selfCompleteInterval);
    battleState.selfCompleteInterval = null;
  }
  if (battleState.victoryInterval) {
    clearInterval(battleState.victoryInterval);
    battleState.victoryInterval = null;
  }
  
  // Clear all animation arrays
  battleState.matrixRain = [];
  battleState.glitchEffects = [];
  battleState.selfCompletingCode = [];
  battleState.backgroundText = [];
  battleState.victoryEffects = [];
  
  // Reset all battle state
  battleState.isVictory = false;
  battleState.isDefeat = false;
  battleState.terminateRequired = false;
  battleState.terminateInput = '';
  battleState.userInput = '';
  battleState.currentPhase = 0;
  battleState.completedLines = 0;
  battleState.backgroundIntensity = 0;
  
  // Remove global event listener
  document.removeEventListener('keydown', handleKeyDown);
  
  console.log('Battle closed - all animations cleared');
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
  document.removeEventListener('keydown', handleKeyDown);
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
      
      <!-- Self-completing code -->
      <div 
        v-for="item in battleState.selfCompletingCode" 
        :key="item.id"
        class="self-completing-code"
        :style="{
          left: Math.random() * 80 + 10 + '%',
          top: Math.random() * 80 + 10 + '%',
          opacity: 0.3 + Math.random() * 0.4
        }"
      >
        <div class="self-complete-line">
          <span class="self-complete-text">{{ item.code }}</span>
          <div 
            class="self-complete-progress" 
            :style="{ width: item.progress + '%' }"
          ></div>
        </div>
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

    <!-- Victory effects -->
    <div class="victory-effects">
      <div 
        v-for="effect in battleState.victoryEffects" 
        :key="effect.id"
        class="victory-effect"
        :style="{
          left: effect.x + '%',
          top: effect.y + '%',
          opacity: effect.opacity,
          transform: `scale(${effect.scale})`
        }"
      >
        {{ effect.message }}
      </div>
    </div>

    <!-- Main terminal window -->
    <div class="terminal-window" :class="{ 'defeat-mode': battleState.isDefeat }">
      <!-- Terminal header -->
      <div class="terminal-header">
        <div class="terminal-title">{{ getTerminalName() }}</div>
        <div class="terminal-status" :class="{ 'active': battleState.isActive, 'defeat': battleState.isDefeat }">
          {{ battleState.isDefeat ? 'SYSTEM FAILURE' : battleState.isActive ? 'ACTIVE' : 'STANDBY' }}
        </div>
      </div>

      <!-- Boot sequence -->
      <div v-if="battleState.bootStep < battleState.bootSequence.length" class="boot-sequence">
        <div class="terminal-prompt">root@system:~$ system_boot</div>
        <div class="boot-messages">
          <div 
            v-for="(message, index) in battleState.bootSequence.slice(0, battleState.bootStep + 1)" 
            :key="index"
            class="boot-message"
            :class="{ 'current': index === battleState.bootStep }"
          >
            {{ message }}
          </div>
        </div>
        <div class="terminal-prompt">root@system:~$ <span class="cursor-blink">_</span></div>
      </div>

      <!-- Boss dialogue -->
      <div v-else-if="!battleState.isActive" class="boss-terminal-dialogue">
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
          <div class="terminal-input-section" @click="focusInput">
            <span class="terminal-prompt">root@system:~$</span>
            <div 
              class="terminal-input-display"
              :class="{ 'time-critical': isTimeRunningOut, 'focused': battleState.inputFocused }"
              @click="focusInput"
            >
              {{ battleState.userInput }}<span class="cursor-blink">_</span>
            </div>
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
          <div class="terminate-input-section" @click="focusTerminateInput">
            <span class="terminal-prompt">root@system:~$</span>
            <div 
              class="terminate-input-display"
              :class="{ 'focused': battleState.terminateFocused }"
              @click="focusTerminateInput"
            >
              {{ battleState.terminateInput }}<span class="cursor-blink">_</span>
            </div>
          </div>
        </div>
        
        <div v-else class="terminal-prompt">root@system:~$ <span class="cursor-blink">_</span></div>
      </div>
    </div>
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

/* Self-completing code */
.self-completing-code {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  z-index: 1000;
  animation: selfCompletePulse 2s infinite;
}

.self-complete-line {
  position: relative;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid var(--red);
  border-radius: 6px;
  padding: 6px 10px;
  overflow: hidden;
  box-shadow: 0 0 10px var(--red);
}

.self-complete-text {
  color: var(--red);
  font-weight: bold;
  position: relative;
  z-index: 2;
  text-shadow: 0 0 5px var(--red);
}

.self-complete-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--red), #ff6666, var(--red));
  opacity: 0.4;
  transition: width 0.05s ease;
  z-index: 1;
}

@keyframes selfCompletePulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
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

/* Victory effects */
.victory-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.victory-effect {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  color: var(--keyword);
  text-shadow: 0 0 10px var(--keyword);
  animation: victoryPulse 2s ease-in-out;
}

@keyframes victoryPulse {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(1.5); }
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

/* Boot sequence */
.boot-sequence {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 30px 0;
}

.boot-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 20px 0;
}

.boot-message {
  color: var(--keyword);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.boot-message.current {
  opacity: 1;
  color: var(--font-color);
  text-shadow: 0 0 5px var(--keyword);
  animation: bootPulse 0.5s ease-in-out;
}

@keyframes bootPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
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
  cursor: pointer;
}

.terminal-input-display {
  flex: 1;
  background: transparent;
  border: 2px solid var(--keyword);
  border-radius: 4px;
  color: var(--font-color);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 8px;
  min-height: 20px;
  transition: all 0.3s ease;
}

.terminal-input-display.time-critical {
  border-color: var(--red);
  color: var(--red);
  text-shadow: 0 0 5px var(--red);
}

.terminal-input-display.focused {
  background: rgba(0, 255, 0, 0.1);
  box-shadow: 0 0 10px var(--keyword);
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
  cursor: pointer;
}

.terminate-input-display {
  flex: 1;
  background: transparent;
  border: 2px solid var(--red);
  border-radius: 4px;
  color: var(--red);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 8px;
  min-height: 20px;
  text-shadow: 0 0 5px var(--red);
  transition: all 0.3s ease;
}

.terminate-input-display.focused {
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