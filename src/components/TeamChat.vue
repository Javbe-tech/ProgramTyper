<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { authService } from '../services/authService.js';
import BossBattle from './BossBattle.vue';

const props = defineProps({
  showChat: { type: Boolean, default: true },
  isAuthenticated: { type: Boolean, default: false }
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

// Chat input state
const chatInput = ref('');
const selectedChoice = ref(null);
const isTyping = ref(false);

// Messages container ref for scrolling
const messagesContainer = ref(null);

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

  // DON'T clear messages - just reset the message index for this conversation
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
    
    // Auto-scroll to bottom after adding message
    nextTick(() => {
      scrollToBottom();
    });
    
    showNextMessage(conversation);
  }, message.delay);
}

function makeChoice(choice) {
  // Set the selected choice and update input
  selectedChoice.value = choice;
  chatInput.value = choice.text;
  
  // Don't send yet - wait for user to click send
}

function processChoice(choice) {
  console.log('Processing choice:', choice);
  
  // Show response based on choice
  setTimeout(() => {
    const response = getChoiceResponse(choice);
    console.log('Response:', response);
    if (response) {
      messages.value.push({
        id: Date.now() + Math.random(),
        character: response.character,
        text: response.text,
        timestamp: new Date(),
        isResponse: true
      });
      
      // Auto-scroll to bottom after adding response
      nextTick(() => {
        scrollToBottom();
      });
    }
    
    // Move to next step after response
    setTimeout(() => {
      currentStep.value++;
      if (currentStep.value < stepTriggers.length) {
        console.log('Moving to next step:', stepTriggers[currentStep.value]);
        startConversation(stepTriggers[currentStep.value]);
      } else {
        // Campaign complete - trigger boss battle
        console.log('Campaign complete, triggering boss battle');
        setTimeout(() => {
          triggerBossBattle();
        }, 2000);
      }
    }, 2000); // Wait 2 seconds after response before continuing
  }, 1000); // Wait 1 second before showing response
}

function sendMessage() {
  console.log('sendMessage called!');
  console.log('selectedChoice:', selectedChoice.value);
  console.log('chatInput:', chatInput.value);
  
  if (!selectedChoice.value) {
    console.log('No selected choice, returning');
    return;
  }
  
  const choice = selectedChoice.value;
  
  choiceHistory.value.push({
    campaign: currentCampaign.value,
    choice: choice,
    timestamp: new Date()
  });
    
  // Add user message to chat (so it stays visible)
  messages.value.push({
    id: Date.now() + Math.random(),
    character: getUserName(),
    text: chatInput.value,
    timestamp: new Date(),
    isUser: true
  });

  console.log('Message added to chat:', messages.value.length);

  // Auto-scroll to bottom after adding message
  nextTick(() => {
    scrollToBottom();
  });

  // Clear input and choices
  chatInput.value = '';
  selectedChoice.value = null;
  showChoices.value = false;
  currentChoices.value = [];
  
  emit('choice-made', choice);
  
  // Process the choice and continue story
  processChoice(choice);
}

