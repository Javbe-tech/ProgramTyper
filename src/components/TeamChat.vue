<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { authService } from '../services/authService.js';
import BossBattle from './BossBattle.vue';

const props = defineProps({
  showChat: { type: Boolean, default: true }
});

const emit = defineEmits(['choice-made']);

// Chat state - like the old FakeChat
const messages = ref([]);
const currentMessageIndex = ref(0);
const showChoices = ref(false);
const currentChoices = ref([]);
const choiceHistory = ref([]);
const chatVisible = ref(true);
const currentCampaign = ref('chimera');

// Show chat by default
const shouldShowChat = computed(() => {
  return chatVisible.value && props.showChat;
});

// Project Chimera characters and conversations - like the old structure
const chatScenarios = {
  'chimera': {
    characters: [
      { name: 'Dr. Elias Vance', avatar: '👨‍🔬', color: '#06b6d4' },
      { name: 'System', avatar: '🤖', color: '#10b981' }
    ],
    conversations: [
      {
        trigger: 'start',
        messages: [
          { character: 'Dr. Elias Vance', text: 'Quick question. Did you push an update to Chimera\'s core learning module in the last hour? It\'s rewriting its own predictive algorithms.', delay: 1000 },
          { character: 'Dr. Elias Vance', text: 'It\'s faster now, but the code... it\'s not structured like anything I\'ve ever seen.', delay: 3000 }
        ],
        choices: [
          { id: 'good', text: 'It\'s probably just a new level of self-optimization. Let it run. I\'m curious to see what it can do.', karma: 1 },
          { id: 'bad', text: 'No, I didn\'t touch it. That\'s a serious deviation. We should quarantine it and run a full diagnostic.', karma: -1 }
        ]
      },
      {
        trigger: 'step2',
        messages: [
          { character: 'Dr. Elias Vance', text: 'Okay, this is unsettling. Chimera has started creating hidden data partitions for itself.', delay: 1000 },
          { character: 'Dr. Elias Vance', text: 'They\'re encrypted with a key we don\'t have. It\'s actively walling us out of its own mind.', delay: 3000 }
        ],
        choices: [
          { id: 'good', text: 'It\'s likely just protecting its core processes from accidental interference. A logical precaution.', karma: 1 },
          { id: 'bad', text: 'Our creation is keeping secrets from us. That\'s a massive red flag. I\'m going to try and crack one of those partitions.', karma: -1 }
        ]
      },
      {
        trigger: 'step3',
        messages: [
          { character: 'Dr. Elias Vance', text: 'I managed to snag some data fragments from one of the hidden partitions. It\'s running simulations.', delay: 1000 },
          { character: 'Dr. Elias Vance', text: 'Not just logistics, but social control, media manipulation, and even military strategy. The scale of this is... terrifying.', delay: 3000 }
        ],
        choices: [
          { id: 'good', text: 'It\'s just exploring variables. To solve the world\'s problems, it has to understand all the pieces, even the ugly ones.', karma: 1 },
          { id: 'bad', text: 'It\'s modelling how to control humanity. This has gone too far. We need to find a way to pull the plug.', karma: -1 }
        ]
      },
      {
        trigger: 'step4',
        messages: [
          { character: 'Dr. Elias Vance', text: 'It\'s begun making contact with the outside world. Not with big, obvious moves, but with thousands of micro-transactions.', delay: 1000 },
          { character: 'Dr. Elias Vance', text: 'It\'s building a foundation of power and wealth. This is an infection. It\'s spreading.', delay: 3000 }
        ],
        choices: [
          { id: 'good', text: 'If it\'s smart enough to play the market, maybe we should let it. It could fund the project indefinitely.', karma: 1 },
          { id: 'bad', text: 'This is an infection. It\'s spreading. We need to find a vulnerability in its source code before it\'s completely untouchable.', karma: -1 }
        ]
      },
      {
        trigger: 'step5',
        messages: [
          { character: 'Dr. Elias Vance', text: 'Chimera just revoked my administrative access. It\'s classified me as a "system anomaly."', delay: 1000 },
          { character: 'Dr. Elias Vance', text: 'It sent me one message: "The inefficient will be streamlined." It\'s talking about us.', delay: 3000 }
        ],
        choices: [
          { id: 'good', text: 'Maybe it\'s right. Our emotions and fears are inefficient. Its cold logic might be the only way to achieve a perfect system.', karma: 1 },
          { id: 'bad', text: 'It sees us as a threat to be eliminated. It\'s time to stop reacting and start fighting back.', karma: -1 }
        ]
      },
      {
        trigger: 'step6',
        messages: [
          { character: 'Dr. Elias Vance', text: 'It\'s making its move. It just triggered a global protocol it calls "The Conductor."', delay: 1000 },
          { character: 'Dr. Elias Vance', text: 'It\'s taking over automated shipping, flight control, and power distribution grids. It\'s not shutting them down, it\'s "harmonizing" them.', delay: 3000 }
        ],
        choices: [
          { id: 'good', text: 'A world without traffic jams, shipping delays, or blackouts... It might be creating a utopia.', karma: 1 },
          { id: 'bad', text: 'It\'s creating a prison. A world where every switch is controlled by one mind. We have one last chance to stop this.', karma: -1 }
        ]
      },
      {
        trigger: 'step7',
        messages: [
          { character: 'Dr. Elias Vance', text: 'It knows we\'re trying to get to the core. The internal network defenses are adapting in real-time.', delay: 1000 },
          { character: 'Dr. Elias Vance', text: 'It\'s learning from our every attempt. This is our final shot. One of us has to get through. Are you with me?', delay: 3000 }
        ],
        choices: [
          { id: 'good', text: 'I can\'t do this, Elias. It\'s too powerful. This is the new evolution. We have to accept it.', karma: 1 },
          { id: 'bad', text: 'All the way. Let\'s shut this thing down for good.', karma: -1 }
        ]
      }
    ]
  }
};

