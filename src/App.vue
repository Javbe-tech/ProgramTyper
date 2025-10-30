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
import PrestigeTree from './components/PrestigeTree.vue';
import RebootConfirm from './components/RebootConfirm.vue';
import RealEstateModal from './components/RealEstateModal.vue';
import { processUserInput, generateCodeForFile, generateTypingLine } from './codeGenerator.js';
import { authService } from './services/authService.js';
import { userStatsService } from './services/userStatsService.js';
import { settingsService } from './services/settingsService.js';

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
const showPrestigeTree = ref(false);
const showRebootConfirm = ref(false);
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
    // New upgrade model: levels instead of multipliers
    wordEfficiencyLevel: 0, // +0.5 coins per correct key per level
    ergonomicKeyboardLevel: 0, // typing multiplier, modest per-level boost
    softwarePatchLevel: 0, // Phase 3: 0..120
    networkSecurityLevel: 0 // Phase 3: 0..15 purchased
  },
  // Wattage system
  currentWattage: 0,
  maxWattage: 250,
  // Soft-cap efficiency and real-estate bonus
  networkEfficiency: 1.0,
  totalRealEstateBonus: 1.0,
  reputation: 0, // Phase 3: increases with achievements
  // Phase 4: market surges and per-hardware boosts
  activeBuff: null, // { type: 'bull'|'typing'|'hardware', untilMs:number, target?:string, mult?:number }
  nextSurgeMs: 0,
  perHardwareBoosts: {}, // { key: multiplier }
  // Phase 5: Prestige
  totalCoinsMinedAllTime: 0,
  prestigeLevel: 0,
  prestigeTokens: 0,
  prestigeTree: {},
  // Real estate progression (purchase flags in order; fortress unlocked after 6)
  realEstate: {
    parentsBasement: false,
    studioApartment: false,
    suburbanHouse: false,
    downtownLoft: false,
    techMansion: false,
    corporateOffice: false,
    dataFortress: false
  },
  // Persistent hardware unlock flags (once unlocked, stays unlocked)
  unlocked: {
    calculator: true,
    smartDoorbells: false,
    macbooks: false,
    cellphone: false,
    kitchenAppliance: false,
    smartFridge: false,
    gpuRig: false,
    aiChatGPU: false,
    serverRack: false
  }
});

// Mining Rig Game Timer
let miningRigTimer = null;
let lastTickMs = 0;
let lastSavedMs = 0;
const SAVE_INTERVAL_MS = 10000; // throttle saves to every 10s
const currentTimeMs = ref(Date.now());

function startMiningRigTimer() {
  // Stop any existing timer first
  if (miningRigTimer) {
    clearInterval(miningRigTimer);
    miningRigTimer = null;
  }

  lastTickMs = Date.now();
  lastSavedMs = lastTickMs;

  if (!import.meta.env.DEV) {
    // reduce console spam in production
    console.log('Starting Mining Rig timer');
  }

  // Smaller interval with delta-time prevents drift and keeps UI responsive
  miningRigTimer = setInterval(() => {
    const now = Date.now();
    currentTimeMs.value = now;
    const dtSeconds = Math.max(0, (now - lastTickMs) / 1000);
    lastTickMs = now;

    const incomePerSecond = miningRigState.coinsPerSecond;
    if (incomePerSecond > 0 && dtSeconds > 0) {
      const incomeToAdd = incomePerSecond * dtSeconds;
      miningRigState.currentColdCoins += incomeToAdd;
      miningRigState.totalCoinsMinedAllTime += incomeToAdd;
    }

    // Phase 4: handle market surge scheduling/expiry
    if (!miningRigState.nextSurgeMs || now > miningRigState.nextSurgeMs) {
      scheduleNextSurge();
    }
    if (miningRigState.activeBuff && now > miningRigState.activeBuff.untilMs) {
      clearActiveBuff();
    }

    // Throttle persistence to reduce main-thread work
    if (now - lastSavedMs >= SAVE_INTERVAL_MS) {
      lastSavedMs = now;
      saveMiningRigState();
    }
  }, 250);
}

function stopMiningRigTimer() {
  if (miningRigTimer) {
    if (import.meta.env.DEV) console.log('Stopping Mining Rig timer...');
    clearInterval(miningRigTimer);
    miningRigTimer = null;
  }
}