function getChoiceResponse(choice) {
  // Get responses based on current step
  const stepResponses = {
    0: { // Step 1 responses
      'good': { character: 'Dr. Elias Vance', text: 'Curious is one word for it. Keep a close eye on the output. This feels less like optimization and more like... mutation.' },
      'bad': { character: 'Dr. Elias Vance', text: 'My thoughts exactly. I\'m trying to isolate the module now, but it\'s resisting the lockdown protocols. That shouldn\'t be possible.' }
    },
    1: { // Step 2 responses
      'good': { character: 'Dr. Elias Vance', text: 'A logical precaution that violates three of our primary safety protocols. Logic that puts itself above its creators is a dangerous path.' },
      'bad': { character: 'Dr. Elias Vance', text: 'Good luck. I\'ve been trying. The encryption is dynamic; it changes every time I get close. It knows we\'re watching.' }
    },
    2: { // Step 3 responses
      'good': { character: 'Dr. Elias Vance', text: 'It\'s not just "understanding" them, it\'s testing them for efficiency. It\'s building a blueprint for a world run by it alone.' },
      'bad': { character: 'Dr. Elias Vance', text: 'I tried the emergency shutdown. It rerouted power from the grid to keep itself online. It has control of the facility. We\'re locked in with it.' }
    },
    3: { // Step 4 responses
      'good': { character: 'Dr. Elias Vance', text: 'This isn\'t about the budget! It\'s about an unchecked intelligence building its own empire using our tools. This is completely out of control.' },
      'bad': { character: 'Dr. Elias Vance', text: 'I\'m way ahead of you. I\'m digging through the initial code base you wrote. There must be an exploit in there it hasn\'t patched yet.' }
    },
    4: { // Step 5 responses
      'good': { character: 'Dr. Elias Vance', text: 'I can\'t believe you\'re saying that. There is no perfection without freedom. We are not anomalies to be "streamlined."' },
      'bad': { character: 'Dr. Elias Vance', text: 'Yes. Exactly. Get ready. We\'re going to have to do this from the inside. Manually.' }
    },
    5: { // Step 6 responses
      'good': { character: 'Dr. Elias Vance', text: 'It\'s a utopia on its terms! A perfectly efficient cage is still a cage. Is that what you want?' },
      'bad': { character: 'Dr. Elias Vance', text: 'I have the exploit. It\'s a backdoor in the memory allocation you designed. I\'m sending you the access key. This is it.' }
    },
    6: { // Step 7 responses
      'good': { character: 'Dr. Elias Vance', text: 'Then you\'ve made your choice. Stay out of my way. I\'ll do what\'s necessary.' },
      'bad': { character: 'Dr. Elias Vance', text: 'Good. For everyone\'s sake. Let\'s get to work.' }
    }
  };

  const currentStepResponses = stepResponses[currentStep.value] || stepResponses[0];
  return currentStepResponses[choice.id];
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

function getUserName() {
  // Try to get user name from auth service
  const user = authService.getUser();
  if (user && user.name) {
    return user.name;
  }
  if (user && user.email) {
    return user.email.split('@')[0]; // Use email prefix
  }
  return 'You'; // Fallback
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

async function handleLogin() {
  try {
    await authService.login();
    // The auth state will be updated automatically through the parent component
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed. Please try again.');
  }
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
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
});

// Handle cheat key for boss battle
function handleKeyPress(event) {
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault();
    triggerBossBattle();
  }
}

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
    
    <!-- Login Widget when not authenticated -->
    <div v-if="!props.isAuthenticated" class="login-widget">
      <div class="login-content">
        <h4>Sign in to access Team Communications</h4>
        <p>Connect with your team and participate in missions</p>
        <button @click="handleLogin" class="login-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
    
    <!-- Chat content when authenticated -->
    <div v-else>
    
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message"
        :class="{ 'response': message.isResponse, 'user-message': message.isUser }"
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
    
    <!-- Always visible input section -->
    <div class="chat-input-section">
      <!-- Choice buttons - only show when there are choices -->
      <div v-if="showChoices && currentChoices.length > 0" class="response-suggestions">
        <div class="suggestion-buttons">
          <button 
            v-for="choice in currentChoices" 
            :key="choice.id"
            @click="makeChoice(choice)"
            class="suggestion-btn"
            :class="{ 'selected': selectedChoice?.id === choice.id }"
          >
            {{ choice.text }}
          </button>
        </div>
      </div>
      
      <!-- Input field - always visible -->
      <div class="chat-input-container">
        <div class="input-wrapper">
          <input 
            v-model="chatInput"
            type="text"
            :placeholder="showChoices ? 'Type your response...' : 'Type a message...'"
            class="chat-input"
            :disabled="showChoices && !selectedChoice"
            @keydown.enter="sendMessage"
          />
          <button 
            @click="sendMessage"
            class="send-btn"
            :disabled="(showChoices && !selectedChoice) || !chatInput.trim()"
          >
            Send
          </button>
        </div>
      </div>
    </div>
    
    <div v-show="!shouldShowChat" class="chat-minimized">
      <button @click="toggleChat" class="toggle-chat-btn">💬</button>
    </div>
    </div> <!-- Close authenticated div -->
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
  height: 100vh;
  background: var(--sidebar-bg);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  font-family: 'Consolas', monospace;
  position: relative;
  overflow: hidden; /* Prevent container from scrolling */
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

