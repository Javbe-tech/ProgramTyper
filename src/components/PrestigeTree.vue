<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  gameState: { type: Object, required: true }
});
const emit = defineEmits(['close']);

// Generate 75 placeholder upgrades with categories
const categories = [
  { name: 'Core Mechanics', count: 9 },
  { name: 'Permanent Slots', count: 5 },
  { name: 'Starter Kits', count: 3 },
  { name: 'Lucky', count: 4 },
  { name: 'Global Multipliers', count: 20 },
  { name: 'Quality of Life', count: 10 },
  { name: 'Specialized & Late Game', count: 24 }
];
const items = [];
let id = 1;
for (const cat of categories) {
  for (let i = 0; i < cat.count; i++) {
    items.push({ id: id++, category: cat.name, name: `${cat.name} #${i+1}`, cost: Math.max(1, Math.floor(Math.pow(2, Math.min(i, 12)))) });
  }
}

const owned = computed(() => props.gameState.prestigeTree || {});
const tokens = computed(() => props.gameState.prestigeTokens || 0);

function buy(upg) {
  if (owned.value[upg.id]) return;
  if ((props.gameState.prestigeTokens || 0) < upg.cost) return;
  props.gameState.prestigeTokens -= upg.cost;
  if (!props.gameState.prestigeTree) props.gameState.prestigeTree = {};
  props.gameState.prestigeTree[upg.id] = true;
}
</script>

<template>
  <div v-if="show" class="pt-overlay" @click.self="emit('close')">
    <div class="pt-modal" @click.stop>
      <div class="pt-header">
        <h2>🌀 Prestige Upgrade Tree</h2>
        <div class="pt-tokens">Tokens: <strong>{{ tokens }}</strong></div>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>
      <div class="pt-body">
        <div class="pt-grid">
          <div v-for="upg in items" :key="upg.id" class="pt-card" :class="{ owned: owned[upg.id] }">
            <div class="pt-name">{{ upg.name }}</div>
            <div class="pt-cat">{{ upg.category }}</div>
            <div class="pt-cost">Cost: {{ upg.cost }}</div>
            <button class="pt-buy" :disabled="owned[upg.id] || tokens < upg.cost" @click="buy(upg)">
              {{ owned[upg.id] ? 'Owned' : 'Buy' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pt-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 11000; }
.pt-modal { width: 92%; max-width: 1100px; max-height: 90vh; background: var(--bg-color); border: 2px solid var(--border-color); border-radius: 10px; display: flex; flex-direction: column; }
.pt-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
.pt-tokens { color: var(--font-color); }
.pt-body { padding: 12px; overflow: auto; }
.pt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.pt-card { background: var(--sidebar-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.pt-card.owned { border-color: #22c55e; box-shadow: 0 0 0 1px rgba(34,197,94,0.3); }
.pt-name { color: var(--font-color); font-weight: 700; }
.pt-cat { color: var(--gray); font-size: 0.85rem; }
.pt-cost { color: var(--font-color); font-weight: 600; }
.pt-buy { background: var(--keyword); color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; }
.pt-buy:disabled { background: #555; cursor: not-allowed; }
.close-btn { background: none; border: none; color: var(--font-color); font-size: 1.4rem; cursor: pointer; }
</style>
