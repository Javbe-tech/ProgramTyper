<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import { emit } from '../eventBus.js';
import { generateCodeForFile, generateTypingLine } from '../codeGenerator.js';
import { userStatsService } from '../services/userStatsService.js';

const props = defineProps({
  openTabs: Array,
  activeTab: String,
  customContent: Object,
  isModalOpen: Boolean,
  tabChallengeStats: Object,
  getTabChallengeStats: Function,
});

const emitEvent = defineEmits(['update:activeTab', 'close-tab', 'initialize-tab-stats', 'update-tab-challenge-stats', 'file-completed']);

const editorContentRef = ref(null);
const fileContents = reactive({});
const lines = ref([]);
const gameStatus = ref('waiting');
const activeLineIndex = ref(-1);
const currentCharacterIndex = ref(0);

const sessionTotalActiveTime = ref(0);
const sessionTotalStrokes = ref(0);
const sessionCorrectStrokes = ref(0);
const lineStartTime = ref(null);
const lineStrokes = ref(0);
const lineCorrectStrokes = ref(0);
const liveTimerInterval = ref(null);

// Auto-completion effect state
const autoCompletionProgress = ref({});
const autoCompletionInterval = ref(null);

const cursorLeftPosition = computed(() => {
  if (activeLineIndex.value === -1) return '0ch';
  const line = lines.value[activeLineIndex.value];
  if (!line || !line.isTypable) return '0ch';
  
  const totalOffset = line.prefixLength + currentCharacterIndex.value;
  return `calc(15px + ${(line.indent * 2)}ch + ${totalOffset}ch)`;
});

watch(() => props.activeTab, (newTab) => {
  if (newTab) loadContentForTab(newTab);
  else lines.value = [];
}, { immediate: true });

function loadContentForTab(fileName) {
  if (props.customContent && props.customContent[fileName]) {
    lines.value = props.customContent[fileName];
  } else {
    if (!fileContents[fileName]) {
      fileContents[fileName] = generateCodeForFile(fileName);
    }
    // Always get the latest content (in case challenges were regenerated)
    lines.value = [...fileContents[fileName]]; // Create a copy to avoid reference issues
  }
  resetLineState(true); // Full reset for new file
  
  // Initialize tab stats
  emitEvent('initialize-tab-stats', fileName);
  
  // Start new statistics session
  userStatsService.startSession();
  
  const firstChallenge = lines.value.findIndex(l => l.isTypable && !l.isCompleted);
  if (firstChallenge !== -1) {
    setActiveLine(firstChallenge);
  }
}

function resetLineState(isNewFile = false) {
    gameStatus.value = 'waiting';
    if (liveTimerInterval.value) clearInterval(liveTimerInterval.value);
    liveTimerInterval.value = null;
    if (autoCompletionInterval.value) clearInterval(autoCompletionInterval.value);
    autoCompletionInterval.value = null;
    lineStartTime.value = null;
    lineStrokes.value = 0;
    lineCorrectStrokes.value = 0;
    currentCharacterIndex.value = 0;
    autoCompletionProgress.value = {};
    if (isNewFile) {
        activeLineIndex.value = -1;
    }
}

function resetCurrentLine() {
    if (activeLineIndex.value === -1) return;
    const line = lines.value[activeLineIndex.value];
    if (line) {
        line.statuses.fill('untyped');
    }
    resetLineState(false); // Reset timers and stats for the current line
    emit('liveTypingUpdate', 0); // Reset the live WPM display in terminal
}

function setActiveLine(index) {
  console.log('setActiveLine called with index:', index);
  console.log('Line at index:', lines.value[index]);
  if (lines.value[index]?.isTypable && !lines.value[index]?.isCompleted) {
    console.log('Setting active line to:', index);
    activeLineIndex.value = index;
    currentCharacterIndex.value = 0;
    // Don't reset these here - let resetLineState handle it
    // lineStartTime.value = null;
    // lineStrokes.value = 0;
    // lineCorrectStrokes.value = 0;
    scrollToActiveLine();
  } else {
    console.log('Cannot set active line - line is not typable or already completed');
  }
}

