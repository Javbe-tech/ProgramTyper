<script setup>
import { ref, reactive, shallowRef, onMounted, onUnmounted, nextTick } from 'vue';
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
const completedFiles = ref(0); // Track completed files for Run button
const runButtonActive = ref(false); // Run button state
const showMatrixEffect = ref(false); // Matrix effect state
const matrixText = ref(''); // Matrix effect text
const showFileCompletion = ref(false); // File completion animation state
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

// Run button functionality
function handleRunButton() {
  if (!runButtonActive.value) return;
  
  runButtonActive.value = false;
  showMatrixEffect.value = true;
  
  // Start the enhanced run sequence
  startRunSequence();
}

function startRunSequence() {
  let currentStep = 0;
  const totalSteps = 5;
  
  // Different challenge sets for different themes
  const challengeSets = {
    hacker: [
      "sudo rm -rf /",
      "git push --force", 
      "npm install --global",
      "chmod 777 *",
      "dd if=/dev/zero of=/dev/sda"
    ],
    eye: [
      "watch -n 1 ps aux",
      "strace -f -e trace=network",
      "tcpdump -i any -n",
      "netstat -tulpn",
      "ss -tulpn"
    ],
    skull: [
      "kill -9 -1",
      "rm -rf /boot",
      "dd if=/dev/urandom of=/dev/sda",
      "mkfs.ext4 /dev/sda",
      "shutdown -h now"
    ],
    spider: [
      "curl -X POST http://target.com",
      "wget --spider -r http://site.com",
      "nmap -sS -O target.com",
      "nikto -h target.com",
      "sqlmap -u 'http://target.com'"
    ],
    crystal: [
      "tarot --spread celtic-cross",
      "fortune -s",
      "crystal ball --predict",
      "divine --future",
      "prophesy --destiny"
    ]
  };
  
  let currentChallenge = '';
  let userInput = '';
  let isWaitingForInput = false;
  
  // Randomly select 5 different effects for this run
  const selectedEffects = [];
  const availableEffects = [...matrixEffects];
  
  for (let i = 0; i < totalSteps; i++) {
    const randomIndex = Math.floor(Math.random() * availableEffects.length);
    selectedEffects.push(availableEffects[randomIndex]);
    availableEffects.splice(randomIndex, 1); // Remove to avoid duplicates
  }
  
  // Determine which challenge set to use based on the first effect
  let challengeSet = 'hacker'; // default
  const firstEffect = selectedEffects[0];
  if (firstEffect.includes('👁️')) {
    challengeSet = 'eye';
  } else if (firstEffect.includes('💀')) {
    challengeSet = 'skull';
  } else if (firstEffect.includes('🕷️')) {
    challengeSet = 'spider';
  } else if (firstEffect.includes('🔮')) {
    challengeSet = 'crystal';
  }
  
  const challenges = challengeSets[challengeSet];
  
  function nextStep() {
    if (currentStep >= totalSteps) {
      // Final glitch effect
      showGlitchEffect();
      return;
    }
    
    // Show randomly selected matrix effect
    const effect = selectedEffects[currentStep];
    matrixText.value = effect;
    
    // Show typing challenge after matrix effect
    setTimeout(() => {
      showTypingChallenge(currentStep);
      currentStep++;
    }, 2000);
  }
  
  function showTypingChallenge(step) {
    // Ensure step is within bounds
    const safeStep = Math.min(step, challenges.length - 1);
    console.log('showTypingChallenge called with step:', step, 'safeStep:', safeStep);
    console.log('challenges array:', challenges);
    console.log('challenge at safeStep:', challenges[safeStep]);
    
    currentChallenge = challenges[safeStep];
    userInput = '';
    isWaitingForInput = true;
    
    console.log('currentChallenge set to:', currentChallenge);
    
    matrixText.value = `\n\n> ${currentChallenge}\n> Type this command to continue...\n\n`;
    
    // Add keydown listener for typing
    document.addEventListener('keydown', handleRunTyping);
  }
  
  function handleRunTyping(event) {
    if (!isWaitingForInput) return;
    
    if (event.key === 'Enter') {
      if (userInput.trim() === currentChallenge) {
        // Correct input
        matrixText.value += `\n> Command executed successfully!\n`;
        isWaitingForInput = false;
        document.removeEventListener('keydown', handleRunTyping);
        setTimeout(nextStep, 1000);
      } else {
        // Wrong input
        matrixText.value += `\n> Error: Command not found. Try again.\n`;
        userInput = '';
      }
    } else if (event.key === 'Backspace') {
      if (userInput.length > 0) {
        userInput = userInput.slice(0, -1);
      }
    } else if (event.key.length === 1) {
      userInput += event.key;
    }
    
    // Update display with current input
    if (isWaitingForInput) {
      const cursor = '_';
      const displayText = `\n\n> ${currentChallenge}\n> Type this command to continue...\n\n> ${userInput}${cursor}`;
      matrixText.value = displayText;
    }
  }
  
  function showGlitchEffect() {
    // Glitch effect with random characters
    let glitchText = '';
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    
    for (let i = 0; i < 20; i++) {
      glitchText += chars[Math.floor(Math.random() * chars.length)];
    }
    
    matrixText.value = `\n\nSYSTEM ERROR: ${glitchText}\nCORRUPTION DETECTED\nRETURNING TO MAIN INTERFACE...\n\n`;
    
    // Hide effect and return to main screen
    setTimeout(() => {
      showMatrixEffect.value = false;
      document.removeEventListener('keydown', handleRunTyping);
    }, 3000);
  }
  
  // Start the sequence
  nextStep();
}

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
  console.log('Current completedFiles:', completedFiles.value);
  
  // Track completed files for Run button
  completedFiles.value++;
  if (completedFiles.value % 2 === 0) {
    runButtonActive.value = true;
    console.log('Run button activated!');
  }
  
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

