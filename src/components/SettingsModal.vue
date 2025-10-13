<script setup>
import { ref, onMounted } from 'vue';
import { settingsService } from '../services/settingsService.js';
import { authService } from '../services/authService.js';

const emit = defineEmits(['close', 'open-pro-upgrade']);

// Settings state
const settings = ref({ ...settingsService.getSettings() });

// Lightweight WebAudio preview for typing/error sounds
const audioCtx = ref(null);
function initAudio() {
  if (!audioCtx.value) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx.value = new Ctx();
  }
}
function playPreview(isError) {
  try {
    initAudio();
    const ctx = audioCtx.value; if (!ctx) return;
    const id = isError ? settings.value.errorSoundId : settings.value.typingSoundId;
    const vol = Math.max(0.0, Math.min(1.0, settings.value.soundVolume ?? 0.5));
    const base = isError ? 140 : 200;
    const table = [0,2,4,5,7,9,11,12,14,16];
    const semis = table[((id||1)-1)%table.length];
    const freq = base * Math.pow(2, semis/12);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isError ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    const peak = Math.max(0.05, vol * (isError ? 0.22 : 0.16));
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (isError ? 0.12 : 0.07));
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + (isError ? 0.13 : 0.08));
  } catch {}
}

function closeModal() {
  emit('close');
}

function checkProAccess() {
  const isAuthenticated = authService.isUserAuthenticated();
  const isProUser = localStorage.getItem('pt_pro_user') === '1';
  return isAuthenticated && isProUser;
}

function handleSettingChange() {
  if (!checkProAccess()) {
    emit('open-pro-upgrade');
    return false;
  }
  return true;
}

function saveSettings() {
  if (!checkProAccess()) {
    emit('open-pro-upgrade');
    return;
  }
  
  settingsService.updateSettings(settings.value);
  applySettings();
  closeModal();
}

function applySettings() {
  if (!checkProAccess()) {
    return;
  }
  
  // Apply faded words brightness
  const root = document.documentElement;
  root.style.setProperty('--faded-words-opacity', settings.value.fadedWordsBrightness);
}

function resetToDefaults() {
  if (!checkProAccess()) {
    emit('open-pro-upgrade');
    return;
  }
  
  settings.value = { ...settingsService.defaultSettings };
}

onMounted(() => {
  if (checkProAccess()) {
    applySettings();
  }
});
</script>

<template>
  <div class="settings-overlay" @click.self="closeModal">
    <div class="settings-content" @click.stop>
      <div class="settings-header">
        <h2>⚙️ Typing Settings</h2>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="settings-body">
        <!-- Pro Upgrade Prompt -->
        <div v-if="!checkProAccess()" class="pro-upgrade-prompt">
          <div class="pro-icon">👑</div>
          <h3>Upgrade to Pro</h3>
          <p>Unlock advanced typing settings and customization options!</p>
          <div class="pro-features">
            <div class="pro-feature">✓ Customize typing options</div>
            <div class="pro-feature">✓ Adjust brightness settings</div>
            <div class="pro-feature">✓ Save settings across devices</div>
            <div class="pro-feature">✓ Remove ads forever</div>
          </div>
          <button @click="emit('open-pro-upgrade')" class="upgrade-btn">
            Upgrade to Pro - $5 One-time
          </button>
        </div>
        
        <!-- Settings Content (only for pro users) -->
        <div v-else>
        <!-- Typing Options Section -->
        <div class="settings-section">
          <h3>📝 Typing Options</h3>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  v-model="settings.enableCapitals"
                  class="setting-checkbox"
                />
                <span class="setting-text">Enable capitals at start of sentences</span>
              </label>
              <div class="setting-description">Automatically capitalize first letter of sentences</div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  v-model="settings.enablePeriods"
                  class="setting-checkbox"
                />
                <span class="setting-text">Enable periods at end of sentences</span>
              </label>
              <div class="setting-description">Automatically add periods after sentences</div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  v-model="settings.enableWordCapitals"
                  class="setting-checkbox"
                />
                <span class="setting-text">Enable capitals for every word</span>
              </label>
              <div class="setting-description">Capitalize first letter of every word (Title Case)</div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">
                <input 
                  type="checkbox" 
                  v-model="settings.enableSpecialChars"
                  class="setting-checkbox"
                />
                <span class="setting-text">Enable special characters</span>
              </label>
              <div class="setting-description">Include programming symbols: [ { / : ' " , > < } ] etc.</div>
            </div>
          </div>
        </div>

        <!-- Visual Settings Section -->
        <div class="settings-section">
          <h3>🎨 Visual Settings</h3>
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-text">Faded words brightness</span>
            </label>
            <div class="brightness-control">
                <input 
                  type="range" 
                  v-model.number="settings.fadedWordsBrightness"
                  min="0.1" 
                  max="2.0" 
                  step="0.05"
                  class="brightness-slider"
                  @input="applySettings"
                />
              <div class="brightness-labels">
                <span>Much Darker</span>
                <span>Default</span>
                <span>Brighter Than Normal</span>
              </div>
            </div>
            <div class="setting-description">
              Adjust how bright/dark the faded words appear while typing
            </div>
          </div>
        </div>

        <!-- Sound Settings -->
        <div class="settings-section">
          <h3>🔊 Sound Settings</h3>
          <div class="settings-grid">
            <div class="setting-item">
              <label class="setting-label">
                <input type="checkbox" v-model="settings.enableTypingSound" class="setting-checkbox" />
                <span class="setting-text">Enable typing sound</span>
              </label>
              <label class="setting-label">
                <input type="checkbox" v-model="settings.enableErrorSound" class="setting-checkbox" />
                <span class="setting-text">Enable error sound</span>
              </label>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-text">Typing sound</span>
              </label>
              <div class="row-select">
                <select v-model.number="settings.typingSoundId" class="setting-select">
                <option v-for="n in 10" :key="n" :value="n">Option {{ n }}</option>
                </select>
                <button class="preview-btn" type="button" @click="playPreview(false)">Play</button>
              </div>
              <div class="setting-description">Choose the sound played on each correct key.</div>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-text">Error sound</span>
              </label>
              <div class="row-select">
                <select v-model.number="settings.errorSoundId" class="setting-select">
                <option v-for="n in 10" :key="n" :value="n">Option {{ n }}</option>
                </select>
                <button class="preview-btn" type="button" @click="playPreview(true)">Play</button>
              </div>
              <div class="setting-description">Choose the sound played on incorrect keys.</div>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                <span class="setting-text">Volume</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" v-model.number="settings.soundVolume" class="brightness-slider" />
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="settings-section">
          <h3>👀 Preview</h3>
          <div class="preview-box">
            <div class="preview-text">
              <span class="preview-faded">This is how faded text will look</span>
              <span class="preview-normal">This is normal text</span>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      <div class="settings-footer">
        <button v-if="checkProAccess()" @click="resetToDefaults" class="reset-btn">Reset to Defaults</button>
        <button v-if="checkProAccess()" @click="saveSettings" class="save-btn">Save Settings</button>
        <button v-else @click="closeModal" class="close-modal-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-content {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.settings-header h2 {
  margin: 0;
  color: var(--font-color);
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--gray);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--font-color);
}

