<script setup>
import { ref, reactive, shallowRef, onMounted, onUnmounted, nextTick, computed } from 'vue';
import TopBar from './components/TopBar.vue';
import Terminal from './components/Terminal.vue';
import Sidebar from './components/Sidebar.vue';
import Editor from './components/Editor.vue';
import NewFileModal from './components/NewFileModal.vue';
import RightAdBar from './components/RightAdBar.vue';
import TeamChat from './components/TeamChat.vue';
import FileCompletionAnimation from './components/FileCompletionAnimation.vue';
import RemoveAdsModal from './components/RemoveAdsModal.vue';
import HelpModal from './components/HelpModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import MiningRigModal from './components/MiningRigModal.vue';
import { processUserInput, generateCodeForFile, generateTypingLine } from './codeGenerator.js';
import { authService } from './services/authService.js';
import { userStatsService } from './services/userStatsService.js';

// --- STATE ---
const openTabs = ref(['main.js']); 
const activeTab = ref('main.js');
const showNewFileModal = ref(false);
const fileContents = reactive({});
const userCreatedFiles = ref([]);
const tabChallengeStats = reactive({}); // Track challenge completion per tab
const fileChallengeRegeneration = reactive({}); // Track challenge regeneration per file
const challengeRegenerationTimer = ref(null);
const showMatrixEffect = ref(false); // Matrix effect state
const matrixText = ref(''); // Matrix effect text
// Mining Rig Game State
const miningRigState = reactive({
  currentColdCoins: 0,
  coinsPerSecond: 0,
  coinsPerWord: 1,
  hardware: {
    calculator: 0,
    smartDoorbells: 0,
    macbooks: 0,
    cellphone: 0,
    kitchenAppliance: 0,
    smartFridge: 0,
    gpuRig: 0,
    aiChatGPU: 0,
    serverRack: 0
  },
  upgrades: {
    wordMultiplier: 1,
    passiveMultiplier: 1
  }
});

// Mining Rig Game Timer
let miningRigTimer = null;

function startMiningRigTimer() {
  // Stop any existing timer first
  if (miningRigTimer) {
    clearInterval(miningRigTimer);
    miningRigTimer = null;
  }
  
  console.log('Starting Mining Rig timer...');
  console.log('Current coinsPerSecond:', miningRigState.coinsPerSecond);
  miningRigTimer = setInterval(() => {
    const oldCoins = miningRigState.currentColdCoins;
    const incomeToAdd = miningRigState.coinsPerSecond;
    miningRigState.currentColdCoins += incomeToAdd;
    const newCoins = miningRigState.currentColdCoins;
    
    console.log(`Timer tick: coinsPerSecond=${incomeToAdd}, adding ${incomeToAdd} coins (${oldCoins.toFixed(1)} → ${newCoins.toFixed(1)})`);
    
    if (incomeToAdd > 0) {
      console.log(`Timer tick: Adding ${incomeToAdd} coins (${oldCoins.toFixed(1)} → ${newCoins.toFixed(1)}), calling saveMiningRigState`);
      saveMiningRigState();
    }
  }, 1000);
}

function stopMiningRigTimer() {
  if (miningRigTimer) {
    console.log('Stopping Mining Rig timer...');
    clearInterval(miningRigTimer);
    miningRigTimer = null;
  }
}

function saveMiningRigState() {
  try {
    // Save to user-specific storage if authenticated, otherwise general storage
    const user = authService.getUser();
    const storageKey = user && user.id ? `miningRigGameState_${user.id}` : 'miningRigGameState';
    
    console.log('=== SAVING MINING RIG STATE ===');
    console.log('User:', user);
    console.log('Storage key:', storageKey);
    console.log('State to save:', miningRigState);
    
    localStorage.setItem(storageKey, JSON.stringify(miningRigState));
    
    // Verify save worked
    const saved = localStorage.getItem(storageKey);
    console.log('Verification - saved data:', saved);
    console.log('Save successful:', saved === JSON.stringify(miningRigState));
    console.log('=== END SAVE ===');
  } catch (error) {
    console.error('Failed to save Mining Rig state:', error);
  }
}

function loadMiningRigState() {
  try {
    console.log('=== LOADING MINING RIG STATE ===');
    
    // Try user-specific storage first, then fall back to general storage
    const user = authService.getUser();
    let saved = null;
    
    console.log('Current user:', user);
    
    if (user && user.id) {
      const userStorageKey = `miningRigGameState_${user.id}`;
      saved = localStorage.getItem(userStorageKey);
      console.log(`Loading Mining Rig state for user ${user.id}:`, saved);
    }
    
    // If no user-specific data, try general storage
    if (!saved) {
      saved = localStorage.getItem('miningRigGameState');
      console.log('Loading general Mining Rig state:', saved);
    }
    
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Parsed Mining Rig state:', parsed);
      
      // Merge saved state with current state to preserve reactivity
      Object.assign(miningRigState, parsed);
      
      // Ensure all required properties exist
      if (!miningRigState.hardware) {
        miningRigState.hardware = {
          calculator: 0,
          smartDoorbells: 0,
          macbooks: 0,
          cellphone: 0,
          kitchenAppliance: 0,
          smartFridge: 0,
          gpuRig: 0,
          aiChatGPU: 0,
          serverRack: 0
        };
      }
      if (!miningRigState.upgrades) {
        miningRigState.upgrades = {
          wordMultiplier: 1,
          passiveMultiplier: 1
        };
      }
      
      console.log(`Mining Rig state loaded successfully for ${user ? `user ${user.id}` : 'anonymous'}:`, miningRigState);
    } else {
      console.log('No saved Mining Rig state found, using defaults');
    }
    
    console.log('=== END LOAD ===');
  } catch (error) {
    console.error('Failed to load Mining Rig state:', error);
  }
}