function openProUpgrade() {
  showRemoveAdsModal.value = true;
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

// Authentication state
const isAuthenticated = ref(false);
const currentUser = ref(null);

// File system with multiple unique code files for typing practice
const fileSystem = ref([
  { 
    name: 'typing-practice', type: 'folder', isOpen: true, 
    children: [
      { 
        name: 'javascript', type: 'folder', isOpen: true, 
        children: [
          { name: 'main.js', type: 'file' },
          { name: 'utils.js', type: 'file' },
          { name: 'api.js', type: 'file' },
          { name: 'validation.js', type: 'file' },
          { name: 'helpers.js', type: 'file' }
        ]
      },
      { 
        name: 'react', type: 'folder', isOpen: true, 
        children: [
          { name: 'App.jsx', type: 'file' },
          { name: 'components', type: 'folder', isOpen: true, children: [
            { name: 'Header.jsx', type: 'file' },
            { name: 'Footer.jsx', type: 'file' },
            { name: 'Button.jsx', type: 'file' },
            { name: 'Modal.jsx', type: 'file' }
          ]},
          { name: 'hooks', type: 'folder', isOpen: true, children: [
            { name: 'useAuth.js', type: 'file' },
            { name: 'useLocalStorage.js', type: 'file' }
          ]}
        ]
      },
      { 
        name: 'python', type: 'folder', isOpen: true, 
        children: [
          { name: 'main.py', type: 'file' },
          { name: 'data_processing.py', type: 'file' },
          { name: 'machine_learning.py', type: 'file' },
          { name: 'web_scraper.py', type: 'file' }
        ]
      },
      { 
        name: 'vue', type: 'folder', isOpen: true, 
        children: [
          { name: 'App.vue', type: 'file' },
          { name: 'components', type: 'folder', isOpen: true, children: [
            { name: 'Editor.vue', type: 'file' },
            { name: 'Sidebar.vue', type: 'file' },
            { name: 'Terminal.vue', type: 'file' }
          ]}
        ]
      },
      { 
        name: 'css', type: 'folder', isOpen: true, 
        children: [
          { name: 'styles.css', type: 'file' },
          { name: 'animations.css', type: 'file' },
          { name: 'responsive.css', type: 'file' }
        ]
      },
      { 
        name: 'html', type: 'folder', isOpen: true, 
        children: [
          { name: 'index.html', type: 'file' },
          { name: 'about.html', type: 'file' },
          { name: 'contact.html', type: 'file' }
        ]
      },
      { 
        name: 'config', type: 'folder', isOpen: true, 
        children: [
          { name: 'package.json', type: 'file' },
          { name: 'webpack.config.js', type: 'file' },
          { name: 'babel.config.js', type: 'file' },
          { name: 'eslint.config.js', type: 'file' }
        ]
      }
    ]
  }
]);

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
}

// Clean up timer on unmount
onUnmounted(() => {
  if (challengeRegenerationTimer.value) {
    clearInterval(challengeRegenerationTimer.value);
  }
});
</script>

<template>
  <div id="full-app-container">
    <TopBar 
      :terminal-visible="terminalVisible"
      :run-button-active="runButtonActive"
      @toggle-terminal="toggleTerminal"
      @open-help="openHelp"
      @open-settings="openSettings"
      @open-pro-upgrade="openProUpgrade"
      @user-logout="handleLogout"
      @run-button="handleRunButton"
    />
    <div id="app-container">
      <Sidebar 
        ref="sidebarRef" 
        :file-system="fileSystem"
        :tab-challenge-stats="tabChallengeStats"
        :file-challenge-regeneration="fileChallengeRegeneration"
        :get-tab-challenge-stats="getTabChallengeStats"
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
        />
        <div v-if="terminalVisible" class="resizer resizer-y" ref="resizerY"></div>
        <Terminal v-if="terminalVisible" ref="terminalRef" :show-ads="showAds" @remove-ads="openRemoveAds" />
      </div>
      <RightAdBar v-if="showAds && !isAuthenticated" :show-ads="showAds" @remove-ads="openRemoveAds" />
      <TeamChat v-if="isAuthenticated" :show-chat="true" />
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
</style>