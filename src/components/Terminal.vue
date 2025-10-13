<script setup>
import { ref, watch, nextTick } from 'vue';
const props = defineProps({
  showAds: { type: Boolean, default: false }
});
const emit = defineEmits(['remove-ads']);
import { events } from '../eventBus.js';
import PerformanceGraph from './PerformanceGraph.vue';

const outputLines = ref(['Welcome to James Dark ProgramTyper...']);
const wpmHistory = ref([]);
const terminalContentRef = ref(null);
const overallTime = ref(0);
const sessionWpm = ref(0); // session average for this file
const lifetimeAverageWpm = ref(0); // persistent user baseline

watch(events, (newEventObject) => {
  // This event comes every 250ms while the user is typing
  if (newEventObject.liveTypingUpdate) {
    const [liveWpm] = newEventObject.liveTypingUpdate.data;
    
    // --- LOGIC UPDATED ---
    // If we have an average WPM to compare against, decide the color
    // Prefer lifetime baseline if available; fallback to session average
    const baseline = lifetimeAverageWpm.value > 0 ? lifetimeAverageWpm.value : sessionWpm.value;
    if (baseline > 0) {
      const statusClass = liveWpm >= baseline ? 'green-text' : 'red-text';
      outputLines.value.push(`> Typing... Current Speed: <span class="${statusClass}">${liveWpm} WPM</span>`);
    } else {
      // Before the first line is complete, just show the plain WPM
      outputLines.value.push(`> Typing... Current Speed: ${liveWpm} WPM`);
    }
  }

  // This event comes once when a line is completed
  if (newEventObject.updateLastRun) {
    const [lineWpm, lineAcc, status] = newEventObject.updateLastRun.data;
    const statusClass = status === 'above_average' ? 'green-text' : 'red-text';
    outputLines.value.push(
      `> COMPLETED: <span class="${statusClass}">${lineWpm} WPM</span> | ${lineAcc}% Accuracy`
    );
    wpmHistory.value.push(lineWpm);
  }

  // This event comes after a line is completed with the new session totals
  if (newEventObject.updateSessionStats) {
      const [wpm, acc, time, lifetimeAvg] = newEventObject.updateSessionStats.data;
      sessionWpm.value = wpm;
      overallTime.value = time;
      if (typeof lifetimeAvg === 'number') lifetimeAverageWpm.value = lifetimeAvg;
  }

  // Auto-scroll to the bottom of the output on every update
  nextTick(() => {
    const el = terminalContentRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}, { deep: true });
</script>

<template>
  <div id="terminal">
    <div class="terminal-header">
      <div class="tabs">
        <span class="tab-item">Problems</span>
        <span class="tab-item">Output</span>
        <span class="tab-item">Debug Console</span>
        <span class="tab-item active">Terminal</span>
        <span class="tab-item">Ports</span>
      </div>
      <div class="controls">
        <span class="control-item">powershell</span>
        <span class="control-item icon">+</span>
        <span class="control-item icon">v</span>
        <span class="control-item icon">| |</span>
        <span class="control-item icon">🗑</span>
      </div>
    </div>
    <div class="terminal-body">
      <div class="terminal-content" ref="terminalContentRef">
         <div v-for="(line, index) in outputLines" :key="index" class="output-line" v-html="line"></div>
         <div class="prompt-line">
            <span class="path">PS C:\ProgramTyper></span>
            <span class="cursor"></span>
         </div>
      </div>
      <PerformanceGraph :wpm-history="wpmHistory" />
    </div>
    
    <!-- Bottom-centered ad placeholder -->
    <div class="ad-bottom-center" aria-label="Advertisement" v-if="false">
      <div class="ad-content">
        <div class="ad-text">Remove Ads</div>
        <div class="ad-price">$5</div>
        <button class="remove-ads-btn" @click="$emit('remove-ads')">
          Upgrade to Pro
        </button>
      </div>
    </div>
    
    <!-- Debug: Always show ad for testing -->
    <div class="ad-bottom-center debug-ad" aria-label="Debug Ad" v-if="false">
      <div class="ad-content">
        <div class="ad-text">DEBUG: Remove Ads</div>
        <div class="ad-price">$5</div>
        <button class="remove-ads-btn" @click="$emit('remove-ads')">
          Upgrade to Pro
        </button>
      </div>
    </div>
    
     <div class="terminal-footer">
      <div>Total Active Typing Time: {{ overallTime }}s</div>
    </div>
  </div>
</template>

<style scoped>
#terminal { flex-basis: 200px; background-color: var(--terminal-bg); border-top: 1px solid var(--border-color); display: flex; flex-direction: column; position: relative; }
.terminal-header { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; height: 35px; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
.tabs { display: flex; gap: 15px; }
.tab-item { color: var(--gray); font-size: 0.9rem; cursor: pointer; padding: 5px 0; }
.tab-item.active { color: var(--font-color); border-bottom: 2px solid var(--font-color); }
.controls { display: flex; align-items: center; gap: 10px; color: var(--gray); }
.icon { font-size: 1.2rem; cursor: pointer; }
.terminal-body { position: relative; display: flex; flex-grow: 1; overflow: hidden; height: 0; align-items: stretch; }
.terminal-content { flex-grow: 1; padding: 10px; overflow-y: auto; font-family: 'Consolas', monospace; }
.output-line { white-space: pre-wrap; margin-bottom: 5px; color: var(--gray); }
.prompt-line { display: flex; align-items: center; }
.path { color: var(--font-color); }
.cursor { width: 8px; height: 1.2rem; background-color: var(--keyword); /* animation: blink 1s steps(1) infinite; */ margin-left: 5px; border-radius: 1px; }
/* @keyframes blink { 50% { opacity: 0; } } */
.terminal-footer { padding: 5px 15px; border-top: 1px solid var(--border-color); color: var(--gray); flex-shrink: 0; font-size: 0.9rem; }

.ad-bottom-center { 
  position: absolute; 
  bottom: 40px; 
  left: 50%; 
  transform: translateX(-50%); 
  z-index: 10; 
}

.ad-content {
  width: 320px;
  height: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--font-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ad-text {
  font-size: 0.9rem;
  color: var(--gray);
  margin-bottom: 5px;
}

.ad-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--keyword);
  margin-bottom: 10px;
}

.remove-ads-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.remove-ads-btn:hover {
  background: #6d28d9;
}

/* Debug styles */
.debug-ad {
  background: red !important;
  border: 3px solid yellow !important;
  z-index: 999 !important;
}

.debug-ad .ad-content {
  background: red !important;
  border: 3px solid yellow !important;
}

:global(.green-text) {
    color: var(--completed-green);
    font-weight: bold;
}
:global(.red-text) {
    color: var(--red);
    font-weight: bold;
}
</style>