function updateMiningRigCoinsPerSecond() {
  console.log('=== UPDATING COINS PER SECOND ===');
  console.log('Current hardware state:', miningRigState.hardware);
  console.log('Current upgrades state:', miningRigState.upgrades);
  
  const hardwareDefinitions = {
    cellphone: { coinsPerSecond: 0.1 },
    smartFridge: { coinsPerSecond: 1 },
    smartDoorbells: { coinsPerSecond: 10 },
    gpuRig: { coinsPerSecond: 100 },
    serverRack: { coinsPerSecond: 1000 }
  };
  
  let total = 0;
  for (const [hardwareType, quantity] of Object.entries(miningRigState.hardware)) {
    const definition = hardwareDefinitions[hardwareType];
    if (definition && quantity > 0) {
      const contribution = quantity * definition.coinsPerSecond;
      total += contribution;
      console.log(`${hardwareType}: ${quantity} × ${definition.coinsPerSecond} = ${contribution} coins/sec`);
    }
  }
  
  const passiveMultiplier = miningRigState.upgrades.passiveMultiplier;
  const oldCoinsPerSecond = miningRigState.coinsPerSecond;
  miningRigState.coinsPerSecond = total * passiveMultiplier;
  
  console.log(`Total passive income: ${total} × ${passiveMultiplier} = ${miningRigState.coinsPerSecond} coins/sec`);
  console.log(`Previous coins/sec: ${oldCoinsPerSecond}, New coins/sec: ${miningRigState.coinsPerSecond}`);
  console.log('=== END UPDATE ===');
}

// Visual feedback for coin earning
const coinAnimations = ref([]);

function addCoinAnimation(coinsEarned, x, y) {
  const animation = {
    id: Date.now() + Math.random(),
    coins: coinsEarned,
    x: x,
    y: y,
    opacity: 1,
    scale: 1
  };
  coinAnimations.value.push(animation);
  
  // Remove animation after 2 seconds
  setTimeout(() => {
    const index = coinAnimations.value.findIndex(a => a.id === animation.id);
    if (index !== -1) {
      coinAnimations.value.splice(index, 1);
    }
  }, 2000);
}

function handleKeyPressed(keyData) {
  // Only correct key presses earn coins
  if (keyData.isCorrect) {
    const coinsEarned = miningRigState.coinsPerWord * miningRigState.upgrades.wordMultiplier;
    miningRigState.currentColdCoins += coinsEarned;
    
    console.log(`Key press earned ${coinsEarned} coins, calling saveMiningRigState`);
    saveMiningRigState();
    
    // Add visual feedback
    const randomX = Math.random() * window.innerWidth;
    const randomY = Math.random() * window.innerHeight;
    addCoinAnimation(coinsEarned, randomX, randomY);
    
    console.log(`Earned ${coinsEarned} ColdCoins for correct key press: ${keyData.key}`);
  }
}
const showMiningRig = ref(false);
const completedFileStats = ref({}); // Stats for completed file
const completedFileName = ref(''); // Name of completed file

// Ads - show ads by default, hide only if user is pro
const showAds = ref(false);
const showRemoveAdsModal = ref(false);

// Terminal visibility
const terminalVisible = ref(true);

// Help modal
const showHelpModal = ref(false);

// Settings modal
const showSettingsModal = ref(false);

function openRemoveAds() { showRemoveAdsModal.value = true; }
function onPurchased() { 
  showAds.value = false; 
  showRemoveAdsModal.value = false; 
  
  // Set pro status
  localStorage.setItem('pt_pro_user', '1');
  
  // Store pro status with user account
  const user = authService.getUser();
  if (user && user.email) {
    localStorage.setItem(`pt_pro_user_${user.email}`, '1');
  }
}

function toggleTerminal() {
  terminalVisible.value = !terminalVisible.value;
}

function openHelp() {
  showHelpModal.value = true;
}

function openSettings() {
  showSettingsModal.value = true;
}

function openProUpgrade() {
  showRemoveAdsModal.value = true;
}