function scrollToActiveLine() {
  nextTick(() => {
    const lineEl = editorContentRef.value?.querySelector(`#line-${activeLineIndex.value}`);
    if (lineEl) lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function updateLiveStats() {
    if (!lineStartTime.value) return;
    const elapsedSeconds = (new Date() - lineStartTime.value) / 1000;
    const wpm = elapsedSeconds > 0 ? Math.round(((lineCorrectStrokes.value / 5) / elapsedSeconds) * 60) : 0;
    emit('liveTypingUpdate', wpm);
}

// Auto-completion effect function
function startAutoCompletionEffect() {
    if (autoCompletionInterval.value) return;
    
    autoCompletionInterval.value = setInterval(() => {
        if (activeLineIndex.value === -1) return;
        
        const currentLine = lines.value[activeLineIndex.value];
        if (!currentLine || !currentLine.isTypable) return;
        
        // Calculate typing speed based on recent keystrokes
        const timeSinceStart = (new Date() - lineStartTime.value) / 1000;
        const typingSpeed = timeSinceStart > 0 ? currentCharacterIndex.value / timeSinceStart : 0;
        
        // Only auto-complete lines near the current typing position (within 3 lines)
        const nearbyRange = 3;
        const startIndex = Math.max(0, activeLineIndex.value - nearbyRange);
        const endIndex = Math.min(lines.value.length - 1, activeLineIndex.value + nearbyRange);
        
        for (let index = startIndex; index <= endIndex; index++) {
            const line = lines.value[index];
            if (line.isTypable || index === activeLineIndex.value) continue;
            
            // Initialize progress for this line if not exists
            if (!autoCompletionProgress.value[index]) {
                autoCompletionProgress.value[index] = { charsCompleted: 0, totalChars: line.text.length };
            }
            
            const progress = autoCompletionProgress.value[index];
            
            // Type at the same speed as the user, but slower for nearby lines
            if (progress.charsCompleted < progress.totalChars && typingSpeed > 0) {
                // Calculate distance from current line to determine speed
                const distance = Math.abs(index - activeLineIndex.value);
                const speedMultiplier = Math.max(0.1, 1 - (distance * 0.2)); // Closer lines type faster
                
                const charsToAdd = Math.min(typingSpeed * 0.05 * speedMultiplier, 0.5); // Much slower overall
                progress.charsCompleted = Math.min(
                    progress.charsCompleted + charsToAdd,
                    progress.totalChars
                );
            }
        }
    }, 50); // Update every 50ms for smoother effect
}

function stopAutoCompletionEffect() {
    if (autoCompletionInterval.value) {
        clearInterval(autoCompletionInterval.value);
        autoCompletionInterval.value = null;
    }
}

function handleKeyDown(e) {
  if (props.isModalOpen) return;
  
  if (e.key === 'Escape') {
      e.preventDefault();
      resetCurrentLine();
      return;
  }

  if (activeLineIndex.value === -1 || !['typing', 'waiting'].includes(gameStatus.value) || e.key.length > 1) return;
  e.preventDefault();
  
  const currentLine = lines.value[activeLineIndex.value];
  if (!currentLine || currentLine.isCompleted) return;
  if (gameStatus.value === 'waiting') {
    gameStatus.value = 'typing';
    lineStartTime.value = new Date();
    liveTimerInterval.value = setInterval(updateLiveStats, 250);
    startAutoCompletionEffect();
  }
  const expectedChar = currentLine.text[currentCharacterIndex.value];
  const isCorrect = e.key === expectedChar;
  
  // Record character statistics (do not attribute to an entire line as a word)
  userStatsService.recordCharacter(expectedChar, isCorrect);
  
  lineStrokes.value++;
  sessionTotalStrokes.value++;
  if (isCorrect) {
    lineCorrectStrokes.value++;
    sessionCorrectStrokes.value++;
    currentLine.statuses[currentCharacterIndex.value] = 'correct';
    currentCharacterIndex.value++;
  } else {
    currentLine.statuses[currentCharacterIndex.value] = 'incorrect';
  }
  if (currentCharacterIndex.value >= currentLine.text.length) {
    completeLine();
  }
}

function completeLine() {
  console.log('=== COMPLETE LINE CALLED ===');
  clearInterval(liveTimerInterval.value);
  liveTimerInterval.value = null;
  stopAutoCompletionEffect();

  const completedLineIndex = activeLineIndex.value;
  const currentLine = lines.value[completedLineIndex];
  console.log('Completing line at index:', completedLineIndex);
  console.log('Current line before completion:', currentLine);
  
  currentLine.isCompleted = true;
  console.log('Current line after setting isCompleted:', currentLine);
  const lineDuration = new Date() - lineStartTime.value;
  const elapsedLineSeconds = lineDuration / 1000;
  const lineWpm = elapsedLineSeconds > 0 ? Math.round(((lineCorrectStrokes.value / 5) / elapsedLineSeconds) * 60) : 0;
  const lineAcc = lineStrokes.value > 0 ? Math.round((lineCorrectStrokes.value / lineStrokes.value) * 100) : 100;
  
  // Record word completion statistics per actual word in the line
  const wordsInLine = currentLine.text.split(/\s+/).filter(Boolean);
  const perWordSeconds = wordsInLine.length > 0 ? elapsedLineSeconds / wordsInLine.length : elapsedLineSeconds;
  const lineAccuracy = lineStrokes.value > 0 ? lineCorrectStrokes.value / lineStrokes.value : 1;
  wordsInLine.forEach(w => userStatsService.completeWord(w, perWordSeconds, lineAccuracy >= 0.8));
  
  const sessionElapsedMinutes = sessionTotalActiveTime.value / 1000 / 60;
  const currentSessionWpm = sessionElapsedMinutes > 0 ? Math.round((sessionCorrectStrokes.value / 5) / sessionElapsedMinutes) : 0;
  
  const status = lineWpm >= currentSessionWpm && currentSessionWpm > 0 ? 'above_average' : 'below_average';
  
  sessionTotalActiveTime.value += lineDuration;
  
  emit('updateLastRun', lineWpm, lineAcc, status);
  // Report peak line WPM to stats service for accurate top speed
  userStatsService.recordLineResult(lineWpm);
  // Record per-lesson results for progress chart (WPM & Accuracy)
  userStatsService.recordLessonResult(lineWpm, lineAcc);
  updateSessionStats();
  
  // Update tab challenge stats after each completion
  const completedCount = lines.value.filter(l => l.isTypable && l.isCompleted).length;
  const totalTypableLines = lines.value.filter(l => l.isTypable).length;
  emitEvent('update-tab-challenge-stats', props.activeTab, completedCount);
  
  console.log('=== CALCULATING REMAINING CHALLENGES ===');
  console.log('Total lines:', lines.value.length);
  
  const remainingChallenges = lines.value
    .map((line, index) => ({ ...line, index }))
    .filter(line => {
      const isTypable = line.isTypable;
      const isNotCompleted = !line.isCompleted;
      console.log(`Line ${line.index}: isTypable=${isTypable}, isCompleted=${line.isCompleted}, passes=${isTypable && isNotCompleted}`);
      return isTypable && isNotCompleted;
    });

  console.log('Line completed. Remaining challenges:', remainingChallenges.length);
  console.log('All lines:', lines.value.map((l, i) => ({ index: i, isTypable: l.isTypable, isCompleted: l.isCompleted })));

  if (remainingChallenges.length > 0) {
    // Random jump to another remaining challenge
    const nextIndex = remainingChallenges[Math.floor(Math.random() * remainingChallenges.length)].index;
    console.log('=== ATTEMPTING TO JUMP ===');
    console.log('Selected nextIndex:', nextIndex);
    console.log('Target line:', lines.value[nextIndex]);

    console.log('About to call setActiveLine with:', nextIndex);
    setActiveLine(nextIndex);
    console.log('setActiveLine called, activeLineIndex is now:', activeLineIndex.value);
    resetLineState(false);
    // Dynamically refresh the next challenge's words based on current weaknesses
    const line = lines.value[nextIndex];
    if (line && line.isTypable) {
      const refreshed = generateTypingLine();
      line.text = refreshed.text;

      // Preserve original prefix spacing and add code-structure tokens
      if (typeof line._basePrefix !== 'number') {
        line._basePrefix = line.prefixLength || 0;
      }
      const spacePrefix = ' '.repeat(line._basePrefix);
      const beforeTokens = [
        { type: 'token-comment', text: spacePrefix },
        { type: 'token-keyword', text: 'const ' },
        { type: 'token-variable', text: 'snippet' },
        { type: 'token-operator', text: ' = ' },
        { type: 'token-string', text: "'" },
      ];
      const afterTokens = [
        { type: 'token-string', text: "'" },
        { type: 'token-operator', text: ';' },
      ];
      const additionalPrefixLen = 'const '.length + 'snippet'.length + ' = '.length + 1; // opening quote

      line.tokens = [
        ...beforeTokens,
        { type: 'typable-challenge', text: refreshed.text },
        ...afterTokens,
      ];
      line.statuses = Array(refreshed.text.length).fill('untyped');
      line.prefixLength = line._basePrefix + additionalPrefixLen;
      // indentation preserved via CSS var --indent-level
    }
  } else {
    // All challenges completed!
    gameStatus.value = 'finished';
    // End statistics session when all challenges are completed
    userStatsService.endSession();
    
    // Emit file completion event
    emitEvent('file-completed', props.activeTab, {
      totalLines: totalTypableLines,
      completedLines: completedCount,
      averageWpm: Math.floor(Math.random() * 50) + 30,
      accuracy: Math.floor(Math.random() * 20) + 80,
      time: Math.floor(Math.random() * 300) + 60
    });
  }
}

function updateSessionStats() {
  const elapsedMinutes = sessionTotalActiveTime.value / 1000 / 60;
  const wpm = elapsedMinutes > 0 ? Math.round((sessionCorrectStrokes.value / 5) / elapsedMinutes) : 0;
  const acc = sessionTotalStrokes.value > 0 ? Math.round((sessionCorrectStrokes.value / sessionTotalStrokes.value) * 100) : 100;
  const totalSeconds = Math.round(sessionTotalActiveTime.value / 1000);
  emit('updateSessionStats', wpm, acc, totalSeconds);
}

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    if(liveTimerInterval.value) clearInterval(liveTimerInterval.value);
    if(autoCompletionInterval.value) clearInterval(autoCompletionInterval.value);
});
</script>

<template>
  <div id="editor-area">
    <div id="editor-tabs">
        <div v-for="tab in openTabs" :key="tab" class="tab" 
             :class="{ 
               active: tab === activeTab,
               'has-challenges': getTabChallengeStats(tab).remaining > 0,
               'completed': getTabChallengeStats(tab).remaining === 0 && getTabChallengeStats(tab).total > 0
             }" 
             @click="emitEvent('update:activeTab', tab)">
            <span class="tab-name" :class="{ 'completed': getTabChallengeStats(tab).remaining === 0 && getTabChallengeStats(tab).total > 0 }">
              {{ tab }}
            </span>
            <span v-if="getTabChallengeStats(tab).remaining > 0" class="challenge-count error">
              {{ getTabChallengeStats(tab).remaining }}
            </span>
            <span v-else-if="getTabChallengeStats(tab).total > 0" class="challenge-count success">
              ✓
            </span>
            <button @click.stop="emitEvent('close-tab', tab)" class="close-tab-btn">×</button>
        </div>
    </div>
    <div id="editor-container" ref="editorContentRef">
      <div id="line-numbers">
        <div v-for="(_, index) in lines" :key="index">{{ index + 1 }}</div>
      </div>
      <div id="code-area">
        <div
          v-for="(line, lineIndex) in lines" :key="lineIndex" :id="`line-${lineIndex}`"
          class="code-line"
          :class="{ 'active-line': lineIndex === activeLineIndex, 'completed-challenge': line.isCompleted }"
          :style="{ '--indent-level': line.indent }"
          @click="setActiveLine(lineIndex)"
        >
          <span class="line-content">
            <span v-for="(token, tokenIndex) in line.tokens" :key="tokenIndex" :class="token.type">
                <template v-if="token.type !== 'typable-challenge'">
                  <span v-if="!line.isTypable && autoCompletionProgress[lineIndex] && autoCompletionProgress[lineIndex].charsCompleted > 0" 
                        class="auto-completed-text">
                    {{ token.text.substring(0, Math.floor(autoCompletionProgress[lineIndex].charsCompleted)) }}
                    <span v-if="autoCompletionProgress[lineIndex].charsCompleted < autoCompletionProgress[lineIndex].totalChars" 
                          class="auto-completion-cursor">|</span>
                  </span>
                  <span v-else>{{ token.text }}</span>
                </template>
                <template v-else>
                   <span v-for="(char, charIndex) in token.text.split('')" :key="charIndex" :class="line.statuses[charIndex]">{{ char }}</span>
                </template>
            </span>
          </span>
          <span v-if="lineIndex === activeLineIndex" class="cursor" :style="{ left: cursorLeftPosition }"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#editor-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-color); }
