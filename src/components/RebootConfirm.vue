<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  gameState: { type: Object, required: true }
});
const emit = defineEmits(['close','confirm']);

function requiredForLevel(level) {
  // totalCoinsMinedAllTime needed for a given prestige level
  const base = 1_000_000_000_000; // 1e12
  return Math.pow(level, 3) * base;
}
</script>

<template>
  <div v-if="show" class="rb-overlay" @click.self="emit('close')">
    <div class="rb-modal" @click.stop>
      <div class="rb-header">
        <h2>🌀 Reboot Confirmation</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>
      <div class="rb-body">
        <div class="rb-row">
          <div class="rb-stat">
            <div class="label">Total Coins (All Time)</div>
            <div class="value">{{ Math.floor(gameState.totalCoinsMinedAllTime || 0).toLocaleString() }}</div>
          </div>
          <div class="rb-stat">
            <div class="label">Current Prestige</div>
            <div class="value">{{ gameState.prestigeLevel || 0 }}</div>
          </div>
          <div class="rb-stat">
            <div class="label">Levels If You Reboot Now</div>
            <div class="value">{{ Math.max(0, Math.floor(Math.cbrt((gameState.totalCoinsMinedAllTime||0)/1_000_000_000_000)) - (gameState.prestigeLevel||0)) }}</div>
          </div>
        </div>
        <div class="rb-note">
          Minimum needed for next level ({{ (gameState.prestigeLevel||0) + 1 }}):
          <strong>{{ requiredForLevel((gameState.prestigeLevel||0)+1).toLocaleString() }}</strong>
        </div>
        <div class="rb-warning">
          Reboot resets: coins, hardware, non-permanent upgrades, real estate, and wattage progress. Prestige levels and tokens persist.
        </div>
      </div>
      <div class="rb-actions">
        <button class="rb-cancel" @click="emit('close')">Cancel</button>
        <button class="rb-confirm" @click="emit('confirm')">Reboot Now</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 12000; }
.rb-modal { width: 92%; max-width: 760px; background: var(--bg-color); border: 2px solid var(--border-color); border-radius: 12px; overflow: hidden; }
.rb-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--menu-bar-bg); border-bottom: 1px solid var(--border-color); }
.close-btn { background: none; border: none; color: var(--font-color); font-size: 1.4rem; cursor: pointer; }
.rb-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.rb-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 10px; }
.rb-stat { background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; }
.label { color: var(--gray); font-size: 0.85rem; }
.value { color: var(--font-color); font-weight: 800; font-size: 1.1rem; }
.rb-note { color: var(--font-color); background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; }
.rb-warning { color: #ff6b6b; background: rgba(255, 107, 107, 0.08); border: 1px solid #ff6b6b44; border-radius: 8px; padding: 10px; font-weight: 600; }
.rb-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px; border-top: 1px solid var(--border-color); }
.rb-cancel { background: transparent; color: var(--font-color); border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.rb-confirm { background: var(--keyword); color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
</style>