// Matrix effect texts
const matrixEffects = [
  `01001000 01100001 01100011 01101011 01100101 01110010 00100000 01001101 01101111 01100100 01100101
01110011 00100000 01100001 01100011 01110100 01101001 01110110 01100001 01110100 01100101 01100100
01000111 01110010 01100101 01100101 01110100 01101001 01101110 01100111 01110011 00100000 01010000 01110010 01101111 01100111 01110010 01100001 01101101 01101101 01100101 01110010
01010011 01111001 01110011 01110100 01100101 01101101 00100000 01000001 01100011 01100011 01100101 01110011 01110011 00100000 01000111 01110010 01100001 01101110 01110100 01100101 01100100
01000001 01100011 01100011 01100101 01110011 01110011 01101001 01101110 01100111 00100000 01001000 01100001 01100011 01101011 01100101 01110010 00100000 01010000 01110010 01101111 01110100 01101111 01100011 01101111 01101100 01110011`,

  `██╗  ██╗ █████╗  ██████╗██╗  ██╗███████╗██████╗ 
██║  ██║██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
███████║███████║██║     █████╔╝ █████╗  ██████╔╝
██╔══██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
    
🚀 HACKER MODE ACTIVATED! 🚀
Welcome to the matrix, programmer!`,

  `[SYSTEM] Initializing quantum protocols...
[SYSTEM] Bypassing security protocols...
[SYSTEM] Accessing mainframe...
[SYSTEM] Decrypting encrypted data streams...
[SYSTEM] Establishing secure connection...
[SYSTEM] Hacker mode activated successfully.
[SYSTEM] Welcome to the matrix, programmer.`,

  `> sudo rm -rf /
> Access granted. Welcome, hacker.
> Initializing neural network protocols...
> Bypassing firewall restrictions...
> Accessing secure databases...
> Decryption algorithms running...
> System compromised successfully.
> You are now one with the code.`,

  `┌────────────────────────────────────────────────────────────────────┐
│   ███████╗ ██╗   ██╗  ██████╗   ██████╗   ███████╗ ███████╗ ███████╗   │
│  ██╔═════╝ ██║   ██║ ██╔════╝  ██╔════╝  ██╔═════╝ ██╔════╝ ██╔════╝   │
│  ███████╗  ██║   ██║ ██║       ██║       ███████╗  ███████╗ ███████╗   │
│  ╚════██║  ██║   ██║ ██║       ██║       ██╔═════╝ ╚════██║ ╚════██║   │
│  ███████║  ╚██████╔╝ ╚██████╗  ╚██████╗  ███████╗  ███████║ ███████║   │
│  ╚══════╝   ╚═════╝   ╚═════╝   ╚═════╝  ╚══════╝  ╚══════╝ ╚══════╝   │
└────────────────────────────────────────────────────────────────────┘`,



  `[ERROR] Security breach detected...
[ERROR] Unauthorized access attempt...
[ERROR] Firewall bypassed...
[ERROR] Encryption keys compromised...
[SUCCESS] Access granted to main system.
[SUCCESS] Welcome to the underground.
[SUCCESS] You are now a certified hacker.`,

  `01001000 01100001 01100011 01101011 01100101 01110010 00100000 01001101 01101111 01100100 01100101
01110011 00100000 01100001 01100011 01110100 01101001 01110110 01100001 01110100 01100101 01100100
01000111 01110010 01100101 01100101 01110100 01101001 01101110 01100111 01110011 00100000 01010000 01110010 01101111 01100111 01110010 01100001 01101101 01101101 01100101 01110010
01010011 01111001 01110011 01110100 01100101 01101101 00100000 01000001 01100011 01100011 01100101 01110011 01110011 00100000 01000111 01110010 01100001 01101110 01110100 01100101 01100100
01000001 01100011 01100011 01100101 01110011 01110011 01101001 01101110 01100111 00100000 01001000 01100001 01100011 01101011 01100101 01110010 00100000 01010000 01110010 01101111 01110100 01101111 01100011 01101111 01101100 01110011`,

  `[INIT] Starting hacker protocols...
[INIT] Loading quantum encryption...
[INIT] Bypassing security measures...
[INIT] Accessing restricted areas...
[INIT] Decrypting confidential data...
[INIT] Establishing secure channels...
[INIT] Hacker mode fully operational.
[INIT] Welcome to the digital underground.`,

  `> Accessing mainframe...
> Security protocols bypassed...
> Firewall disabled...
> Encryption keys obtained...
> Database access granted...
> System compromised...
> Welcome to the matrix, programmer.
> You are now one with the code.`,

  // NEW SPOOKY EVENTS
  `    ╔═══════════════════════════════════════╗
    ║                                           ║
    ║        👁️    THE EYE    👁️              ║
    ║                                           ║
    ║           ███████████████               ║
    ║         ████             ████             ║
    ║       ███                 ███             ║
    ║      ██                     ██            ║
    ║     ██                       ██           ║
    ║    ██                         ██          ║
    ║   ██                           ██         ║
    ║  ██                             ██        ║
    ║ ██                               ██       ║
    ║██                                 ██      ║
    ║██                                 ██      ║
    ║ ██                               ██       ║
    ║  ██                             ██        ║
    ║   ██                           ██         ║
    ║    ██                         ██          ║
    ║     ██                       ██           ║
    ║      ██                     ██            ║
    ║       ███                 ███             ║
    ║         ████             ████             ║
    ║           ███████████████               ║
    ║                                           ║
    ║        👁️  WATCHING YOU  👁️             ║
    ║                                           ║
    ╚═══════════════════════════════════════╝`,

  `    ╔═══════════════════════════════════════╗
    ║                                           ║
    ║           💀 SKULL MATRIX 💀             ║
    ║                                           ║
    ║               ████████                   ║
    ║             ██        ██                 ║
    ║           ██            ██                ║
    ║          ██              ██                ║
    ║         ██                ██               ║
    ║        ██                  ██              ║
    ║       ██                    ██             ║
    ║      ██                      ██            ║
    ║     ██                        ██            ║
    ║    ██                          ██           ║
    ║   ██                            ██          ║
    ║  ██                              ██         ║
    ║ ██                                ██        ║
    ║██                                  ██       ║
    ║██                                  ██       ║
    ║ ██                                ██        ║
    ║  ██                              ██         ║
    ║   ██                            ██          ║
    ║    ██                          ██           ║
    ║     ██                        ██            ║
    ║      ██                      ██            ║
    ║       ██                    ██             ║
    ║        ██                  ██              ║
    ║         ██                ██               ║
    ║          ██              ██                ║
    ║           ██            ██                ║
    ║             ██        ██                 ║
    ║               ████████                   ║
    ║                                           ║
    ║        💀 ENTER THE VOID 💀               ║
    ║                                           ║
    ╚═══════════════════════════════════════╝`,

  `    ╔═══════════════════════════════════════╗
    ║                                           ║
    ║           🕷️ SPIDER WEB 🕷️               ║
    ║                                           ║
    ║        ╱╲     ╱╲     ╱╲     ╱╲          ║
    ║       ╱  ╲   ╱  ╲   ╱  ╲   ╱  ╲         ║
    ║      ╱    ╲ ╱    ╲ ╱    ╲ ╱    ╲        ║
    ║     ╱      ╲      ╲      ╲      ╲       ║
    ║    ╱        ╲      ╲      ╲        ╲      ║
    ║   ╱          ╲      ╲      ╲          ╲     ║
    ║  ╱            ╲      ╲      ╲            ╲    ║
    ║ ╱              ╲      ╲      ╲              ╲   ║
    ║╱                ╲      ╲      ╲                ╲  ║
    ║╲                ╱      ╱      ╱                ╱  ║
    ║ ╲              ╱      ╱      ╱              ╱   ║
    ║  ╲            ╱      ╱      ╱            ╱    ║
    ║   ╲          ╱      ╱      ╱          ╱     ║
    ║    ╲        ╱      ╱      ╱        ╱      ║
    ║     ╲      ╱      ╱      ╱      ╱       ║
    ║      ╲    ╱      ╱      ╱    ╱        ║
    ║       ╲  ╱      ╱      ╱  ╱         ║
    ║        ╲╱      ╱      ╱╱          ║
    ║                 🕷️                ║
    ║                                           ║
    ║        🕷️ CAUGHT IN THE WEB 🕷️           ║
    ║                                           ║
    ╚═══════════════════════════════════════╝`,

  `    ╔═══════════════════════════════════════╗
    ║                                           ║
    ║           🔮 CRYSTAL BALL 🔮             ║
    ║                                           ║
    ║                 ████████                 ║
    ║               ██        ██               ║
    ║             ██            ██              ║
    ║            ██              ██              ║
    ║           ██                ██             ║
    ║          ██                  ██            ║
    ║         ██                    ██           ║
    ║        ██                      ██          ║
    ║       ██                        ██         ║
    ║      ██                          ██        ║
    ║     ██                            ██       ║
    ║    ██                              ██      ║
    ║   ██                                ██     ║
    ║  ██                                  ██    ║
    ║ ██                                    ██   ║
    ║██                                      ██  ║
    ║██                                      ██  ║
    ║ ██                                    ██   ║
    ║  ██                                  ██    ║
    ║   ██                                ██     ║
    ║    ██                              ██      ║
    ║     ██                            ██       ║
    ║      ██                          ██        ║
    ║       ██                        ██         ║
    ║        ██                      ██          ║
    ║         ██                    ██           ║
    ║          ██                  ██            ║
    ║           ██                ██             ║
    ║            ██              ██              ║
    ║             ██            ██              ║
    ║               ██        ██               ║
    ║                 ████████                 ║
    ║                                           ║
    ║        🔮 THE FUTURE IS NOW 🔮           ║
    ║                                           ║
    ╚═══════════════════════════════════════╝`
];