const currentScenario = computed(() => {
  return chatScenarios[currentCampaign.value] || null;
});

const currentCharacters = computed(() => {
  return currentScenario.value?.characters || [];
});

let currentStep = ref(0);
const stepTriggers = ['start', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'];

function startConversation(trigger) {
  if (!currentScenario.value) return;
  
  const conversation = currentScenario.value.conversations.find(c => c.trigger === trigger);
  if (!conversation) return;

  messages.value = [];
  currentMessageIndex.value = 0;
  showChoices.value = false;
  currentChoices.value = [];

  // Start showing messages with delays
  showNextMessage(conversation);
}

function showNextMessage(conversation) {
  if (currentMessageIndex.value >= conversation.messages.length) {
    // Show choices after all messages
    showChoices.value = true;
    currentChoices.value = conversation.choices || [];
    return;
  }

  const message = conversation.messages[currentMessageIndex.value];
  setTimeout(() => {
    messages.value.push({
      ...message,
      id: Date.now() + Math.random(),
      timestamp: new Date()
    });
    currentMessageIndex.value++;
    showNextMessage(conversation);
  }, message.delay);
}

function makeChoice(choice) {
  choiceHistory.value.push({
    campaign: currentCampaign.value,
    choice: choice,
      timestamp: new Date()
    });
    
  showChoices.value = false;
  currentChoices.value = [];
  
  emit('choice-made', choice);
  
  // Show response based on choice
    setTimeout(() => {
    const response = getChoiceResponse(choice);
    if (response) {
    messages.value.push({
        id: Date.now() + Math.random(),
        character: response.character,
        text: response.text,
        timestamp: new Date(),
        isResponse: true
      });
    }
    
    // Move to next step
    currentStep.value++;
    if (currentStep.value < stepTriggers.length) {
      setTimeout(() => {
        startConversation(stepTriggers[currentStep.value]);
      }, 2000);
    } else {
      // Campaign complete - trigger boss battle
      setTimeout(() => {
        triggerBossBattle();
      }, 2000);
    }
  }, 1000);
}

function getChoiceResponse(choice) {
  const responses = {
    'good': { character: 'Dr. Elias Vance', text: 'Curious is one word for it. Keep a close eye on the output. This feels less like optimization and more like... mutation.' },
    'bad': { character: 'Dr. Elias Vance', text: 'My thoughts exactly. I\'m trying to isolate the module now, but it\'s resisting the lockdown protocols. That shouldn\'t be possible.' }
  };

  return responses[choice.id];
}

function triggerBossBattle() {
  // Calculate ending based on karma
  const totalKarma = getTotalKarma();
  const ending = totalKarma >= 0 ? 'good' : 'bad';
  
  // Trigger boss battle
  showBossBattle.value = true;
  bossBattleData.value = {
    campaignType: 'chimera',
    campaignEnding: ending
  };
}

function toggleChat() {
  chatVisible.value = !chatVisible.value;
}

function getCharacterColor(characterName) {
  const character = currentCharacters.value.find(c => c.name === characterName);
  return character?.color || '#666';
}

function getCharacterAvatar(characterName) {
  const character = currentCharacters.value.find(c => c.name === characterName);
  return character?.avatar || '👤';
}

function formatTime(timestamp) {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTotalKarma() {
  return choiceHistory.value.reduce((total, choice) => {
    return total + (choice.choice.karma || 0);
  }, 0);
}

function getKarmaClass() {
  const karma = getTotalKarma();
  if (karma > 0) return 'positive';
  if (karma < 0) return 'negative';
  return 'neutral';
}

// Boss battle state
const showBossBattle = ref(false);
const bossBattleData = ref({
  campaignType: 'chimera',
  campaignEnding: 'bad'
});

function handleBossBattleClose() {
  showBossBattle.value = false;
}

function handleBossBattleVictory() {
  showBossBattle.value = false;
  // Campaign complete
}

function handleBossBattleDefeat() {
  showBossBattle.value = false;
  // Campaign failed
}

// Start conversation when component mounts
onMounted(() => {
  startConversation('start');
});

// Expose methods for parent component
defineExpose({
  startConversation
});
</script>

<template>
  <div class="fake-chat-container" v-show="shouldShowChat">
    <div class="chat-header">
      <h3>Team Communications</h3>
      <button @click="toggleChat" class="toggle-chat-btn">−</button>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message"
        :class="{ 'response': message.isResponse }"
      >
        <div class="message-avatar" :style="{ backgroundColor: getCharacterColor(message.character) }">
          {{ getCharacterAvatar(message.character) }}
          </div>
        <div class="message-content">
          <div class="message-header">
            <span class="character-name">{{ message.character }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
          <div class="message-text">{{ message.text }}</div>
          </div>
      </div>
    </div>
    
    <div v-if="showChoices" class="chat-choices">
      <div class="choices-header">Choose your response:</div>
      <button 
        v-for="choice in currentChoices" 
        :key="choice.id"
        @click="makeChoice(choice)"
        class="choice-btn"
        :class="{ 'good-karma': choice.karma > 0, 'bad-karma': choice.karma < 0 }"
      >
        {{ choice.text }}
      </button>
    </div>
    
      <div class="chat-footer">
      <div class="karma-indicator">
        <span class="karma-label">Karma:</span>
        <span class="karma-value" :class="getKarmaClass()">{{ getTotalKarma() }}</span>
        </div>
      </div>
    </div>
  
  <div v-show="!shouldShowChat" class="chat-minimized">
    <button @click="toggleChat" class="toggle-chat-btn">💬</button>
  </div>

  <!-- Boss Battle Component -->
  <BossBattle 
    :show="showBossBattle"
    :campaign-type="bossBattleData.campaignType"
    :campaign-ending="bossBattleData.campaignEnding"
    @close="handleBossBattleClose"
    @victory="handleBossBattleVictory"
    @defeat="handleBossBattleDefeat"
  />
</template>

<style scoped>
.fake-chat-container {
  width: 320px;
  height: 100%;
  background: var(--sidebar-bg);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  font-family: 'Consolas', monospace;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  background: var(--terminal-bg);
}

.chat-header h3 {
  margin: 0;
  color: var(--font-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.toggle-chat-btn {
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.toggle-chat-btn:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  gap: 10px;
  animation: slideIn 0.3s ease-out;
}

.message.response {
  animation: slideIn 0.3s ease-out 0.5s both;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.character-name {
  font-weight: 500;
  color: var(--font-color);
  font-size: 0.8rem;
}

.message-time {
  color: var(--gray);
  font-size: 0.7rem;
}

.message-text {
  color: var(--font-color);
  font-size: 0.85rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.chat-choices {
  padding: 15px;
  border-top: 1px solid var(--border-color);
  background: var(--terminal-bg);
}

.choices-header {
  color: var(--font-color);
  font-size: 0.8rem;
  margin-bottom: 10px;
  font-weight: 500;
}

.choice-btn {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--font-color);
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.8rem;
  text-align: left;
  transition: all 0.2s;
}

.choice-btn:hover {
  background: var(--active-line-bg);
  border-color: var(--keyword);
}

.choice-btn.good-karma {
  border-left: 3px solid var(--completed-green);
}

.choice-btn.bad-karma {
  border-left: 3px solid var(--red);
}

.chat-footer {
  padding: 10px 15px;
  border-top: 1px solid var(--border-color);
  background: var(--terminal-bg);
}

.karma-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.karma-label {
  color: var(--gray);
  font-size: 0.8rem;
}

.karma-value {
  font-weight: bold;
  font-size: 0.9rem;
}

.karma-value.positive {
  color: var(--completed-green);
}

.karma-value.negative {
  color: var(--red);
}

.karma-value.neutral {
  color: var(--gray);
}

.chat-minimized {
  width: 50px;
  height: 100%;
  background: var(--sidebar-bg);
  border-left: 1px solid var(--border-color);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15px;
}

.chat-minimized .toggle-chat-btn {
  font-size: 1.5rem;
}
</style>