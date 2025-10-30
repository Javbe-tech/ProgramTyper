<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  gameState: Object
});

const emit = defineEmits(['close', 'update-game-state', 'reset-game', 'reboot']);

// Use props gameState directly
const gameState = props.gameState;

// Real estate display (matches keys/order in RealEstateModal)
const realEstateCatalog = [
  { key: 'parentsBasement', name: '123 Main Street', image: '/home1.png' },
  { key: 'studioApartment', name: 'Apt 7B, Urban Solitude Tower', image: '/home2.png' },
  { key: 'suburbanHouse', name: '456 Suburban Dream Lane', image: '/home3.png' },
  { key: 'downtownLoft', name: 'Penthouse Loft, The Zenith', image: '/home4.png' },
  { key: 'techMansion', name: 'The "Alpha Nerd" Estate', image: '/home5.png' },
  { key: 'corporateOffice', name: 'The "Soul Crusher" Tower', image: '/home6.png' },
  { key: 'dataFortress', name: 'The "Omni-Vault"', image: '/home7.png' }
];

const currentEstate = computed(() => {
  const estateFlags = gameState.realEstate || {};
  // Find highest owned property in order
  for (let i = realEstateCatalog.length - 1; i >= 0; i--) {
    const e = realEstateCatalog[i];
    if (estateFlags[e.key]) return e;
  }
  // If none owned, show the first as target with dim overlay
  return null;
});

// Phase 2: Per-hardware tiered upgrades (14 thresholds for T2–T9)
const tierThresholds = [1,5,25,50,100,150,200,250,300,350,400,450,500,550];
function getTierUnlocked(hardwareType) {
  if (hardwareType === 'calculator') return 0; // handled by calculator engine
  const owned = gameState.hardware[hardwareType] || 0;
  let unlocked = 0;
  for (const t of tierThresholds) if (owned >= t) unlocked++;
  return unlocked;
}
function getTierTooltip(hardwareType) {
  if (hardwareType === 'calculator') return 'Calculator uses its own scaling engine.';
  const owned = gameState.hardware[hardwareType] || 0;
  return tierThresholds.map(t => `${owned >= t ? '✓' : '○'} ${t}` ).join('  ');
}

function getNextTierThreshold(hardwareType) {
  const owned = gameState.hardware[hardwareType] || 0;
  for (const t of tierThresholds) {
    if (owned < t) return t;
  }
  return 'Max';
}

// Hardware definitions with image paths - ordered by progression
const hardwareDefinitions = {
  calculator: {
    name: 'Calculator Mining Rig',
    image: '/images/Calculator Mining Rig.png',
    baseCost: 10,
    coinsPerSecond: 0.05,
    wattage: 1,
    unlockRequirement: null
  },
  smartDoorbells: {
    name: 'Network of Smart Doorbells',
    image: '/images/Doorbells.png',
    baseCost: 50,
    coinsPerSecond: 0.3,
    wattage: 3,
    unlockRequirement: { hardware: 'calculator', quantity: 8 }
  },
  macbooks: {
    name: '3 Solar powered MacBooks',
    image: '/images/3 Solar powered MacBooks.png',
    baseCost: 200,
    coinsPerSecond: 1.2,
    wattage: 7,
    unlockRequirement: { hardware: 'smartDoorbells', quantity: 10 }
  },
  cellphone: {
    name: 'Cellphone Mining Rig',
    image: '/images/Phones.png',
    baseCost: 500,
    coinsPerSecond: 2.5,
    wattage: 12,
    unlockRequirement: { hardware: 'macbooks', quantity: 8 }
  },
  kitchenAppliance: {
    name: 'A Toaster, Coffee Maker, Microwave and 2009 "smart" Plasma TV assisted with Solar Panel',
    image: '/images/A Toaster, Coffee Maker, Microwave and 2009 smart Plasma TV assisted with Solar Panel.png',
    baseCost: 1500,
    coinsPerSecond: 8,
    wattage: 28,
    unlockRequirement: { hardware: 'cellphone', quantity: 12 }
  },
  smartFridge: {
    name: 'Smart Fridge Miner',
    image: '/images/Fridge.png',
    baseCost: 5000,
    coinsPerSecond: 25,
    wattage: 65,
    unlockRequirement: { hardware: 'kitchenAppliance', quantity: 10 }
  },
  gpuRig: {
    name: 'Custom GPU Rig',
    image: '/images/Gpus.png',
    baseCost: 20000,
    coinsPerSecond: 100,
    wattage: 160,
    unlockRequirement: { hardware: 'smartFridge', quantity: 8 }
  },
  aiChatGPU: {
    name: 'AI Slop Custom ChatGPU',
    image: '/images/AI Slop Custom ChatGPU.png',
    baseCost: 100000,
    coinsPerSecond: 500,
    wattage: 500,
    unlockRequirement: { hardware: 'gpuRig', quantity: 6 }
  },
  serverRack: {
    name: 'GPU Server Rack',
    image: '/images/SeverRig.png',
    baseCost: 500000,
    coinsPerSecond: 2500,
    wattage: 2000,
    unlockRequirement: { hardware: 'aiChatGPU', quantity: 5 }
  }
};