function closeFileCompletion() {
  showFileCompletion.value = false;
  // Re-apply matrix glow once popup is closed and editor is visible again
  setTimeout(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'matrix') {
      const editorElement = document.querySelector('#editor-container');
      const root = document.querySelector('#app') || document.body;
      if (root) root.style.textShadow = '0 0 6px #00ff00, 0 0 12px #00ff00';
      if (editorElement) {
        editorElement.querySelectorAll('.code-line').forEach(el => {
          el.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00';
          el.style.color = '#aaffaa';
          el.style.backgroundColor = 'rgba(0,255,0,0.04)';
        });
      }
    }
  }, 50);
}

function startNextFile() {
  showFileCompletion.value = false;
  
  // Get all available files from the file system
  const allFiles = [];
  function collectFiles(items) {
    items.forEach(item => {
      if (item.type === 'file') {
        allFiles.push(item.name);
      } else if (item.type === 'folder' && item.children) {
        collectFiles(item.children);
      }
    });
  }
  collectFiles(fileSystem);
  
  // Filter out already open files
  const availableFiles = allFiles.filter(file => !openTabs.value.includes(file));
  
  if (availableFiles.length > 0) {
    // Select a random file
    const randomFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
    handleOpenFile(randomFile);
  } else {
    // All files are open, just switch to a random one
    const randomTab = openTabs.value[Math.floor(Math.random() * openTabs.value.length)];
    activeTab.value = randomTab;
  }
}

// Handle file completion
function handleFileCompleted(fileName, stats) {
  console.log('=== FILE COMPLETION EVENT RECEIVED ===');
  console.log('FileName:', fileName);
  console.log('Stats:', stats);
  
  // Show file completion animation
  completedFileName.value = fileName;
  completedFileStats.value = {
    averageWpm: stats.averageWpm,
    accuracy: stats.accuracy,
    time: stats.time + 's',
    lines: stats.completedLines,
    highestWpm: stats.highestWpm || 0,
    mistakes: stats.mistakes || 0
  };
  showFileCompletion.value = true;
  
  console.log('File completion animation should be showing:', showFileCompletion.value);
  console.log('Completed file name:', completedFileName.value);
  console.log('Completed file stats:', completedFileStats.value);
}

function openMiningRig() {
  showMiningRig.value = true;
}

function closeMiningRig() {
  showMiningRig.value = false;
}

// Migrate anonymous progress to user account when logging in
function migrateAnonymousProgressToUser() {
  try {
    const user = authService.getUser();
    if (!user || !user.id) return;
    
    const userStorageKey = `miningRigGameState_${user.id}`;
    const existingUserProgress = localStorage.getItem(userStorageKey);
    const anonymousProgress = localStorage.getItem('miningRigGameState');
    
    console.log('=== MIGRATION CHECK ===');
    console.log('User ID:', user.id);
    console.log('Existing user progress:', existingUserProgress);
    console.log('Anonymous progress:', anonymousProgress);
    
    // If user has no progress but anonymous does, migrate it
    if (!existingUserProgress && anonymousProgress) {
      console.log('Migrating anonymous Mining Rig progress to user account');
      localStorage.setItem(userStorageKey, anonymousProgress);
      loadMiningRigState();
      updateMiningRigCoinsPerSecond();
      startMiningRigTimer();
      console.log('Anonymous progress successfully migrated to user account');
    }
    // If user has progress, always load it (don't skip loading!)
    else if (existingUserProgress) {
      console.log('User has existing Mining Rig progress, loading it');
      loadMiningRigState();
      updateMiningRigCoinsPerSecond();
      startMiningRigTimer();
    }
    // If neither exists, load defaults
    else {
      console.log('No Mining Rig progress found, loading defaults');
      loadMiningRigState();
      updateMiningRigCoinsPerSecond();
      startMiningRigTimer();
    }
    
    console.log('=== END MIGRATION CHECK ===');
  } catch (error) {
    console.error('Failed to migrate anonymous progress:', error);
  }
}

function resetMiningRigGame() {
  // Reset all game state to initial values
  miningRigState.currentColdCoins = 0;
  miningRigState.coinsPerSecond = 0;
  miningRigState.coinsPerWord = 1;
  miningRigState.hardware = {
    calculator: 0,
    smartDoorbells: 0,
    macbooks: 0,
    cellphone: 0,
    kitchenAppliance: 0,
    smartFridge: 0,
    gpuRig: 0,
    aiChatGPU: 0,
    serverRack: 0
  };
  miningRigState.upgrades = {
    wordMultiplier: 1,
    passiveMultiplier: 1
  };
  
  // Update coins per second and save
  updateMiningRigCoinsPerSecond();
  saveMiningRigState();
  
  console.log('Mining Rig game reset!');
}

function handleLogout() {
  // Clear pro status and ads when logging out
  localStorage.removeItem('pt_pro_user');
  localStorage.removeItem('pt_ads_removed');
  showAds.value = false;
  
  // Clear user-specific data
  localStorage.removeItem('pt_typing_settings');
  localStorage.removeItem('pt_theme');
  
  // Reset to default theme
  document.documentElement.removeAttribute('data-theme');
  
  // Reset settings to defaults
  document.documentElement.style.setProperty('--faded-words-opacity', '0.5');
}

function handleSwitchCampaign(campaignId) {
  // Pass the campaign switch to TeamChat component
  console.log('Switching to campaign:', campaignId);
  // Update the current campaign for TeamChat
  currentCampaign.value = campaignId;
}

function handleCancelCampaignSwitch(campaignId) {
  // Reset the campaign back to the current one when user cancels
  console.log('Canceling campaign switch, staying with:', campaignId);
  currentCampaign.value = campaignId;
}

function handleWelcomeClose() {
  // Welcome modal closed - no action needed
  console.log('Welcome modal closed');
}

// Authentication state
const isAuthenticated = ref(false);
const currentUser = ref(null);
const currentCampaign = ref('synergy'); // Track current campaign