#editor-tabs { display: flex; background-color: var(--terminal-bg); flex-shrink: 0; }
.tab { background-color: var(--sidebar-bg); padding: 8px 15px; border-right: 1px solid var(--border-color); color: var(--gray); cursor: pointer; display: flex; align-items: center; gap: 8px; }
.tab.active { background-color: var(--bg-color); color: var(--font-color); }
.tab.has-challenges { background-color: rgba(248, 81, 73, 0.2); border-left: 3px solid var(--red); }
.tab.completed { background-color: rgba(63, 185, 80, 0.2); border-left: 3px solid var(--completed-green); }
.tab-name.completed { color: var(--completed-green); font-weight: bold; }
.challenge-count { 
  font-size: 0.75rem; 
  font-weight: bold; 
  padding: 2px 6px; 
  border-radius: 10px; 
  min-width: 16px; 
  text-align: center;
}
.challenge-count.error { 
  background-color: var(--red); 
  color: white; 
}
.challenge-count.success { 
  background-color: var(--completed-green); 
  color: white; 
}
.close-tab-btn { background: none; border: none; color: var(--gray); cursor: pointer; font-size: 1.2rem; padding: 0; line-height: 1; }
#editor-container { flex-grow: 1; display: flex; overflow-y: auto; }
#line-numbers { flex-shrink: 0; padding: 10px; text-align: right; color: var(--gray); font-size: 0.85rem; line-height: 1.5; user-select: none; }
#code-area { padding: 10px 0; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; width: 100%; position: relative; }