// Upgrades definitions (rebalanced)
const upgradesDefinitions = {
  wordEfficiency: {
    name: 'Word Efficiency',
    description: '+0.5 coins per correct key per level',
    baseCost: 250,
    costGrowth: 1.20,
    maxLevel: 100
  },
  ergonomicKeyboard: {
    name: 'Ergonomic Keyboard',
    description: 'Typing multiplier',
    baseCost: 200,
    costGrowth: 1.22,
    maxLevel: 100
  },
  softwarePatch: {
    name: 'Software Patch',
    description: 'Global income boost (stacking, 120 patches)',
    baseCost: 1000,
    costGrowth: 1.25,
    maxLevel: 120
  },
  networkSecurity: {
    name: 'Network Security',
    description: 'Meta-scaling: stronger with reputation (15 tiers)',
    baseCost: 5000,
    costGrowth: 1.5,
    maxLevel: 15
  },
  networkBandwidth: {
    name: 'Network Bandwidth',
    description: 'Typing income increases with passive income (10 tiers)',
    baseCost: 5000,
    costGrowth: 1.4,
    maxLevel: 10
  }
};

// Geometric progression formula: Price = Base Cost * 1.15^M
function calculateHardwareCost(hardwareType) {
  const definition = hardwareDefinitions[hardwareType];
  const owned = gameState.hardware[hardwareType];
  return Math.floor(definition.baseCost * Math.pow(1.15, owned));
}

// Cost of the most recently purchased unit (for selling)
function currentUnitCost(hardwareType) {
  const definition = hardwareDefinitions[hardwareType];
  const owned = gameState.hardware[hardwareType];
  if (owned <= 0) return 0;
  return Math.floor(definition.baseCost * Math.pow(1.15, owned - 1));
}

function calculateSellPrice(hardwareType) {
  return Math.floor(currentUnitCost(hardwareType) * 0.5);
}

// Calculate upgrade cost with new growth
function calculateUpgradeCost(upgradeType) {
  const definition = upgradesDefinitions[upgradeType];
  const currentLevel = getUpgradeLevel(upgradeType);
  return Math.floor(definition.baseCost * Math.pow(definition.costGrowth, Math.max(0, currentLevel - 0)));
}

// Get current upgrade level
function getUpgradeLevel(upgradeType) {
  if (upgradeType === 'wordEfficiency') return gameState.upgrades.wordEfficiencyLevel || 0;
  if (upgradeType === 'ergonomicKeyboard') return gameState.upgrades.ergonomicKeyboardLevel || 0;
  if (upgradeType === 'softwarePatch') return gameState.upgrades.softwarePatchLevel || 0;
  if (upgradeType === 'networkSecurity') return gameState.upgrades.networkSecurityLevel || 0;
  if (upgradeType === 'networkBandwidth') return gameState.upgrades.networkBandwidthLevel || 0;
  return 0;
}