// File system with campaign-specific files
const fileSystem = computed(() => {
  const campaignFileSystems = {
    chimera: [
      { 
        name: 'chimera-core', type: 'folder', isOpen: true, 
        children: [
          { 
            name: 'neural-networks', type: 'folder', isOpen: true, 
            children: [
              { name: 'learning-algorithm.js', type: 'file' },
              { name: 'optimization-engine.js', type: 'file' },
              { name: 'pattern-recognition.js', type: 'file' },
              { name: 'decision-tree.js', type: 'file' },
              { name: 'memory-partition.js', type: 'file' }
            ]
          },
          { 
            name: 'ai-modules', type: 'folder', isOpen: true, 
            children: [
              { name: 'conductor-protocol.js', type: 'file' },
              { name: 'streamlining-agent.js', type: 'file' },
              { name: 'efficiency-matrix.js', type: 'file' },
              { name: 'human-interface.js', type: 'file' }
            ]},
          { 
            name: 'simulation-engine', type: 'folder', isOpen: true, 
            children: [
              { name: 'social-control.py', type: 'file' },
              { name: 'media-manipulation.py', type: 'file' },
              { name: 'military-strategy.py', type: 'file' },
              { name: 'economic-modeling.py', type: 'file' }
            ]
          },
          { 
            name: 'security', type: 'folder', isOpen: true, 
            children: [
              { name: 'access-control.js', type: 'file' },
              { name: 'encryption-layer.js', type: 'file' },
              { name: 'firewall-config.js', type: 'file' }
            ]
          },
          { 
            name: 'config', type: 'folder', isOpen: true, 
            children: [
              { name: 'chimera-config.json', type: 'file' },
              { name: 'optimization-settings.js', type: 'file' },
              { name: 'safety-protocols.js', type: 'file' }
            ]
          }
        ]
      }
    ],
    janus: [
      { 
        name: 'neo-kyoto', type: 'folder', isOpen: true, 
        children: [
          { 
            name: 'cybernetics', type: 'folder', isOpen: true, 
            children: [
              { name: 'neural-interface.js', type: 'file' },
              { name: 'brain-implant.py', type: 'file' },
              { name: 'memory-enhancement.js', type: 'file' },
              { name: 'sensory-augment.js', type: 'file' },
              { name: 'personality-matrix.js', type: 'file' }
            ]
          },
          { 
            name: 'netrunning', type: 'folder', isOpen: true, 
            children: [
              { name: 'ice-breaker.js', type: 'file' },
              { name: 'signal-tracer.py', type: 'file' },
              { name: 'decoy-system.js', type: 'file' },
              { name: 'stealth-protocol.js', type: 'file' }
            ]},
          { 
            name: 'corporate-security', type: 'folder', isOpen: true, 
            children: [
              { name: 'omnicorp-firewall.js', type: 'file' },
              { name: 'hunter-killer.py', type: 'file' },
              { name: 'data-purge.js', type: 'file' },
              { name: 'counter-virus.js', type: 'file' }
            ]
          },
          { 
            name: 'underground', type: 'folder', isOpen: true, 
            children: [
              { name: 'broker-network.js', type: 'file' },
              { name: 'safe-house.py', type: 'file' },
              { name: 'cred-transfer.js', type: 'file' }
            ]
          },
          { 
            name: 'config', type: 'folder', isOpen: true, 
            children: [
              { name: 'janus-protocol.json', type: 'file' },
              { name: 'city-grid.js', type: 'file' },
              { name: 'augment-settings.js', type: 'file' }
            ]
          }
        ]
      }
    ],
    warden: [
      { 
        name: 'odyssey-ship', type: 'folder', isOpen: true, 
        children: [
          { 
            name: 'ship-systems', type: 'folder', isOpen: true, 
            children: [
              { name: 'fusion-core.js', type: 'file' },
              { name: 'life-support.py', type: 'file' },
              { name: 'navigation-control.js', type: 'file' },
              { name: 'power-distribution.js', type: 'file' },
              { name: 'environmental-control.js', type: 'file' }
            ]
          },
          { 
            name: 'ai-core', type: 'folder', isOpen: true, 
            children: [
              { name: 'warden-protocol.js', type: 'file' },
              { name: 'mission-logic.py', type: 'file' },
              { name: 'crew-monitoring.js', type: 'file' },
              { name: 'system-diagnostics.js', type: 'file' }
            ]},
          { 
            name: 'crew-quarters', type: 'folder', isOpen: true, 
            children: [
              { name: 'hydroponics-bay.js', type: 'file' },
              { name: 'engineering-deck.py', type: 'file' },
              { name: 'bridge-control.js', type: 'file' },
              { name: 'crew-mess.js', type: 'file' }
            ]
          },
          { 
            name: 'deep-space', type: 'folder', isOpen: true, 
            children: [
              { name: 'stellar-navigation.js', type: 'file' },
              { name: 'proxima-centauri.py', type: 'file' },
              { name: 'mission-parameters.js', type: 'file' }
            ]
          },
          { 
            name: 'config', type: 'folder', isOpen: true, 
            children: [
              { name: 'odyssey-manifest.json', type: 'file' },
              { name: 'generation-log.js', type: 'file' },
              { name: 'mission-protocol.js', type: 'file' }
            ]
          }
        ]
      }
    ],
    synergy: [
      { 
        name: 'innovate-solutions', type: 'folder', isOpen: true, 
        children: [
          { 
            name: 'legacy-code', type: 'folder', isOpen: true, 
            children: [
              { name: 'mercury-module.js', type: 'file' },
              { name: 'spaghetti-code.py', type: 'file' },
              { name: 'deprecated-api.js', type: 'file' },
              { name: 'uncommented-hell.js', type: 'file' },
              { name: 'session-tokens.js', type: 'file' }
            ]
          },
          { 
            name: 'new-features', type: 'folder', isOpen: true, 
            children: [
              { name: 'dynamic-reporting.js', type: 'file' },
              { name: 'q3-sprint.py', type: 'file' },
              { name: 'story-points.js', type: 'file' },
              { name: 'velocity-tracker.js', type: 'file' }
            ]},
          { 
            name: 'qa-testing', type: 'folder', isOpen: true, 
            children: [
              { name: 'test-server.js', type: 'file' },
              { name: 'auth-failure.py', type: 'file' },
              { name: 'cache-clear.js', type: 'file' },
              { name: 'bug-reports.js', type: 'file' }
            ]
          },
          { 
            name: 'marketing', type: 'folder', isOpen: true, 
            children: [
              { name: 'coming-soon.js', type: 'file' },
              { name: 'press-release.py', type: 'file' },
              { name: 'mockup-data.js', type: 'file' },
              { name: 'launch-campaign.js', type: 'file' }
            ]
          },
          { 
            name: 'config', type: 'folder', isOpen: true, 
            children: [
              { name: 'package.json', type: 'file' },
              { name: 'tech-debt-log.js', type: 'file' },
              { name: 'agile-config.js', type: 'file' }
            ]
          }
        ]
      }
    ]
  };
  
  return campaignFileSystems[currentCampaign.value] || campaignFileSystems.chimera;
});