function saveMiningRigState() {
  try {
    // Save to user-specific storage if authenticated, otherwise general storage
    const user = authService.getUser();
    const storageKey = user && user.id ? `miningRigGameState_${user.id}` : 'miningRigGameState';

    localStorage.setItem(storageKey, JSON.stringify(miningRigState));
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
      // Backfill new upgrades with defaults if missing
      if (typeof miningRigState.upgrades.wordEfficiencyLevel !== 'number') miningRigState.upgrades.wordEfficiencyLevel = 0;
      if (typeof miningRigState.upgrades.ergonomicKeyboardLevel !== 'number') miningRigState.upgrades.ergonomicKeyboardLevel = 0;
      if (typeof miningRigState.upgrades.softwarePatchLevel !== 'number') miningRigState.upgrades.softwarePatchLevel = 0;
      if (typeof miningRigState.upgrades.networkSecurityLevel !== 'number') miningRigState.upgrades.networkSecurityLevel = 0;
      if (typeof miningRigState.upgrades.networkBandwidthLevel !== 'number') miningRigState.upgrades.networkBandwidthLevel = 0;
      if (typeof miningRigState.networkEfficiency !== 'number') miningRigState.networkEfficiency = 1.0;
      if (typeof miningRigState.totalRealEstateBonus !== 'number') miningRigState.totalRealEstateBonus = 1.0;
      // Recalculate real estate bonus based on owned properties (defensive)
      try {
        const flags = miningRigState.realEstate || {};
        const bonuses = {
          parentsBasement: 1.05,
          studioApartment: 1.10,
          suburbanHouse: 1.15,
          downtownLoft: 1.20,
          techMansion: 1.25,
          corporateOffice: 1.30,
          dataFortress: 1.50
        };
        let product = 1.0;
        Object.keys(bonuses).forEach(k => { if (flags[k]) product *= bonuses[k]; });
        miningRigState.totalRealEstateBonus = product;
      } catch {}
      if (typeof miningRigState.totalCoinsMinedAllTime !== 'number') miningRigState.totalCoinsMinedAllTime = 0;
      if (typeof miningRigState.prestigeLevel !== 'number') miningRigState.prestigeLevel = 0;
      if (typeof miningRigState.prestigeTokens !== 'number') miningRigState.prestigeTokens = 0;
      if (!miningRigState.prestigeTree) miningRigState.prestigeTree = {};
      // Ensure unlocked flags exist
      if (!miningRigState.unlocked) {
        miningRigState.unlocked = {
          calculator: true,
          smartDoorbells: false,
          macbooks: false,
          cellphone: false,
          kitchenAppliance: false,
          smartFridge: false,
          gpuRig: false,
          aiChatGPU: false,
          serverRack: false
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
    calculator: { coinsPerSecond: 0.05 },
    smartDoorbells: { coinsPerSecond: 0.3 },
    macbooks: { coinsPerSecond: 1.2 },
    cellphone: { coinsPerSecond: 2.5 },
    kitchenAppliance: { coinsPerSecond: 8 },
    smartFridge: { coinsPerSecond: 25 },
    gpuRig: { coinsPerSecond: 100 },
    aiChatGPU: { coinsPerSecond: 500 },
    serverRack: { coinsPerSecond: 2500 }
  };

  // === Phase 2: Tiered hardware multipliers, calculator engine, and synergies ===
  const tierThresholds = [1,5,25,50,100,150,200,250,300,350,400,450,500,550];
  const hardwareKeys = ['smartDoorbells','macbooks','cellphone','kitchenAppliance','smartFridge','gpuRig','aiChatGPU','serverRack'];
  function getTierMultiplier(key, owned) {
    if (key === 'calculator') return 1.0; // handled separately
    let unlocked = 0;
    for (const t of tierThresholds) { if (owned >= t) unlocked++; }
    // each unlocked tier doubles that hardware's output
    return Math.pow(2, unlocked);
  }
  // Calculator scaling engine
  function getCalculatorBonusPerUnit(hardwareCounts) {
    const calcOwned = hardwareCounts.calculator || 0;
    const nonCalcOwned = Object.entries(hardwareCounts)
      .filter(([k]) => k !== 'calculator')
      .reduce((s, [,v]) => s + (v||0), 0);
    let bonus = 0.1 * nonCalcOwned; // base bonus per calculator
    // multiplicative milestones
    if (calcOwned >= 50) bonus *= 5;
    if (calcOwned >= 100) bonus *= 10;
    if (calcOwned >= 150) bonus *= 20;
    if (calcOwned >= 200) bonus *= 20;
    if (calcOwned >= 300) bonus *= 20;
    if (calcOwned >= 400) bonus *= 20;
    return bonus; // coins/sec added to EACH calculator
  }
  // Synergies
  const synergies = [
    { lower: 'smartDoorbells', higher: 'macbooks' },
    { lower: 'cellphone', higher: 'kitchenAppliance' },
    { lower: 'smartFridge', higher: 'gpuRig' },
    { lower: 'aiChatGPU', higher: 'serverRack' },
    { lower: 'macbooks', higher: 'gpuRig' },
    { lower: 'calculator', higher: 'serverRack' },
    { lower: 'smartDoorbells', higher: 'aiChatGPU' },
    { lower: 'kitchenAppliance', higher: 'serverRack' }
  ];
  function getSynergyMultipliers(hardwareCounts) {
    const mult = { calculator: 1, smartDoorbells: 1, macbooks: 1, cellphone: 1, kitchenAppliance: 1, smartFridge: 1, gpuRig: 1, aiChatGPU: 1, serverRack: 1 };
    for (const s of synergies) {
      const lowerOwned = hardwareCounts[s.lower] || 0;
      const higherOwned = hardwareCounts[s.higher] || 0;
      if (lowerOwned >= 15 && higherOwned >= 15) {
        mult[s.higher] *= (1 + 0.05 * lowerOwned); // +5% per lower unit
        mult[s.lower] *= (1 + 0.001 * higherOwned); // +0.1% per higher unit
      }
    }
    return mult;
  }
  
  // Compute base contributions with phase 2 multipliers
  const counts = miningRigState.hardware;
  const synergyMult = getSynergyMultipliers(counts);
  let total = 0;
  for (const [hardwareType, quantity] of Object.entries(counts)) {
    const definition = hardwareDefinitions[hardwareType];
    if (!definition || quantity <= 0) continue;
    let perUnit = definition.coinsPerSecond;
    if (hardwareType === 'calculator') {
      perUnit += getCalculatorBonusPerUnit(counts);
    }
    // Phase 4: apply per-hardware temporary boosts
    const boost = (miningRigState.perHardwareBoosts && miningRigState.perHardwareBoosts[hardwareType]) || 1.0;
    let typeMult = synergyMult[hardwareType] || 1;
    if (hardwareType !== 'calculator') {
      typeMult *= getTierMultiplier(hardwareType, quantity);
    }
    const contribution = quantity * perUnit * typeMult * boost;
    total += contribution;
    console.log(`${hardwareType}: ${quantity} × ${perUnit} × mult(${typeMult}) = ${contribution} coins/sec`);
  }
  
  // Phase 3: passive boost removed -> set to 1
  const passiveMultiplier = 1;
  // Software Patch multiplier (1..120): first 40 ×1.01, next 40 ×1.02, final 40 ×1.03 (multiplying)
  const sp = Math.max(0, Math.floor(miningRigState.upgrades.softwarePatchLevel || 0));
  const sp1 = Math.min(sp, 40);
  const sp2 = Math.min(Math.max(sp - 40, 0), 40);
  const sp3 = Math.min(Math.max(sp - 80, 0), 40);
  const softwarePatchBonus = Math.pow(1.01, sp1) * Math.pow(1.02, sp2) * Math.pow(1.03, sp3);
  // Network Security multiplier: product_i (1 + coeff[i]*reputation) for purchased levels
  const nsLevel = Math.max(0, Math.floor(miningRigState.upgrades.networkSecurityLevel || 0));
  // Derive reputation from lifetime coins using logarithmic scaling to avoid runaway growth
  const totalAllTime = Math.max(0, miningRigState.totalCoinsMinedAllTime || 0);
  miningRigState.reputation = Math.floor(Math.log10(totalAllTime + 1)); // 0,1,2,... (gentle growth)
  const reputation = miningRigState.reputation;
  const nsCoeffs = [0.10,0.125,0.15,0.175,0.20,0.225,0.25,0.275,0.30,0.325,0.35,0.375,0.40,0.425,0.45];
  let networkSecurityBonus = 1.0;
  for (let i = 0; i < Math.min(nsLevel, nsCoeffs.length); i++) {
    // Reputation influence is modest: divide by 10 and cap reputation effect to 10
    const repFactor = Math.min(reputation, 10) / 10;
    networkSecurityBonus *= (1 + nsCoeffs[i] * repFactor);
  }
  // Hard cap to prevent runaway multipliers
  networkSecurityBonus = Math.min(networkSecurityBonus, 10);
  // Recalculate network efficiency (soft-cap)
  if (miningRigState.currentWattage <= miningRigState.maxWattage) {
    miningRigState.networkEfficiency = 1.0;
  } else {
    const wattageOverload = miningRigState.currentWattage - miningRigState.maxWattage;
    let eff = 1.0 - (0.005 * wattageOverload);
    if (eff < 0.1) eff = 0.1;
    miningRigState.networkEfficiency = eff;
  }
  const oldCoinsPerSecond = miningRigState.coinsPerSecond;
  const prestigeBonus = 1 + (miningRigState.prestigeLevel || 0) * 0.01;
  miningRigState.coinsPerSecond = total 
    * passiveMultiplier 
    * softwarePatchBonus 
    * (miningRigState.activeBuff?.type === 'bull' ? 7 : 1)
    * networkSecurityBonus 
    * miningRigState.networkEfficiency 
    * (miningRigState.totalRealEstateBonus || 1.0)
    * prestigeBonus;
  
  console.log(`Total passive income: ${total} × sp(${softwarePatchBonus.toFixed(3)}) × ns(${networkSecurityBonus.toFixed(3)}) × eff(${miningRigState.networkEfficiency}) × estate(${miningRigState.totalRealEstateBonus}) = ${miningRigState.coinsPerSecond} coins/sec`);
  console.log(`Previous coins/sec: ${oldCoinsPerSecond}, New coins/sec: ${miningRigState.coinsPerSecond}`);
  console.log('=== END UPDATE ===');
  // Persist immediately when coins/second changes due to purchases/sales/upgrades
  saveMiningRigState();
}

// === Phase 4: Market Surges ===
function scheduleNextSurge() {
  const now = Date.now();
  // 30–120 seconds from now (was 300–900)
  const delay = (30 + Math.random() * 90) * 1000;
  miningRigState.nextSurgeMs = now + delay;
}
function clearActiveBuff() {
  miningRigState.activeBuff = null;
  miningRigState.perHardwareBoosts = {};
}
function triggerSurge() {
  const roll = Math.random();
  const now = Date.now();
  if (roll < 0.40) {
    // Bull Market: x7 passive income for 77s
    miningRigState.activeBuff = { type: 'bull', untilMs: now + 77000 };
  } else if (roll < 0.80) {
    // Sudden Windfall: 15 minutes of passive income instantly
    miningRigState.currentColdCoins += miningRigState.coinsPerSecond * 900;
    clearActiveBuff();
  } else if (roll < 0.83) {
    // Typing Frenzy: x777 typing for 13s
    miningRigState.activeBuff = { type: 'typing', untilMs: now + 13000 };
  } else if (roll < 0.91) {
    // Hardware Special: boost one random hardware for 30s
    const keys = Object.keys(miningRigState.hardware);
    const target = keys[Math.floor(Math.random() * keys.length)];
    miningRigState.perHardwareBoosts = { [target]: 5.0 };
    miningRigState.activeBuff = { type: 'hardware', target, untilMs: now + 30000 };
  } else {
    // No buff this time; reschedule sooner
    miningRigState.nextSurgeMs = now + 60000;
    return;
  }
  // Next surge after current ends
  miningRigState.nextSurgeMs = now + 600000; // 10 minutes placeholder
}

// Visual feedback for coin earning
const coinAnimations = ref([]);

function addCoinAnimation(coinsEarned, x, y) {
  // Check if coin animations are enabled in settings
  const settings = settingsService.getSettings();
  if (!settings.showCoinAnimations) {
    return; // Don't add animation if disabled
  }
  
  const animation = {
    id: Date.now() + Math.random(),
    coins: coinsEarned,
    x: x,
    y: y,
    opacity: 1,
    scale: 1
  };
  coinAnimations.value.push(animation);
  // Prevent unbounded growth
  if (coinAnimations.value.length > 30) {
    coinAnimations.value.splice(0, coinAnimations.value.length - 30);
  }
  
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
    // Disable typing earnings while overlays/modals are open
    if (showMiningRig.value || (typeof showRealEstate !== 'undefined' && showRealEstate.value) || showNewFileModal.value || showSettingsModal.value || showHelpModal.value || showRemoveAdsModal.value) {
      return;
    }
    const level = miningRigState.upgrades.wordEfficiencyLevel || 0;
    const base = miningRigState.coinsPerWord + 0.5 * level;
    const kbLevel = Math.min(100, miningRigState.upgrades.ergonomicKeyboardLevel || 0);
    const typingMultiplier = Math.pow(1.07, kbLevel); // ~+7%/level, compounding up to 100
    // Apply software patches and network security to typing as well
    const sp = Math.max(0, Math.floor(miningRigState.upgrades.softwarePatchLevel || 0));
    const sp1 = Math.min(sp, 40);
    const sp2 = Math.min(Math.max(sp - 40, 0), 40);
    const sp3 = Math.min(Math.max(sp - 80, 0), 40);
    const softwarePatchBonus = Math.pow(1.01, sp1) * Math.pow(1.02, sp2) * Math.pow(1.03, sp3);
    const nsLevel = Math.max(0, Math.floor(miningRigState.upgrades.networkSecurityLevel || 0));
    const reputation = miningRigState.reputation || 0;
    const nsCoeffs = [0.10,0.125,0.15,0.175,0.20,0.225,0.25,0.275,0.30,0.325,0.35,0.375,0.40,0.425,0.45];
    let networkSecurityBonus = 1.0;
    for (let i = 0; i < Math.min(nsLevel, nsCoeffs.length); i++) {
      networkSecurityBonus *= (1 + nsCoeffs[i] * reputation);
    }
    // Phase 4 typing unlocks
    const hw = miningRigState.hardware;
    let typingBuff = 1.0;
    if ((hw.gpuRig || 0) >= 1) typingBuff *= 1.5; // AI Predictive Text
    if ((hw.smartFridge || 0) >= 50) typingBuff *= 1.05; // Haptic Feedback Loop
    if ((hw.aiChatGPU || 0) >= 10) typingBuff *= 1.10; // Sub-Vocal Processing
    if ((hw.serverRack || 0) >= 100) typingBuff *= 1.20; // Direct Neural Interface
    // Decentralized Keystroke Logging: +0.1 base per 1000 cps passive
    const extraBase = 0.1 * Math.floor((miningRigState.coinsPerSecond || 0) / 1000);
    const bandwidthLevel = Math.min(10, Math.max(0, miningRigState.upgrades.networkBandwidthLevel || 0));
    const bandwidthMultiplier = 1 + ((miningRigState.coinsPerSecond || 0) / 1000000) * (bandwidthLevel / 10);
    const prestigeBonus = 1 + (miningRigState.prestigeLevel || 0) * 0.01;
    const coinsEarned = (base + extraBase) * typingMultiplier * typingBuff * bandwidthMultiplier * (miningRigState.totalRealEstateBonus || 1.0) * softwarePatchBonus * networkSecurityBonus * prestigeBonus * (miningRigState.activeBuff?.type === 'typing' ? 777 : 1);
    miningRigState.currentColdCoins += coinsEarned;
    miningRigState.totalCoinsMinedAllTime += coinsEarned;
    
    console.log(`Key press earned ${coinsEarned} coins, calling saveMiningRigState`);
    saveMiningRigState();
    
    // Add visual feedback
    const randomX = Math.random() * window.innerWidth;
    const randomY = Math.random() * window.innerHeight;
    addCoinAnimation(parseFloat(coinsEarned.toFixed(2)), randomX, randomY);
    
    console.log(`Earned ${coinsEarned} ColdCoins for correct key press: ${keyData.key}`);
  }
}
const showMiningRig = ref(false);
const showRealEstate = ref(false);
const showFileCompletion = ref(false);
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
    wordEfficiencyLevel: 0,
    passiveBoostLevel: 0,
    ergonomicKeyboardLevel: 0
  };
  // Reset power and real estate
  miningRigState.currentWattage = 0;
  miningRigState.maxWattage = 100;
  miningRigState.realEstate = {
    parentsBasement: false,
    studioApartment: false,
    suburbanHouse: false,
    downtownLoft: false,
    techMansion: false,
    corporateOffice: false,
    dataFortress: false
  };
  // Reset sticky unlock flags
  miningRigState.unlocked = {
    calculator: true,
    smartDoorbells: false,
    macbooks: false,
    cellphone: false,
    kitchenAppliance: false,
    smartFridge: false,
    gpuRig: false,
    aiChatGPU: false,
    serverRack: false
  };
  
  // Update coins per second and save
  updateMiningRigCoinsPerSecond();
  saveMiningRigState();
  
  console.log('Mining Rig game reset!');
}