function getUpgradeDescription(upgradeType) {
  if (upgradeType === 'ergonomicKeyboard') {
    const level = gameState.upgrades.ergonomicKeyboardLevel || 0;
    const bonusPct = Math.max(0, (Math.pow(1.07, Math.min(100, level)) - 1) * 100);
    return `Typing multiplier bonus: +${bonusPct.toFixed(0)}%`;
  }
  if (upgradeType === 'wordEfficiency') {
    const level = gameState.upgrades.wordEfficiencyLevel || 0;
    const bonus = (0.5 * level).toFixed(1);
    return `Adds +${bonus} coins per correct key`;
  }
  if (upgradeType === 'passiveBoost') {
    return '';
  }
  if (upgradeType === 'softwarePatch') {
    const l = gameState.upgrades.softwarePatchLevel || 0;
    const seg1 = Math.min(l,40), seg2 = Math.min(Math.max(l-40,0),40), seg3 = Math.min(Math.max(l-80,0),40);
    const mult = (Math.pow(1.01,seg1)*Math.pow(1.02,seg2)*Math.pow(1.03,seg3)).toFixed(2);
    return `Software Patches boost ALL income. Your current patches give ×${mult} to both passive and typing income.`;
  }
  if (upgradeType === 'networkBandwidth') {
    const l = gameState.upgrades.networkBandwidthLevel || 0;
    const unlockedPct = ((l / 10) * 100).toFixed(0);
    const potential = 1 + ((gameState.coinsPerSecond || 0) / 1_000_000);
    const effective = 1 + ((gameState.coinsPerSecond || 0) / 1_000_000) * (l / 10);
    return `Network Bandwidth boosts TYPING based on your passive income. Potential typing boost = 1 + (Passive cps / 1,000,000). You currently unlock ${unlockedPct}% of that: ×${effective.toFixed(3)}.`;
  }
  if (upgradeType === 'networkSecurity') {
    const l = gameState.upgrades.networkSecurityLevel || 0;
    const reputation = gameState.reputation || 0;
    const nsCoeffs = [0.10,0.125,0.15,0.175,0.20,0.225,0.25,0.275,0.30,0.325,0.35,0.375,0.40,0.425,0.45];
    let bonus = 1.0;
    for (let i = 0; i < Math.min(l, nsCoeffs.length); i++) {
      bonus *= (1 + nsCoeffs[i] * reputation);
    }
    const nextCoeff = nsCoeffs[Math.min(l, nsCoeffs.length - 1)];
    return `Network Security increases ALL income using your Reputation (earned from achievements, coming soon). Current bonus: ×${bonus.toFixed(3)} at reputation ${reputation}. Next level adds another ×(1 + ${nextCoeff} × reputation).`;
  }
  return upgradesDefinitions[upgradeType]?.description || '';
}

// Check if upgrade can be purchased (not at max level)
function canPurchaseUpgrade(upgradeType) {
  const definition = upgradesDefinitions[upgradeType];
  const currentLevel = getUpgradeLevel(upgradeType);
  return currentLevel < definition.maxLevel;
}

// Computed property for hardware unlocking (sticky once unlocked)
const unlockedHardware = computed(() => {
  const result = {};
  for (const hardwareType of Object.keys(hardwareDefinitions)) {
    const definition = hardwareDefinitions[hardwareType];
    const previously = (gameState.unlocked && gameState.unlocked[hardwareType]) || false;
    if (!definition.unlockRequirement) {
      result[hardwareType] = true;
      if (gameState.unlocked) gameState.unlocked[hardwareType] = true;
      continue;
    }
    const req = definition.unlockRequirement;
    const ownedQuantity = gameState.hardware[req.hardware] || 0;
    const nowUnlocked = ownedQuantity >= req.quantity;
    const sticky = previously || nowUnlocked;
    result[hardwareType] = sticky;
    if (sticky) {
      if (!gameState.unlocked) gameState.unlocked = {};
      gameState.unlocked[hardwareType] = true;
    }
  }
  return result;
});

// Purchase hardware
function purchaseHardware(hardwareType) {
  const cost = calculateHardwareCost(hardwareType);
  // Check power capacity if wattage is defined
  const def = hardwareDefinitions[hardwareType];
  const watt = def.wattage || 0;
  if (gameState.currentColdCoins < cost) return;
  gameState.currentColdCoins -= cost;
  gameState.hardware[hardwareType]++;
  gameState.currentWattage += watt;
  emit('update-game-state');
}

// Sell hardware: refund ~50% of the last unit's cost and free wattage
function sellHardware(hardwareType) {
  const owned = gameState.hardware[hardwareType];
  if (!owned || owned <= 0) return;
  const def = hardwareDefinitions[hardwareType];
  const watt = def.wattage || 0;
  const refund = calculateSellPrice(hardwareType);
  gameState.hardware[hardwareType]--;
  gameState.currentWattage = Math.max(0, gameState.currentWattage - watt);
  gameState.currentColdCoins += refund;
  emit('update-game-state');
}