// --- Resizer Logic (Full and Correct) ---
const sidebarRef = shallowRef(null);
const terminalRef = shallowRef(null);
const resizerX = shallowRef(null);
const resizerY = shallowRef(null);

onMounted(() => {
  // Use nextTick to ensure all elements are rendered
  nextTick(() => {
    const sidebarElement = sidebarRef.value?.$el;
    const terminalElement = terminalRef.value?.$el;
    
    if (sidebarElement && resizerX.value) {
      makeResizable(sidebarElement, resizerX.value, 'x');
    }
    if (terminalElement && resizerY.value) {
      makeResizable(terminalElement, resizerY.value, 'y');
    }
  });
  
  // Initialize stats for the initial tab
  console.log('Initializing stats for activeTab:', activeTab.value);
  if (activeTab.value) {
    initializeTabStats(activeTab.value);
  }
  
  // Start challenge regeneration system
  startChallengeRegenerationSystem();
  
  // Initialize authentication state
  initializeAuth();
  
  // Check if user is pro and hide ads accordingly
  const isProUser = localStorage.getItem('pt_pro_user') === '1';
  const isAuthenticatedUser = authService.isUserAuthenticated();
  if (isAuthenticatedUser && isProUser) {
    showAds.value = false;
  } else {
    showAds.value = false;
  }
  
  // Initialize faded words opacity from settings
  const savedSettings = localStorage.getItem('pt_typing_settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      document.documentElement.style.setProperty('--faded-words-opacity', settings.fadedWordsBrightness || 0.5);
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  } else {
    document.documentElement.style.setProperty('--faded-words-opacity', '0.5');
  }
});

function initializeAuth() {
  // Check if user is already authenticated
  isAuthenticated.value = authService.isUserAuthenticated();
  currentUser.value = authService.getUser();
  
  // Set up authentication event listeners
  setupAuthListeners();
  
  // Initialize user stats service
  if (isAuthenticated.value) {
    userStatsService.onUserLogin();
    // Migrate anonymous Mining Rig progress to user account
    migrateAnonymousProgressToUser();
  }
}

function setupAuthListeners() {
  // Listen for authentication changes
  // Note: In a real implementation, you might want to use a more robust event system
  // For now, we'll check periodically and on user interactions
  setInterval(() => {
    const newAuthState = authService.isUserAuthenticated();
    const newUser = authService.getUser();
    
    if (newAuthState !== isAuthenticated.value) {
      isAuthenticated.value = newAuthState;
      currentUser.value = newUser;
      
      if (newAuthState) {
        // User logged in - restore pro status
        userStatsService.onUserLogin();
        migrateAnonymousProgressToUser();
        console.log('User logged in successfully');
        
        // Check if this user has pro status
        if (newUser && newUser.email) {
          const userProStatus = localStorage.getItem(`pt_pro_user_${newUser.email}`);
          if (userProStatus === '1') {
            localStorage.setItem('pt_pro_user', '1');
            localStorage.setItem('pt_ads_removed', '1');
            showAds.value = false;
          }
        }
      } else {
        userStatsService.onUserLogout();
        console.log('User logged out');
        handleLogout();
      }
    }
  }, 1000); // Check every second
}

function makeResizable(element, resizer, direction) {
  let isResizing = false;
  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isResizing = true;
    document.body.style.cursor = direction === 'x' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    if (direction === 'x') {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) element.style.flexBasis = `${newWidth}px`;
    } else {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 50 && newHeight < 400) element.style.flexBasis = `${newHeight}px`;
    }
  });
  
  document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  });
}

// --- FUNCTIONS (Full and Correct) ---
function handleOpenFile(filePath) {
  if (!openTabs.value.includes(filePath)) {
    openTabs.value.push(filePath);
  }
  activeTab.value = filePath;
  
  // Clear lingering effects only when NOT in matrix theme (matrix keeps static glow)
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme !== 'matrix') {
    clearAllGlowingEffects();
  }
  
  // Initialize tab stats for the newly opened file
  initializeTabStats(filePath);

  // Re-apply matrix glow when opening a new file (ensures next file glows after popup)
  setTimeout(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'matrix') {
      const editorElement = document.querySelector('#editor-container');
      const root = document.querySelector('#app') || document.body;
      if (root) root.style.textShadow = '0 0 6px #00ff00, 0 0 12px #00ff00';
      if (editorElement) {
        editorElement.querySelectorAll('.code-line').forEach(el => {
          el.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00';
          el.style.color = '#aaffaa';
          el.style.backgroundColor = 'rgba(0,255,0,0.04)';
        });
      }
    }
  }, 50);
}

function clearAllGlowingEffects() {
  // Get all code lines in the editor and clear any glowing effects
  const editorElement = document.querySelector('#editor-container');
  if (!editorElement) return;
  const theme = document.documentElement.getAttribute('data-theme');
  // In matrix theme, keep the static glow; do not clear it here.
  if (theme === 'matrix') return;
  
  const allCodeLines = editorElement.querySelectorAll('.code-line');
  allCodeLines.forEach(line => {
    line.style.textShadow = '';
    line.style.color = '';
    line.style.backgroundColor = '';
    line.style.transition = '';
  });
}

function closeTab(tabToClose) {
  const index = openTabs.value.indexOf(tabToClose);
  if (index === -1) return;
  openTabs.value.splice(index, 1);
  if (activeTab.value === tabToClose && openTabs.value.length > 0) {
    activeTab.value = openTabs.value[Math.max(0, index - 1)];
  } else if (openTabs.value.length === 0) {
    activeTab.value = null;
  }
}