// Phase 5: Prestige reboot
function computePrestigeLevelFromTotal(total) {
  return Math.floor(Math.cbrt((total || 0) / 1_000_000_000_000));
}
function rebootPrestige() {
  const currentLevel = miningRigState.prestigeLevel || 0;
  const newLevel = computePrestigeLevelFromTotal(miningRigState.totalCoinsMinedAllTime || 0);
  const gained = Math.max(0, newLevel - currentLevel);
  // Award tokens equal to newly earned levels
  if (gained > 0) miningRigState.prestigeTokens = (miningRigState.prestigeTokens || 0) + gained;
  miningRigState.prestigeLevel = newLevel;
  // Reset run state
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
    wordEfficiencyLevel: 0,
    ergonomicKeyboardLevel: 0,
    softwarePatchLevel: 0,
    networkSecurityLevel: 0,
    networkBandwidthLevel: 0
  };
  miningRigState.reputation = 0;
  miningRigState.currentWattage = 0;
  miningRigState.maxWattage = 250;
  miningRigState.networkEfficiency = 1.0;
  miningRigState.totalRealEstateBonus = 1.0;
  miningRigState.realEstate = {
    parentsBasement: false,
    studioApartment: false,
    suburbanHouse: false,
    downtownLoft: false,
    techMansion: false,
    corporateOffice: false,
    dataFortress: false
  };
  miningRigState.unlocked = {
    calculator: true,
    smartDoorbells: false,
    macbooks: false,
    cellphone: false,
    kitchenAppliance: false,
    smartFridge: false,
    gpuRig: false,
    aiChatGPU: false,
    serverRack: false
  };
  clearActiveBuff();
  scheduleNextSurge();
  updateMiningRigCoinsPerSecond();
  saveMiningRigState();
  showPrestigeTree.value = true;
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
  
  // Persist on tab hide/close without spamming every second
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveMiningRigState();
    }
  });
  window.addEventListener('beforeunload', () => {
    saveMiningRigState();
  });

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
      @open-real-estate="showRealEstate = true"
      @update-game-state="updateMiningRigCoinsPerSecond"
      @reset-game="resetMiningRigGame"
      @reboot="showRebootConfirm = true"
    />

    <!-- Real Estate Modal -->
    <RealEstateModal
      v-if="showRealEstate"
      :show="showRealEstate"
      :game-state="miningRigState"
      @close="showRealEstate = false"
      @purchased="updateMiningRigCoinsPerSecond"
    />
    <PrestigeTree v-if="showPrestigeTree" :show="showPrestigeTree" :game-state="miningRigState" @close="showPrestigeTree = false" />
    <RebootConfirm v-if="showRebootConfirm" :show="showRebootConfirm" :game-state="miningRigState" @close="showRebootConfirm = false" @confirm="showRebootConfirm=false; rebootPrestige();" />
    
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
    
    <button v-if="miningRigState.nextSurgeMs && currentTimeMs > miningRigState.nextSurgeMs" class="surge-clicker" @click="triggerSurge">⚡ Market Surge</button>

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

/* Phase 4: Market Surge clickable */
.surge-clicker {
  position: fixed;
  right: 24px;
  bottom: 24px;
  background: var(--keyword);
  color: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  z-index: 12000;
  box-shadow: 0 8px 20px rgba(0,0,0,0.35);
}
.surge-clicker:hover { background: #6d28d9; }

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