<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  showAds: { type: Boolean, default: true }
});
const emit = defineEmits(['remove-ads']);

const adBlocked = ref(false);

onMounted(() => {
  // Simple ad-block detection: many blockers hide elements with these class names
  const bait = document.createElement('div');
  bait.className = 'ads ad adsbox ad-banner sponsored';
  bait.style.position = 'absolute';
  bait.style.left = '-9999px';
  document.body.appendChild(bait);
  setTimeout(() => {
    const blocked = getComputedStyle(bait).display === 'none' || bait.clientHeight === 0;
    adBlocked.value = blocked;
    document.body.removeChild(bait);
  }, 50);
});

function openRemoveAds() {
  emit('remove-ads');
}
</script>

<template>
  <aside class="right-ad-bar" v-show="showAds">
    <div class="ad-wrapper" aria-label="Advertisement">
      <div class="ad-placeholder">Banner Ad</div>
    </div>
    <button class="remove-ads-btn" @click="openRemoveAds">🛑 Remove ads ($5)</button>
    <div class="adblock-warning" v-if="adBlocked && showAds" title="Ad blocker detected">
      <!-- white icon with red X -->
      <svg width="28" height="28" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#ffffff"/>
        <path d="M6 6 L18 18 M18 6 L6 18" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
      </svg>
    </div>
  </aside>
  <aside class="right-ad-bar" v-show="!showAds">
    <div class="ad-free">Thanks for supporting ProgramTyper ✨</div>
  </aside>
 </template>

<style scoped>
.right-ad-bar { 
  width: 320px; 
  border-left: 1px solid var(--border-color); 
  background: var(--sidebar-bg); 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 10px; 
  padding: 10px; 
}
.ad-wrapper { width: 100%; }
.ad-placeholder { width: 100%; height: 250px; border: 1px dashed var(--border-color); border-radius: 6px; color: var(--gray); display: flex; align-items: center; justify-content: center; background: var(--bg-color); }
.remove-ads-btn { width: 100%; background: var(--keyword); color: #fff; border: none; padding: 8px 10px; border-radius: 6px; cursor: pointer; font-family: inherit; }
.remove-ads-btn:hover { background: #6d28d9; }
.adblock-warning { margin-top: 6px; }
.ad-free { color: var(--gray); font-size: 0.9rem; text-align: center; }
</style>