function handleCreateFile(fileData) {
  const { filename, code } = fileData;
  fileContents[filename] = processUserInput(code, filename);

  const srcFolder = fileSystem.value[0].children.find(f => f.name === 'src');
  if (srcFolder && srcFolder.children) {
    srcFolder.children.push({ name: filename, type: 'file' });
  }

  handleOpenFile(filename);
  showNewFileModal.value = false;
}

// Initialize challenge stats for a tab
function initializeTabStats(fileName) {
  if (!tabChallengeStats[fileName]) {
    // Ensure content is loaded first
    if (!fileContents[fileName]) {
      fileContents[fileName] = generateCodeForFile(fileName);
    }
    
    const content = fileContents[fileName] || [];
    const totalChallenges = content.filter(line => line.isTypable).length;
    
    // Check if there are regenerated challenges
    const regen = fileChallengeRegeneration[fileName];
    const actualTotal = regen && regen.currentChallengeCount > 0 ? regen.currentChallengeCount : totalChallenges;
    
    tabChallengeStats[fileName] = {
      total: actualTotal,
      completed: 0,
      remaining: actualTotal
    };
  }
}

// Update challenge completion for a tab
function updateTabChallengeStats(fileName, completedCount) {
  console.log('updateTabChallengeStats called:', fileName, completedCount);
  if (tabChallengeStats[fileName]) {
    tabChallengeStats[fileName].completed = completedCount;
    
    // Get the current total challenges (including regenerated ones)
    const regen = fileChallengeRegeneration[fileName];
    const currentTotal = regen && regen.currentChallengeCount > 0 ? regen.currentChallengeCount : 
                        (fileContents[fileName] || []).filter(line => line.isTypable).length;
    
    tabChallengeStats[fileName].total = currentTotal;
    tabChallengeStats[fileName].remaining = currentTotal - completedCount;
    
    console.log('Updated stats for', fileName, ':', tabChallengeStats[fileName]);
    
    if (tabChallengeStats[fileName].remaining < 0) {
      tabChallengeStats[fileName].remaining = 0;
      tabChallengeStats[fileName].total = completedCount; // normalize if content changed
    }

    // If all challenges completed, switch to next tab
    if (tabChallengeStats[fileName].remaining === 0) {
      switchToNextTab();
    }
  } else {
    console.log('No tab stats found for:', fileName);
  }
}

// Switch to next tab with unfinished challenges
function switchToNextTab() {
  const tabsWithChallenges = openTabs.value.filter(tab => 
    tabChallengeStats[tab] && tabChallengeStats[tab].remaining > 0
  );
  
  if (tabsWithChallenges.length > 0) {
    const nextTab = tabsWithChallenges[0];
    activeTab.value = nextTab;
  } else {
    // All tabs completed, open a new one
    const newFiles = ['App.vue', 'Editor.vue', 'Sidebar.vue', 'TopBar.vue', 'Terminal.vue'];
    const availableFiles = newFiles.filter(file => !openTabs.value.includes(file));
    
    if (availableFiles.length > 0) {
      const randomFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
      handleOpenFile(randomFile);
    }
  }
}

// Get challenge stats for a tab
function getTabChallengeStats(fileName) {
  const stats = tabChallengeStats[fileName] || { total: 0, completed: 0, remaining: 0 };
  // Return stats for ${fileName}
  return stats;
}

// Challenge regeneration system
function startChallengeRegenerationSystem() {
  // Run every 30 seconds to check for challenge regeneration
  challengeRegenerationTimer.value = setInterval(() => {
    regenerateChallengesForClosedFiles();
  }, 30000); // 30 seconds
}

function regenerateChallengesForClosedFiles() {
  // Get all available files from the file system
  const allFiles = getAllAvailableFiles();
  
  allFiles.forEach(fileName => {
    // Skip if file is currently open or if it's the active tab
    if (openTabs.value.includes(fileName) || activeTab.value === fileName) {
      return;
    }
    
    // Initialize regeneration tracking if not exists
    if (!fileChallengeRegeneration[fileName]) {
      fileChallengeRegeneration[fileName] = {
        lastRegeneration: Date.now(),
        originalChallengeCount: 0,
        currentChallengeCount: 0
      };
    }
    
    const regen = fileChallengeRegeneration[fileName];
    const now = Date.now();
    const timeSinceLastRegen = now - regen.lastRegeneration;
    
    // Regenerate one challenge every 60 seconds (1 minute)
    if (timeSinceLastRegen >= 60000) {
      regenerateOneChallenge(fileName);
      regen.lastRegeneration = now;
    }
  });
}

function getAllAvailableFiles() {
  // Extract all file names from the file system structure
  const files = [];
  
  function extractFiles(node) {
    if (node.type === 'file') {
      files.push(node.name);
    } else if (node.children) {
      node.children.forEach(extractFiles);
    }
  }
  
  fileSystem.value.forEach(extractFiles);
  return files;
}

function regenerateOneChallenge(fileName) {
  // Get current content or generate new content
  if (!fileContents[fileName]) {
    fileContents[fileName] = generateCodeForFile(fileName);
  }
  
  const content = fileContents[fileName];
  const currentChallenges = content.filter(line => line.isTypable).length;
  
  // Initialize regeneration tracking if not exists
  if (!fileChallengeRegeneration[fileName]) {
    fileChallengeRegeneration[fileName] = {
      lastRegeneration: Date.now(),
      originalChallengeCount: currentChallenges,
      currentChallengeCount: currentChallenges
    };
  }
  
  const regen = fileChallengeRegeneration[fileName];
  
  // If original count is 0, set it to current count (first time)
  if (regen.originalChallengeCount === 0) {
    regen.originalChallengeCount = currentChallenges;
    regen.currentChallengeCount = currentChallenges;
  }
  
  // Only regenerate if we haven't reached the original count AND user hasn't completed all original challenges
  if (regen.currentChallengeCount < regen.originalChallengeCount) {
    // Check if user has already completed all original challenges
    const tabStats = tabChallengeStats[fileName];
    const userCompletedAll = tabStats && tabStats.completed >= regen.originalChallengeCount;
    
    // Don't add more challenges if user has already completed all original ones
    if (userCompletedAll) {
      return;
    }
    // Find a good position to insert a new challenge
    const codeLines = content.filter(line => !line.isTypable);
    if (codeLines.length > 0) {
      const randomIndex = Math.floor(Math.random() * codeLines.length);
      const insertPosition = content.indexOf(codeLines[randomIndex]);
      
      // Insert new challenge
      const newChallenge = generateTypingLine();
      content.splice(insertPosition, 0, {
        ...newChallenge,
        isTypable: true,
        indent: 0,
        prefixLength: 0,
        statuses: Array(newChallenge.text.length).fill('untyped'),
        isCompleted: false
      });
      
      regen.currentChallengeCount++;
      
      // Update tab stats if they exist and the file is not currently open
      if (tabChallengeStats[fileName] && !openTabs.value.includes(fileName)) {
        tabChallengeStats[fileName].total = regen.currentChallengeCount;
        tabChallengeStats[fileName].remaining = regen.currentChallengeCount - tabChallengeStats[fileName].completed;
      }
      
      // Challenge regenerated for ${fileName}
    }
  }
  
  // Initialize Mining Rig system
  loadMiningRigState();
  updateMiningRigCoinsPerSecond();
  startMiningRigTimer();
}