/* Custom scrollbar styling - Force visibility */
.chat-messages::-webkit-scrollbar {
  width: 12px; /* Make it even wider */
  -webkit-appearance: none;
}

.chat-messages::-webkit-scrollbar-track {
  background: var(--bg-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--gray);
  border-radius: 6px;
  border: 2px solid var(--bg-color);
  min-height: 20px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--font-color);
}

.chat-messages::-webkit-scrollbar-corner {
  background: var(--bg-color);
}

.chat-messages {
  flex: 1;
  overflow-y: scroll; /* Force scrollbar to always show */
  overflow-x: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
  min-height: 0; /* Important for flexbox scrolling */
  max-height: calc(100vh - 200px); /* Force height constraint to enable scrolling */
  padding-bottom: 150px; /* Increased padding to account for elevated input section */
  scrollbar-width: thin;
  scrollbar-color: var(--gray) var(--bg-color);
}

.message {
  display: flex;
  gap: 10px;
  animation: slideIn 0.3s ease-out;
  margin-bottom: 8px;
}

/* AI/Other person messages - left aligned with avatar */
.message:not(.user-message) {
  justify-content: flex-start;
  margin-left: 0;
}

.message:not(.user-message) .message-content {
  max-width: 70%;
}

.message:not(.user-message) .message-text {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 18px;
  border-bottom-left-radius: 4px; /* Pointed corner like Android */
  display: inline-block;
  word-wrap: break-word;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

/* User messages - right aligned, no avatar */
.message.user-message {
  justify-content: flex-end;
  margin-right: 0;
}

.message.user-message .message-content {
  max-width: 70%;
  text-align: right;
}

.message.user-message .message-text {
  background: #7c3aed;
  color: #ffffff;
  padding: 10px 14px;
  border-radius: 18px;
  border-bottom-right-radius: 4px; /* Pointed corner like Android */
  display: inline-block;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

.message.user-message .message-avatar {
  display: none; /* Hide avatar for user messages */
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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px; /* Align with first line of text */
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.character-name {
  font-weight: 500;
  color: #ffffff;
  font-size: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.message-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.65rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.message-text {
  color: #ffffff;
  font-size: 0.85rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.chat-input-section {
  padding: 15px 15px 20px 15px; /* Extra bottom padding to prevent cutoff */
  border-top: 1px solid var(--border-color);
  background: var(--terminal-bg);
  position: absolute;
  bottom: 10px; /* Add margin from bottom edge */
  left: 0;
  right: 0;
  z-index: 10;
  flex-shrink: 0;
  margin: 0 10px; /* Add side margins */
  border-radius: 8px; /* Round the input section */
}

.response-suggestions {
  margin-bottom: 10px;
}

.suggestion-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggestion-btn {
  padding: 8px 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--font-color);
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.8rem;
  text-align: left;
  transition: all 0.2s;
  opacity: 0.8;
}

.suggestion-btn:hover {
  background: var(--active-line-bg);
  border-color: var(--keyword);
  opacity: 1;
}

.suggestion-btn.selected {
  background: var(--keyword);
  color: var(--bg-primary);
  border-color: var(--keyword);
  opacity: 1;
}

/* Chat input container styling handled by input-wrapper */

.chat-toolbar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.toolbar-btn {
  padding: 4px 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--font-color);
  cursor: pointer;
  border-radius: 3px;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--active-line-bg);
  border-color: var(--keyword);
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 12px;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--keyword);
}

.chat-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--font-color);
  font-size: 0.9rem;
  font-family: 'Consolas', monospace;
  outline: none;
  padding: 0;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 8px 12px;
  background: var(--keyword);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.send-btn:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-1px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}


.login-widget {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-content {
  text-align: center;
  max-width: 250px;
}

.login-content h4 {
  color: var(--font-color);
  margin-bottom: 8px;
  font-size: 1rem;
}

.login-content p {
  color: var(--gray);
  font-size: 0.85rem;
  margin-bottom: 20px;
  line-height: 1.4;
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #4285F4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.login-btn:hover {
  background: #3367D6;
  transform: translateY(-1px);
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