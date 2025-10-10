<script setup>
import { ref, reactive, shallowRef, onMounted, onUnmounted, nextTick } from 'vue';
import TopBar from './components/TopBar.vue';
import Terminal from './components/Terminal.vue';
import Sidebar from './components/Sidebar.vue';
import Editor from './components/Editor.vue';
import NewFileModal from './components/NewFileModal.vue';
import RightAdBar from './components/RightAdBar.vue';
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

// Ads
const showAds = ref(localStorage.getItem('pt_ads_removed') !== '1');
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

function handleLogout() {
  // Clear pro status and ads when logging out
  localStorage.removeItem('pt_pro_user');
  localStorage.removeItem('pt_ads_removed');
  showAds.value = true;
  
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

// This is the full, rich file system data, making the sidebar populated.
const fileSystem = ref([
  { 
    name: 'codetype-pro', type: 'folder', isOpen: true, 
    children: [
      { 
        name: '.vscode', type: 'folder', isOpen: false, 
        children: [
          { name: 'settings.json', type: 'file' },
          { name: 'launch.json', type: 'file' },
          { name: 'extensions.json', type: 'file' },
          { name: 'tasks.json', type: 'file' }
        ]
      },
      { 
        name: 'dist', type: 'folder', isOpen: false, 
        children: [
          { name: 'index.html', type: 'file' },
          { name: 'assets', type: 'folder', isOpen: false, children: [
            { name: 'index.css', type: 'file' },
            { name: 'index.js', type: 'file' }
          ]}
        ]
      },
      { 
        name: 'node_modules', type: 'folder', isOpen: false, 
        children: [
          { name: 'vue', type: 'folder', isOpen: false, children: [
            { name: 'package.json', type: 'file' },
            { name: 'index.js', type: 'file' }
          ]},
          { name: 'chart.js', type: 'folder', isOpen: false, children: [
            { name: 'package.json', type: 'file' },
            { name: 'index.js', type: 'file' }
          ]}
        ]
      },
      { 
        name: 'public', type: 'folder', isOpen: false, 
        children: [
          { name: 'vite.svg', type: 'file' },
          { name: 'favicon.ico', type: 'file' },
          { name: 'robots.txt', type: 'file' },
          { name: 'manifest.json', type: 'file' }
        ]
      },
      { 
        name: 'src', type: 'folder', isOpen: true, 
        children: [
          { 
            name: 'assets', type: 'folder', isOpen: false, 
            children: [
              { name: 'logo.svg', type: 'file' },
              { name: 'main.css', type: 'file' },
              { name: 'vue.svg', type: 'file' },
              { name: 'favicon.ico', type: 'file' }
            ]
          },
          { 
            name: 'components', type: 'folder', isOpen: false, 
            children: [
              { name: 'Editor.vue', type: 'file' },
              { name: 'Sidebar.vue', type: 'file' },
              { name: 'Terminal.vue', type: 'file' },
              { name: 'TopBar.vue', type: 'file' },
              { name: 'Dashboard.vue', type: 'file' },
              { name: 'NewFileModal.vue', type: 'file' },
              { name: 'PerformanceGraph.vue', type: 'file' },
              { name: 'StatsChart.vue', type: 'file' },
              { name: 'UserProfile.vue', type: 'file' }
            ]
          },
          { 
            name: 'services', type: 'folder', isOpen: false, 
            children: [
              { name: 'authService.js', type: 'file' },
              { name: 'userStatsService.js', type: 'file' }
            ]
          },
          { name: 'App.vue', type: 'file' },
          { name: 'main.js', type: 'file' },
          { name: 'style.css', type: 'file' },
          { name: 'codeGenerator.js', type: 'file' },
          { name: 'adaptiveWordSelector.js', type: 'file' },
          { name: 'eventBus.js', type: 'file' },
          { name: 'statistics.js', type: 'file' }
        ]
      },
      { name: '.gitignore', type: 'file' },
      { name: 'index.html', type: 'file' },
      { name: 'package.json', type: 'file' },
      { name: 'package-lock.json', type: 'file' },
      { name: 'README.md', type: 'file' },
      { name: 'vite.config.js', type: 'file' },
      { name: 'GOOGLE_AUTH_SETUP.md', type: 'file' }
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
  initializeTabStats(activeTab.value);
  
  // Start challenge regeneration system
  startChallengeRegenerationSystem();
  
  // Initialize authentication state
  initializeAuth();
  
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
  
  // Initialize tab stats for the newly opened file
  initializeTabStats(filePath);
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
  fileContents[filename] = processUserInput(code);

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
  if (tabChallengeStats[fileName]) {
    tabChallengeStats[fileName].completed = completedCount;
    tabChallengeStats[fileName].remaining = tabChallengeStats[fileName].total - completedCount;
    if (tabChallengeStats[fileName].remaining < 0) {
      tabChallengeStats[fileName].remaining = 0;
      tabChallengeStats[fileName].total = completedCount; // normalize if content changed
    }

    // If all challenges completed, switch to next tab
    if (tabChallengeStats[fileName].remaining === 0) {
      switchToNextTab();
    }
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
  
  // Only regenerate if we haven't reached the original count
  if (regen.currentChallengeCount < regen.originalChallengeCount) {
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
      @toggle-terminal="toggleTerminal"
      @open-help="openHelp"
      @open-settings="openSettings"
      @open-pro-upgrade="openProUpgrade"
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
        />
        <div v-if="terminalVisible" class="resizer resizer-y" ref="resizerY"></div>
        <Terminal v-if="terminalVisible" ref="terminalRef" :show-ads="showAds" />
      </div>
      <RightAdBar v-if="showAds" :show-ads="showAds" @remove-ads="openRemoveAds" />
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
</style>