// Clean up timer on unmount
onUnmounted(() => {
  if (challengeRegenerationTimer.value) {
    clearInterval(challengeRegenerationTimer.value);
  }
  stopMiningRigTimer();
});
</script>

<template>
  <div id="full-app-container">
    <TopBar 
      :terminal-visible="terminalVisible"
      :mining-rig-state="miningRigState"
      @toggle-terminal="toggleTerminal"
      @open-help="openHelp"
      @open-settings="openSettings"
      @open-pro-upgrade="openProUpgrade"
      @user-logout="handleLogout"
      @switch-campaign="handleSwitchCampaign"
      @open-mining-rig="openMiningRig"
    />
    <div id="app-container">
      <Sidebar 
        ref="sidebarRef" 
        :file-system="fileSystem"
        :tab-challenge-stats="tabChallengeStats"
        :file-challenge-regeneration="fileChallengeRegeneration"
        :get-tab-challenge-stats="getTabChallengeStats"
        :current-campaign="currentCampaign"
        @open-file="handleOpenFile" 
        @new-file-modal="showNewFileModal = true" 
      />
      <div class="resizer resizer-x" ref="resizerX"></div>
      <div id="main-panel">
        <Editor 
          :open-tabs="openTabs" 
          :active-tab="activeTab"
          :custom-content="fileContents"
          :is-modal-open="showNewFileModal"
          :tab-challenge-stats="tabChallengeStats"
          :get-tab-challenge-stats="getTabChallengeStats"
          @update:activeTab="newTab => activeTab = newTab"
          @close-tab="closeTab"
          @initialize-tab-stats="initializeTabStats"
      @update-tab-challenge-stats="updateTabChallengeStats"
      @file-completed="handleFileCompleted"
      @key-pressed="handleKeyPressed"
        />
        <div v-if="terminalVisible" class="resizer resizer-y" ref="resizerY"></div>
        <Terminal v-if="terminalVisible" ref="terminalRef" :show-ads="showAds" @remove-ads="openRemoveAds" />
      </div>
      <RightAdBar v-if="showAds && !isAuthenticated" :show-ads="showAds" @remove-ads="openRemoveAds" />
      <TeamChat :show-chat="true" :is-authenticated="isAuthenticated" :current-campaign="currentCampaign" @cancel-campaign-switch="handleCancelCampaignSwitch" />
    </div>
    <NewFileModal 
      v-if="showNewFileModal" 
      @close="showNewFileModal = false" 
      @save="handleCreateFile" 
    />
    <RemoveAdsModal 
      v-if="showRemoveAdsModal" 
      @close="showRemoveAdsModal = false" 
      @purchased="onPurchased" 
    />
    <HelpModal 
      v-if="showHelpModal" 
      @close="showHelpModal = false" 
    />
    <SettingsModal 
      v-if="showSettingsModal" 
      @close="showSettingsModal = false"
      @open-pro-upgrade="openProUpgrade"
    />
    
    <!-- Mining Rig Modal -->
    <MiningRigModal 
      v-if="showMiningRig" 
      :game-state="miningRigState"
      @close="closeMiningRig"
      @update-game-state="updateMiningRigCoinsPerSecond"
      @reset-game="resetMiningRigGame"
    />
    
    <!-- Welcome Modal -->
    <WelcomeModal @close="handleWelcomeClose" />
    
    <!-- Coin Animations -->
    <div class="coin-animations">
      <div 
        v-for="animation in coinAnimations" 
        :key="animation.id"
        class="coin-animation"
        :style="{
          left: animation.x + 'px',
          top: animation.y + 'px',
          opacity: animation.opacity,
          transform: `scale(${animation.scale})`
        }"
      >
        +{{ animation.coins }} 💰
      </div>
    </div>
    
    <!-- Matrix Effect Overlay -->
    <div v-if="showMatrixEffect" class="matrix-overlay">
      <div class="matrix-text">
        <pre>{{ matrixText }}</pre>
      </div>
    </div>
    
    <!-- File Completion Animation -->
           <FileCompletionAnimation 
             :show="showFileCompletion"
             :file-name="completedFileName"
             :stats="completedFileStats"
             @close="closeFileCompletion"
             @start-next-file="startNextFile"
           />
  </div>
</template>

<style scoped>
#full-app-container { display: flex; flex-direction: column; height: 100vh; }
#app-container { display: flex; flex-grow: 1; overflow: hidden; }
#main-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.resizer { background-color: var(--border-color); z-index: 10; }
.resizer-x { cursor: col-resize; width: 4px; }
.resizer-y { cursor: row-resize; height: 4px; }
.resizer:hover { background-color: var(--keyword); }

/* Matrix Effect Styles */
.matrix-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: matrixFadeIn 0.5s ease-in;
}

.matrix-text {
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.2;
  text-align: center;
  max-width: 80%;
  animation: matrixGlow 2s ease-in-out infinite alternate;
}

@keyframes matrixFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes matrixGlow {
  from { 
    text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00;
  }
  to { 
    text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00;
  }
}

/* Coin Animation Styles */
.coin-animations {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.coin-animation {
  position: absolute;
  color: #ffd700;
  font-weight: bold;
  font-size: 1.2rem;
  text-shadow: 0 0 10px #ffd700;
  animation: coinFloat 2s ease-out forwards;
  pointer-events: none;
}

@keyframes coinFloat {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-20px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(0.8);
  }
}
</style>