// Purchase upgrade
function purchaseUpgrade(upgradeType) {
  if (!canPurchaseUpgrade(upgradeType)) {
    console.log(`Upgrade ${upgradeType} is at max level`);
    return;
  }
  
  const cost = calculateUpgradeCost(upgradeType);
  
  if (gameState.currentColdCoins < cost) return;
  gameState.currentColdCoins -= cost;
  if (upgradeType === 'wordEfficiency') {
    gameState.upgrades.wordEfficiencyLevel = (gameState.upgrades.wordEfficiencyLevel || 0) + 1;
  } else if (upgradeType === 'ergonomicKeyboard') {
    gameState.upgrades.ergonomicKeyboardLevel = (gameState.upgrades.ergonomicKeyboardLevel || 0) + 1;
  } else if (upgradeType === 'softwarePatch') {
    gameState.upgrades.softwarePatchLevel = Math.min(120, (gameState.upgrades.softwarePatchLevel || 0) + 1);
  } else if (upgradeType === 'networkSecurity') {
    gameState.upgrades.networkSecurityLevel = Math.min(15, (gameState.upgrades.networkSecurityLevel || 0) + 1);
  } else if (upgradeType === 'networkBandwidth') {
    gameState.upgrades.networkBandwidthLevel = Math.min(10, (gameState.upgrades.networkBandwidthLevel || 0) + 1);
  }
  emit('update-game-state');
}

// Computed properties for UI
const totalCoinsPerSecond = computed(() => {
  return gameState.coinsPerSecond;
});

const totalCoinsPerWord = computed(() => {
  const level = gameState.upgrades.wordEfficiencyLevel || 0;
  const base = gameState.coinsPerWord + 0.5 * level;
  const kbLevel = Math.min(100, gameState.upgrades.ergonomicKeyboardLevel || 0);
  const typingMultiplier = Math.pow(1.07, kbLevel);
  return (base * typingMultiplier).toFixed(2);
});

// Filter hardware that should be shown in collection (unlocked and owned > 0)
const visibleHardware = computed(() => {
  return Object.keys(hardwareDefinitions).filter(key => {
    return unlockedHardware.value[key] && (gameState.hardware[key] || 0) > 0;
  });
});

// Explain calculator engine bonus per unit for UI
function getCalculatorBonusPerUnitLocal() {
  const counts = gameState.hardware || {};
  const calcOwned = counts.calculator || 0;
  const nonCalcOwned = Object.entries(counts).filter(([k]) => k !== 'calculator').reduce((s,[,v])=>s+(v||0),0);
  let bonus = 0.1 * nonCalcOwned;
  if (calcOwned >= 50) bonus *= 5;
  if (calcOwned >= 100) bonus *= 10;
  if (calcOwned >= 150) bonus *= 20;
  if (calcOwned >= 200) bonus *= 20;
  if (calcOwned >= 300) bonus *= 20;
  if (calcOwned >= 400) bonus *= 20;
  return bonus;
}

// Calculate income per hardware type
function getHardwareIncome(hardwareType) {
  const definition = hardwareDefinitions[hardwareType];
  const owned = gameState.hardware[hardwareType];
  const passiveMultiplier = Math.pow(1.25, gameState.upgrades.passiveBoostLevel || 0);
  return owned * definition.coinsPerSecond * passiveMultiplier;
}

function getHardwareWattage(hardwareType) {
  const definition = hardwareDefinitions[hardwareType];
  const owned = gameState.hardware[hardwareType];
  return owned * (definition.wattage || 0);
}

// Generate collection images for each hardware type
function getCollectionImages(hardwareType) {
  const owned = gameState.hardware[hardwareType];
  const images = [];
  const definition = hardwareDefinitions[hardwareType];
  
  // One image per owned unit (1:1 mapping)
  const count = Math.max(0, Math.floor(owned));
  for (let i = 0; i < count; i++) {
    images.push({
      id: i,
      src: definition.image,
      position: i % 2 === 0 ? 'low' : 'high' // Alternate between low and high positions
    });
  }
  
  return images;
}

// Close modal
function closeModal() {
  emit('close');
}

// Reset game
function resetGame() {
  if (confirm('Are you sure you want to reset your Mining Rig progress? This cannot be undone!')) {
    emit('reset-game');
    closeModal();
  }
}
</script>

