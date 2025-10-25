<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  gameState: Object
});

const emit = defineEmits(['close', 'update-game-state']);

// Use props gameState directly
const gameState = props.gameState;

// Hardware definitions with base costs
const hardwareDefinitions = {
  cellphone: {
    name: 'Cellphone',
    icon: '📱',
    baseCost: 15,
    coinsPerSecond: 0.1,
    unlockRequirement: null
  },
  smartFridge: {
    name: 'Smart Fridge',
    icon: '🧊',
    baseCost: 100,
    coinsPerSecond: 1,
    unlockRequirement: { hardware: 'cellphone', quantity: 10 }
  },
  smartDoorbells: {
    name: 'Network of Smart Doorbells',
    icon: '🚪',
    baseCost: 1000,
    coinsPerSecond: 10,
    unlockRequirement: { hardware: 'smartFridge', quantity: 15 }
  },
  gpuRig: {
    name: 'Custom GPU Rig',
    icon: '🖥️',
    baseCost: 10000,
    coinsPerSecond: 100,
    unlockRequirement: { hardware: 'smartDoorbells', quantity: 12 }
  },
  serverRack: {
    name: 'Server Rack',
    icon: '🗄️',
    baseCost: 100000,
    coinsPerSecond: 1000,
    unlockRequirement: { hardware: 'gpuRig', quantity: 10 }
  }
};

// Upgrades definitions
const upgradesDefinitions = {
  wordMultiplier: {
    name: 'Word Efficiency',
    description: 'Double coins per word',
    baseCost: 1000,
    multiplier: 2,
    maxLevel: 5 // Limit to 5 levels
  },
  passiveMultiplier: {
    name: 'Passive Boost',
    description: 'Double passive income',
    baseCost: 5000,
    multiplier: 2,
    maxLevel: 3 // Limit to 3 levels
  }
};

// Geometric progression formula: Price = Base Cost * 1.15^M
function calculateHardwareCost(hardwareType) {
  const definition = hardwareDefinitions[hardwareType];
  const owned = gameState.hardware[hardwareType];
  return Math.floor(definition.baseCost * Math.pow(1.15, owned));
}

// Calculate upgrade cost with geometric progression
function calculateUpgradeCost(upgradeType) {
  const definition = upgradesDefinitions[upgradeType];
  const currentLevel = getUpgradeLevel(upgradeType);
  return Math.floor(definition.baseCost * Math.pow(2, currentLevel));
}

// Get current upgrade level
function getUpgradeLevel(upgradeType) {
  const baseMultiplier = upgradesDefinitions[upgradeType].multiplier;
  const currentMultiplier = gameState.upgrades[upgradeType];
  return Math.log2(currentMultiplier);
}

// Check if upgrade can be purchased (not at max level)
function canPurchaseUpgrade(upgradeType) {
  const definition = upgradesDefinitions[upgradeType];
  const currentLevel = getUpgradeLevel(upgradeType);
  return currentLevel < definition.maxLevel;
}

// Check if hardware is unlocked
function isHardwareUnlocked(hardwareType) {
  const definition = hardwareDefinitions[hardwareType];
  if (!definition.unlockRequirement) return true;
  
  const requiredHardware = definition.unlockRequirement.hardware;
  const requiredQuantity = definition.unlockRequirement.quantity;
  return gameState.hardware[requiredHardware] >= requiredQuantity;
}

// Purchase hardware
function purchaseHardware(hardwareType) {
  const cost = calculateHardwareCost(hardwareType);
  if (gameState.currentColdCoins >= cost) {
    gameState.currentColdCoins -= cost;
    gameState.hardware[hardwareType]++;
    emit('update-game-state');
  }
}

// Purchase upgrade
function purchaseUpgrade(upgradeType) {
  if (!canPurchaseUpgrade(upgradeType)) {
    console.log(`Upgrade ${upgradeType} is at max level`);
    return;
  }
  
  const cost = calculateUpgradeCost(upgradeType);
  
  if (gameState.currentColdCoins >= cost) {
    gameState.currentColdCoins -= cost;
    gameState.upgrades[upgradeType] *= upgradesDefinitions[upgradeType].multiplier;
    emit('update-game-state');
  }
}

// Computed properties for UI
const totalCoinsPerSecond = computed(() => {
  return gameState.coinsPerSecond;
});

const totalCoinsPerWord = computed(() => {
  return gameState.coinsPerWord * gameState.upgrades.wordMultiplier;
});

// Computed property for hardware unlocking
const unlockedHardware = computed(() => {
  const unlocked = {};
  for (const hardwareType of Object.keys(hardwareDefinitions)) {
    const definition = hardwareDefinitions[hardwareType];
    if (!definition.unlockRequirement) {
      unlocked[hardwareType] = true;
    } else {
      const requiredHardware = definition.unlockRequirement.hardware;
      const requiredQuantity = definition.unlockRequirement.quantity;
      unlocked[hardwareType] = gameState.hardware[requiredHardware] >= requiredQuantity;
    }
  }
  return unlocked;
});

// Close modal
function closeModal() {
  emit('close');
}
</script>