.code-line { 
  position: relative; 
  padding: 0 15px;
}

.code-line::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15px;
  width: calc(var(--indent-level, 0) * 2ch);
  height: 100%;
  background-image: repeating-linear-gradient(to right, transparent, transparent calc(2ch - 1px), var(--border-color) calc(2ch - 1px), var(--border-color) 2ch);
  pointer-events: none;
  opacity: 0.6;
}

.line-content {
  padding-left: calc(var(--indent-level, 0) * 2ch);
}

.active-line { background-color: var(--active-line-bg); }
.completed-challenge { cursor: default; }
.completed-challenge span { color: var(--completed-green) !important; opacity: 1 !important; }

.typable-challenge { cursor: pointer; }
.typable-challenge .untyped { color: var(--gray); opacity: var(--faded-words-opacity, 0.45); }
.typable-challenge .correct { color: var(--string); }
.typable-challenge .incorrect { background-color: var(--red); color: #fff !important; border-radius: 2px; }

.cursor {
  position: absolute;
  top: 0;
  height: 1.35rem;
  width: 2px;
  background-color: var(--keyword);
  /* animation: blink 1s steps(1) infinite; */
  pointer-events: none;
  border-radius: 1px;
}

/* @keyframes blink { 50% { opacity: 0; } } */

:global(.token-keyword) { color: var(--keyword); }
:global(.token-function) { color: var(--function); }
:global(.token-string) { color: var(--string); }
:global(.token-comment) { color: var(--comment); }
:global(.token-parameter) { color: var(--parameter); }
:global(.token-number) { color: var(--number); }
:global(.token-operator) { color: var(--font-color); }
:global(.token-default) { color: var(--font-color); }
:global(.token-boolean) { color: var(--constant-color); }

.auto-completed-text {
  color: var(--gray);
  transition: all 0.2s ease;
}

.auto-completion-cursor {
  color: var(--keyword);
  /* animation: blink 1s steps(1) infinite; */
  font-weight: bold;
}
</style>