<template>
  <div class="mining-rig-overlay" @click="closeModal">
    <div class="mining-rig-modal" @click.stop>
      <!-- Header -->
      <div class="mining-header">
        <div class="header-left">
          <h2>⚡ Mining Rig ⚡</h2>
          <!-- Live Stats -->
          <div class="header-stats">
            <div class="stat-item">
              <span class="stat-label">ColdCoins:</span>
              <span class="stat-value">{{ Math.floor(gameState.currentColdCoins).toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Income:</span>
              <span class="stat-value">{{ totalCoinsPerSecond.toFixed(1) }}/sec</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Per Word:</span>
              <span class="stat-value">{{ totalCoinsPerWord }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Power Usage:</span>
              <span class="stat-value">{{ gameState.currentWattage }}/{{ gameState.maxWattage }}W</span>
            </div>
            <div class="stat-item" :title="gameState.networkEfficiency < 1 ? 'Over capacity: income reduced' : 'At peak efficiency'">
              <span class="stat-label">Efficiency:</span>
              <span class="stat-value" :style="{ color: gameState.networkEfficiency < 1 ? '#ff4444' : 'var(--keyword)' }">{{ Math.round((gameState.networkEfficiency || 1)*100) }}%</span>
            </div>
          </div>
        </div>
        <div class="header-buttons">
          <button @click="$emit('open-real-estate')" class="reset-btn" title="Real Estate">🏠 Real Estate</button>
          <button @click="$emit('reboot')" class="reset-btn" title="Reboot (Prestige)">🌀 Reboot</button>
          
          <button @click="closeModal" class="close-btn">×</button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="mining-content">
        <!-- Left Sidebar - Hardware Catalog -->
        <div class="catalog-sidebar">
          <div class="catalog-section">
            <h3>🛒 Hardware Catalog</h3>
            <div class="catalog-grid">
              <div 
                v-for="(hardware, key) in hardwareDefinitions" 
                :key="key"
                class="catalog-item"
                :class="{ 
                  'unlocked': unlockedHardware[key],
                  'affordable': unlockedHardware[key] && gameState.currentColdCoins >= calculateHardwareCost(key)
                }"
                @click="unlockedHardware[key] ? purchaseHardware(key) : null"
              >
                <div class="catalog-image">
                  <img 
                    :src="hardware.image" 
                    :alt="hardware.name"
                    :class="{ 'outlined': !unlockedHardware[key] }"
                  />
                </div>
                <div class="catalog-info">
                  <h4 v-if="unlockedHardware[key]">{{ hardware.name }}</h4>
                  <h4 v-else class="locked-name">???</h4>
                  <div class="catalog-stats" v-if="unlockedHardware[key]">
                    <p class="owned-count">Owned: {{ gameState.hardware[key] }}</p>
                    <p class="earnings">Per Unit: {{ (hardware.coinsPerSecond * Math.pow(1.25, gameState.upgrades.passiveBoostLevel || 0)).toFixed(2) }} 💰/sec</p>
                    <p class="wattage">Wattage: {{ hardware.wattage || 0 }}W</p>
                  </div>
                  <p v-if="unlockedHardware[key]" class="catalog-cost">
                    {{ calculateHardwareCost(key).toLocaleString() }} 💰
                  </p>
                  <div v-if="unlockedHardware[key] && gameState.hardware[key] > 0" class="catalog-sell">
                    <button class="sell-btn" @click.stop="sellHardware(key)">
                      Sell ({{ calculateSellPrice(key).toLocaleString() }} 💰)
                    </button>
                  </div>
                  <p v-else class="catalog-locked">Locked</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center - Collection Display -->
        <div class="collection-display">
          <!-- Hardware Collection Rows -->
          <div class="collection-rows">
            <div 
              v-for="key in visibleHardware" 
              :key="key"
              class="collection-row"
            >
              <div class="row-header">
                <h3>{{ hardwareDefinitions[key].name }}</h3>
                <div class="row-stats">
                  <div class="row-income">
                    {{ getHardwareIncome(key).toFixed(1) }} 💰/sec
                  </div>
                  <div class="row-wattage">
                    {{ getHardwareWattage(key) }}W
                  </div>
                  <div 
                    v-if="key !== 'calculator'" 
                    class="row-tiers tier-hover"
                  >
                    Upgrades: {{ getTierUnlocked(key) }}/14
                    <div class="tiers-tooltip">
                      <div class="tooltip-title">Tiered Upgrades</div>
                      <div class="tooltip-line">Each unlocked tier DOUBLES this hardware's income.</div>
                      <div class="tooltip-line">Unlocked: {{ getTierUnlocked(key) }} / 14</div>
                      <div class="tooltip-line">Thresholds: {{ getTierTooltip(key) }}</div>
                      <div class="tooltip-line">Next tier at: {{ getNextTierThreshold(key) }} owned</div>
                    </div>
                  </div>
                  <div v-else class="row-tiers tier-hover">
                    Bonus +{{ getCalculatorBonusPerUnitLocal().toFixed(2) }}/unit
                    <div class="tiers-tooltip">
                      <div class="tooltip-title">Calculator Bonus</div>
                      <div class="tooltip-line">Each Calculator earns 0.05 base coins/sec.</div>
                      <div class="tooltip-line">Plus +0.1 coins/sec for every non-Calculator device you own.</div>
                      <div class="tooltip-line">Milestones at 50/100/150/200/300/400 Calculators greatly boost this bonus.</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="collection-images">
                <div 
                  v-for="image in getCollectionImages(key)" 
                  :key="image.id"
                  class="collection-image"
                  :class="image.position"
                >
                  <img :src="image.src" :alt="hardwareDefinitions[key].name" @click.stop="sellHardware(key)" />
                  <div class="image-tooltip">
                    <div class="tooltip-title">{{ hardwareDefinitions[key].name }}</div>
                    <button class="tooltip-sell" @click.stop="sellHardware(key)">
                      Sell 1 ({{ calculateSellPrice(key).toLocaleString() }} 💰)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar - Upgrade Store -->
        <div class="upgrade-sidebar">
          <div class="upgrade-section">
            <h3>🔧 Upgrade Store</h3>
            <div class="upgrade-items scrollable">
              <div 
                v-for="(upgrade, key) in upgradesDefinitions" 
                :key="key"
                class="upgrade-item"
                :class="{ 
                  'affordable': canPurchaseUpgrade(key) && gameState.currentColdCoins >= calculateUpgradeCost(key)
                }"
                @click="canPurchaseUpgrade(key) ? purchaseUpgrade(key) : null"
              >
                <div class="upgrade-info">
                  <h4>{{ upgrade.name }}</h4>
                  <p>{{ getUpgradeDescription(key) }}</p>
                  <p class="upgrade-level">Level: {{ getUpgradeLevel(key) }}/{{ upgrade.maxLevel }}</p>
                  <p class="upgrade-cost">
                    {{ canPurchaseUpgrade(key) ? calculateUpgradeCost(key).toLocaleString() + ' 💰' : 'Max Level' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <!-- Current property display (fixed area below upgrades) -->
          <div class="estate-panel" v-if="currentEstate">
            <div class="estate-thumb">
              <img :src="currentEstate.image" :alt="currentEstate.name" />
            </div>
            <div class="estate-meta">
              <div class="estate-label">Current Property</div>
              <div class="estate-name">{{ currentEstate.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mining-rig-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.mining-rig-modal {
  background: var(--bg-color);
  border: 3px solid var(--keyword);
  border-radius: 15px;
  padding: 0;
  width: 95%;
  height: 90%;
  max-width: 1400px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.4s ease-out;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mining-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 3px solid var(--border-color);
  background: linear-gradient(135deg, var(--sidebar-bg), var(--active-line-bg));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.header-stats {
  display: flex;
  gap: 30px;
  align-items: center;
  justify-content: center;
}

.mining-header h2 {
  color: var(--font-color);
  margin: 0;
  font-size: 1.6rem;
  text-shadow: 0 0 10px var(--keyword);
}

.header-buttons {
  display: flex;
  gap: 15px;
  align-items: center;
}

.reset-btn {
  background: #ff4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #cc0000;
  transform: translateY(-2px);
}

.close-btn {
  background: none;
  border: none;
  color: var(--font-color);
  font-size: 2.5rem;
  cursor: pointer;
  padding: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--active-line-bg);
  transform: scale(1.1);
}

.mining-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left Sidebar - Hardware Catalog */
.catalog-sidebar {
  width: 400px;
  background: var(--sidebar-bg);
  border-right: 3px solid var(--border-color);
  padding: 20px;
  overflow-y: auto;
}

.catalog-section {
  margin-bottom: 30px;
}

.catalog-section h3 {
  color: var(--font-color);
  margin-bottom: 15px;
  font-size: 1.2rem;
  text-align: center;
  padding: 10px;
  background: var(--active-line-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.catalog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.catalog-item {
  padding: 15px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.catalog-item:hover {
  border-color: var(--keyword);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.catalog-item.affordable {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.catalog-item.unlocked {
  border-color: var(--keyword);
}

.catalog-image {
  text-align: center;
  margin-bottom: 10px;
}

.catalog-image img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  transition: all 0.3s ease;
}

.catalog-image img.outlined {
  filter: grayscale(100%) brightness(0.3);
  opacity: 0.5;
}

.catalog-info h4 {
  color: var(--font-color);
  margin: 0 0 8px 0;
  font-size: 1rem;
  text-align: center;
}

.catalog-stats {
  margin: 8px 0;
}

.catalog-stats p {
  color: var(--gray);
  margin: 2px 0;
  font-size: 0.8rem;
  text-align: center;
}

.owned-count {
  color: var(--keyword) !important;
  font-weight: bold;
}

.earnings {
  color: #22c55e !important;
  font-weight: bold;
}
.wattage {
  color: var(--font-color);
  opacity: 0.85;
}
.catalog-sell { margin-top: 8px; }
.sell-btn {
  background: transparent;
  color: #f97316; /* orange for sell */
  border: 1px solid #f97316;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.sell-btn:hover {
  background: rgba(249, 115, 22, 0.12);
}

.catalog-info p {
  color: var(--gray);
  margin: 4px 0;
  font-size: 0.9rem;
  text-align: center;
}

.catalog-cost {
  color: var(--keyword) !important;
  font-weight: bold;
  font-size: 0.9rem;
}

.catalog-locked {
  color: #ff4444 !important;
  font-weight: bold;
}

.locked-name {
  color: #666 !important;
  font-weight: bold;
  font-style: italic;
  opacity: 0.7;
}

/* Center - Collection Display */
.collection-display {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
  z-index: 2;
}

/* Right Sidebar - Upgrade Store */
.upgrade-sidebar {
  width: 280px;
  background: var(--sidebar-bg);
  border-left: 3px solid var(--border-color);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.upgrade-section {
  margin-bottom: 30px;
}

.upgrade-section h3 {
  color: var(--font-color);
  margin-bottom: 15px;
  font-size: 1.2rem;
  text-align: center;
  padding: 10px;
  background: var(--active-line-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.upgrade-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.upgrade-items.scrollable { flex: 1; min-height: 0; max-height: 60vh; overflow-y: auto; }

.upgrade-item {
  padding: 20px;
  background: var(--bg-color);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.upgrade-item:hover {
  border-color: var(--keyword);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.upgrade-item.affordable {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

/* Estate panel */
.estate-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px;
}
.estate-thumb img {
  width: 90px;
  height: 90px;
  object-fit: contain;
  border-radius: 6px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
}
.estate-meta .estate-label { color: var(--gray); font-size: 0.75rem; }
.estate-meta .estate-name { color: var(--font-color); font-size: 0.95rem; font-weight: 600; }

.upgrade-info h4 {
  color: var(--font-color);
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  text-align: center;
}

.upgrade-info p {
  color: var(--gray);
  margin: 4px 0;
  font-size: 0.9rem;
  text-align: center;
}

.upgrade-cost {
  color: var(--keyword) !important;
  font-weight: bold;
  font-size: 1rem;
}

.upgrade-level {
  color: var(--gray);
  font-size: 0.8rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.header-stats .stat-item {
  flex: none;
  min-width: 120px;
}

.stat-label {
  color: var(--gray);
  font-size: 0.8rem;
  margin-bottom: 3px;
}

.header-stats .stat-label {
  font-size: 0.7rem;
}

.stat-value {
  color: var(--keyword);
  font-size: 1.4rem;
  font-weight: bold;
  text-shadow: 0 0 5px var(--keyword);
}

.header-stats .stat-value {
  font-size: 1.1rem;
}

.collection-rows {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.collection-row {
  background: var(--sidebar-bg);
  border: 2px solid var(--border-color);
  border-radius: 15px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border-color);
}

.row-header h3 {
  color: var(--font-color);
  margin: 0;
  font-size: 1.3rem;
}

.row-stats {
  display: flex;
  gap: 15px;
  align-items: center;
}

.row-income {
  color: var(--keyword);
  font-size: 1.1rem;
  font-weight: bold;
  background: var(--bg-color);
  padding: 8px 15px;
  border-radius: 20px;
  border: 1px solid var(--keyword);
}

.row-wattage {
  color: var(--parameter);
  font-size: 1rem;
  font-weight: bold;
  background: var(--bg-color);
  padding: 8px 15px;
  border-radius: 20px;
  border: 1px solid var(--parameter);
}

.row-tiers {
  color: var(--font-color);
  font-size: 0.9rem;
  font-weight: bold;
  background: var(--bg-color);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  cursor: help;
}
.tier-hover { position: relative; }
.tiers-tooltip {
  position: absolute;
  top: 0;
  right: 110%;
  left: auto;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 10px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 10020;
  min-width: 260px;
}
.tier-hover:hover .tiers-tooltip { opacity: 1; pointer-events: auto; }
.tiers-tooltip .tooltip-title { color: var(--font-color); font-size: 0.9rem; font-weight: 700; margin-bottom: 6px; }
.tiers-tooltip .tooltip-line { color: var(--gray); font-size: 0.85rem; margin: 2px 0; }

.collection-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 80px;
  align-items: flex-end;
}

.collection-image {
  position: relative;
  transition: all 0.3s ease;
}

.collection-image img {
  width: 70px;
  height: 70px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.6));
}

/* Hover tooltip to sell one unit */
.image-tooltip {
  position: absolute;
  bottom: 80px;
  left: 0;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px 8px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  z-index: 10020;
  min-width: 180px;
}
.collection-image:hover .image-tooltip {
  opacity: 1;
  pointer-events: auto;
}
.tooltip-title {
  color: var(--font-color);
  font-size: 0.8rem;
  margin-bottom: 6px;
}
.tooltip-sell {
  background: transparent;
  color: #f97316;
  border: 1px solid #f97316;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.8rem;
}
.tooltip-sell:hover { background: rgba(249, 115, 22, 0.12); }

.collection-image.low {
  transform: translateY(20px);
}

.collection-image.high {
  transform: translateY(0px);
}

.collection-image:nth-child(even) {
  margin-left: -15px;
}

.collection-image:nth-child(odd) {
  margin-left: 0px;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Theme-specific overrides */
[data-theme="matrix"] .mining-rig-modal {
  border-color: #00ff00;
  box-shadow: 0 25px 50px rgba(0, 255, 0, 0.3);
}

[data-theme="matrix"] .stat-value,
[data-theme="matrix"] .row-income {
  color: #00ff00;
  text-shadow: 0 0 10px #00ff00;
}

[data-theme="matrix"] .catalog-cost,
[data-theme="matrix"] .upgrade-cost {
  color: #00ff00 !important;
}

[data-theme="matrix"] .catalog-item.affordable,
[data-theme="matrix"] .upgrade-item.affordable {
  border-color: #00ff00;
  background: rgba(0, 255, 0, 0.1);
}

[data-theme="black-red"] .mining-rig-modal {
  border-color: #ff2d2d;
  box-shadow: 0 25px 50px rgba(255, 45, 45, 0.3);
}

[data-theme="black-red"] .stat-value,
[data-theme="black-red"] .row-income {
  color: #ff2d2d;
  text-shadow: 0 0 10px #ff2d2d;
}

[data-theme="black-red"] .catalog-cost,
[data-theme="black-red"] .upgrade-cost {
  color: #ff2d2d !important;
}

[data-theme="black-red"] .catalog-item.affordable,
[data-theme="black-red"] .upgrade-item.affordable {
  border-color: #ff2d2d;
  background: rgba(255, 45, 45, 0.1);
}

[data-theme="cyberpunk"] .mining-rig-modal {
  border-color: #ff2bd6;
  box-shadow: 0 25px 50px rgba(255, 43, 214, 0.3);
}

[data-theme="cyberpunk"] .stat-value,
[data-theme="cyberpunk"] .row-income {
  color: #ff2bd6;
  text-shadow: 0 0 10px #ff2bd6;
}

[data-theme="cyberpunk"] .catalog-cost,
[data-theme="cyberpunk"] .upgrade-cost {
  color: #ff2bd6 !important;
}

[data-theme="cyberpunk"] .catalog-item.affordable,
[data-theme="cyberpunk"] .upgrade-item.affordable {
  border-color: #ff2bd6;
  background: rgba(255, 43, 214, 0.1);
}
</style>