<template>
  <div class="mining-rig-overlay" @click="closeModal">
    <div class="mining-rig-modal" @click.stop>
      <!-- Header -->
      <div class="mining-header">
        <h2>⚡ Mining Rig ⚡</h2>
        <button @click="closeModal" class="close-btn">×</button>
      </div>

      <!-- Live Stats -->
      <div class="live-stats">
        <div class="stat-item">
          <span class="stat-label">ColdCoins:</span>
          <span class="stat-value">{{ Math.floor(gameState.currentColdCoins).toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Coins/Second:</span>
          <span class="stat-value">{{ totalCoinsPerSecond.toFixed(1) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Coins/Word:</span>
          <span class="stat-value">{{ totalCoinsPerWord }}</span>
        </div>
      </div>

      <!-- Upgrades Store -->
      <div class="upgrades-section">
        <h3>🔧 Upgrades Store</h3>
        <div class="upgrades-grid">
          <div 
            v-for="(upgrade, key) in upgradesDefinitions" 
            :key="key"
            class="upgrade-item"
          >
            <div class="upgrade-info">
              <h4>{{ upgrade.name }}</h4>
              <p>{{ upgrade.description }}</p>
              <p class="upgrade-level">Level: {{ getUpgradeLevel(key) }}/{{ upgrade.maxLevel }}</p>
              <p class="upgrade-cost">Cost: {{ calculateUpgradeCost(key).toLocaleString() }} ColdCoins</p>
            </div>
            <button 
              @click="purchaseUpgrade(key)"
              :disabled="!canPurchaseUpgrade(key) || gameState.currentColdCoins < calculateUpgradeCost(key)"
              class="purchase-btn"
            >
              {{ canPurchaseUpgrade(key) ? 'Buy' : 'Max Level' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Hardware Store -->
      <div class="hardware-section">
        <h3>🛒 Hardware Store</h3>
        <div class="hardware-grid">
          <div 
            v-for="(hardware, key) in hardwareDefinitions" 
            :key="key"
            v-show="unlockedHardware[key]"
            class="hardware-item"
          >
            <div class="hardware-info">
              <div class="hardware-icon">{{ hardware.icon }}</div>
              <div class="hardware-details">
                <h4>{{ hardware.name }}</h4>
                <p>Owned: {{ gameState.hardware[key] }}</p>
                <p>Produces: {{ hardware.coinsPerSecond }} coins/sec each</p>
                <p class="hardware-cost">Next: {{ calculateHardwareCost(key).toLocaleString() }} ColdCoins</p>
              </div>
            </div>
            <button 
              @click="purchaseHardware(key)"
              :disabled="gameState.currentColdCoins < calculateHardwareCost(key)"
              class="purchase-btn"
            >
              Buy
            </button>
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.mining-rig-modal {
  background: var(--bg-color);
  border: 2px solid var(--keyword);
  border-radius: 12px;
  padding: 20px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.4s ease-out;
}

.mining-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 10px;
}

.mining-header h2 {
  color: var(--font-color);
  margin: 0;
  font-size: 1.8rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--font-color);
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: var(--active-line-bg);
}

.live-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 15px;
  background: var(--sidebar-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-label {
  color: var(--gray);
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.stat-value {
  color: var(--keyword);
  font-size: 1.2rem;
  font-weight: bold;
}

.upgrades-section, .hardware-section {
  margin-bottom: 30px;
}

.upgrades-section h3, .hardware-section h3 {
  color: var(--font-color);
  margin-bottom: 15px;
  font-size: 1.3rem;
}

.upgrades-grid, .hardware-grid {
  display: grid;
  gap: 15px;
}

.upgrade-item, .hardware-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.upgrade-item:hover, .hardware-item:hover {
  background: var(--active-line-bg);
  border-color: var(--keyword);
}

.upgrade-info, .hardware-info {
  flex: 1;
}

.hardware-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.hardware-icon {
  font-size: 2rem;
  min-width: 60px;
  text-align: center;
}

.upgrade-info h4, .hardware-details h4 {
  color: var(--font-color);
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.upgrade-info p, .hardware-details p {
  color: var(--gray);
  margin: 2px 0;
  font-size: 0.9rem;
}

.upgrade-cost, .hardware-cost {
  color: var(--keyword) !important;
  font-weight: bold;
}

.upgrade-level {
  color: var(--gray);
  font-size: 0.8rem;
  margin: 2px 0;
}

.purchase-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  min-width: 80px;
}

.purchase-btn:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-1px);
}

.purchase-btn:disabled {
  background: var(--gray);
  cursor: not-allowed;
  opacity: 0.6;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Theme-specific overrides */
[data-theme="matrix"] .mining-rig-modal {
  border-color: #00ff00;
}

[data-theme="matrix"] .stat-value {
  color: #00ff00;
}

[data-theme="matrix"] .upgrade-cost,
[data-theme="matrix"] .hardware-cost {
  color: #00ff00 !important;
}

[data-theme="matrix"] .purchase-btn {
  background: #00ff00;
  color: #000000;
}

[data-theme="matrix"] .purchase-btn:hover:not(:disabled) {
  background: #00cc00;
}

[data-theme="black-red"] .mining-rig-modal {
  border-color: #ff2d2d;
}

[data-theme="black-red"] .stat-value {
  color: #ff2d2d;
}

[data-theme="black-red"] .upgrade-cost,
[data-theme="black-red"] .hardware-cost {
  color: #ff2d2d !important;
}

[data-theme="black-red"] .purchase-btn {
  background: #ff2d2d;
}

[data-theme="black-red"] .purchase-btn:hover:not(:disabled) {
  background: #cc0000;
}

[data-theme="cyberpunk"] .mining-rig-modal {
  border-color: #ff2bd6;
}

[data-theme="cyberpunk"] .stat-value {
  color: #ff2bd6;
}

[data-theme="cyberpunk"] .upgrade-cost,
[data-theme="cyberpunk"] .hardware-cost {
  color: #ff2bd6 !important;
}

[data-theme="cyberpunk"] .purchase-btn {
  background: #ff2bd6;
  color: #000000;
}

[data-theme="cyberpunk"] .purchase-btn:hover:not(:disabled) {
  background: #cc00aa;
}
</style>