.settings-body {
  padding: 20px;
}

/* Pro Upgrade Prompt Styles */
.pro-upgrade-prompt {
  text-align: center;
  padding: 40px 20px;
}

.pro-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.pro-upgrade-prompt h3 {
  margin: 0 0 15px 0;
  color: var(--font-color);
  font-size: 1.8rem;
}

.pro-upgrade-prompt p {
  margin: 0 0 25px 0;
  color: var(--gray);
  font-size: 1.1rem;
  line-height: 1.5;
}

.pro-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
  text-align: left;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.pro-feature {
  color: var(--font-color);
  font-size: 1rem;
  padding: 8px 0;
}

.upgrade-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.3s ease;
}

.upgrade-btn:hover {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(124, 58, 237, 0.3);
}

.close-modal-btn {
  background: var(--border-color);
  color: var(--font-color);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.close-modal-btn:hover {
  background: var(--active-line-bg);
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h3 {
  margin: 0 0 15px 0;
  color: var(--font-color);
  font-size: 1.2rem;
  border-bottom: 2px solid var(--keyword);
  padding-bottom: 5px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.setting-item {
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 8px;
}

.setting-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--keyword);
}

.setting-text {
  font-weight: 500;
  color: var(--font-color);
  font-size: 1rem;
}

.setting-description {
  color: var(--gray);
  font-size: 0.9rem;
  margin-left: 28px;
  line-height: 1.4;
}
.setting-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--sidebar-bg);
  color: var(--font-color);
}
.row-select { display: flex; gap: 8px; align-items: center; }
.preview-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.preview-btn:hover { background: #6d28d9; }

.brightness-control {
  margin: 10px 0;
  display: block;
}

.brightness-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--keyword);
  cursor: pointer;
}

.brightness-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--keyword);
  cursor: pointer;
  border: none;
}

.brightness-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 0.8rem;
  color: var(--gray);
}

.preview-box {
  background: var(--terminal-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 20px;
  text-align: center;
}

.preview-text {
  font-family: 'Consolas', monospace;
  font-size: 1.1rem;
  line-height: 1.6;
}

.preview-faded {
  opacity: var(--faded-words-opacity, 0.5);
  color: var(--gray);
  margin-right: 10px;
}

.preview-normal {
  color: var(--font-color);
}

.settings-footer {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.reset-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--gray);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
  border-color: var(--font-color);
}

.save-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.save-btn:hover {
  background: #6d28d9;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .settings-content {
    width: 95%;
    margin: 10px;
  }
  
  .settings-footer {
    flex-direction: column;
  }
  
  .brightness-labels {
    font-size: 0.7rem;
  }
}
</style>
