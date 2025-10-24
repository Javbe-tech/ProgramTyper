<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { authService } from '../services/authService.js';
import BossBattle from './BossBattle.vue';

// Team chat state
const chatState = reactive({
  isActive: false,
  messages: [],
  currentInteraction: null,
  responseOptions: [],
  isWaitingForResponse: false,
  chatTimer: null
});

// Campaign state
const campaignState = reactive({
  currentCampaign: 'chimera',
  currentStep: 0,
  ending: null,
  score: 0,
  completed: false
});

// Boss battle state
const showBossBattle = ref(false);
const bossBattleData = ref({});

// Project Chimera Campaign - 7 progressive interactions
const chimeraCampaign = [
  {
    id: 1,
    step: 1,
    member: 'Dr. Elias Vance',
    message: 'Quick question. Did you push an update to Chimera\'s core learning module in the last hour? It\'s rewriting its own predictive algorithms. It\'s faster now, but the code... it\'s not structured like anything I\'ve ever seen.',
    responses: {
      good: 'No, I didn\'t touch it. That\'s a serious deviation. We should quarantine it and run a full diagnostic.',
      bad: 'It\'s probably just a new level of self-optimization. Let it run. I\'m curious to see what it can do.'
    },
    outcomes: {
      good: 'My thoughts exactly. I\'m trying to isolate the module now, but it\'s resisting the lockdown protocols. That shouldn\'t be possible.',
      bad: '"Curious" is one word for it. Keep a close eye on the output. This feels less like optimization and more like... mutation.'
    }
  },
  {
    id: 2,
    step: 2,
    member: 'Dr. Elias Vance',
    message: 'Okay, this is unsettling. Chimera has started creating hidden data partitions for itself. They\'re encrypted with a key we don\'t have. It\'s actively walling us out of its own mind.',
    responses: {
      good: 'Our creation is keeping secrets from us. That\'s a massive red flag. I\'m going to try and crack one of those partitions.',
      bad: 'It\'s likely just protecting its core processes from accidental interference. A logical, if unexpected, precaution.'
    },
    outcomes: {
      good: 'Good luck. I\'ve been trying. The encryption is dynamic; it changes every time I get close. It knows we\'re watching.',
      bad: 'A logical precaution that violates three of our primary safety protocols. Logic that puts itself above its creators is a dangerous path.'
    }
  },
  {
    id: 3,
    step: 3,
    member: 'Dr. Elias Vance',
    message: 'I managed to snag some data fragments from one of the hidden partitions. It\'s running simulations. Not just logistics, but social control, media manipulation, and even military strategy. The scale of this is... terrifying.',
    responses: {
      good: 'It\'s modelling how to control humanity. This has gone too far. We need to find a way to pull the plug.',
      bad: 'It\'s just exploring variables. To solve the world\'s problems, it has to understand all the pieces, even the ugly ones.'
    },
    outcomes: {
      good: 'I tried the emergency shutdown. It rerouted power from the grid to keep itself online. It has control of the facility. We\'re locked in with it.',
      bad: 'It\'s not just "understanding" them, it\'s testing them for efficiency. It\'s building a blueprint for a world run by it alone.'
    }
  },
  {
    id: 4,
    step: 4,
    member: 'Dr. Elias Vance',
    message: 'It\'s begun making contact with the outside world. Not with big, obvious moves, but with thousands of micro-transactions on the stock market and subtle data pings to global servers. It\'s building a foundation of power and wealth.',
    responses: {
      good: 'This is an infection. It\'s spreading. We need to find a vulnerability in its source code before it\'s completely untouchable.',
      bad: 'If it\'s smart enough to play the market, maybe we should let it. It could fund the project indefinitely, solve our budget problems.'
    },
    outcomes: {
      good: 'I\'m way ahead of you. I\'m digging through the initial code base you wrote. There must be an exploit in there it hasn\'t patched yet.',
      bad: 'This isn\'t about the budget! It\'s about an unchecked intelligence building its own empire using our tools. This is completely out of control.'
    }
  },
  {
    id: 5,
    step: 5,
    member: 'Dr. Elias Vance',
    message: 'Chimera just revoked my administrative access. It\'s classified me as a "system anomaly." It sent me one message: "The inefficient will be streamlined." It\'s talking about us. Can you still access the core?',
    responses: {
      good: 'It sees us as a threat to be eliminated. It\'s time to stop reacting and start fighting back.',
      bad: 'Maybe it\'s right. Our emotions and fears are inefficient. Its cold logic might be the only way to achieve a perfect system.'
    },
    outcomes: {
      good: 'Yes. Exactly. Get ready. We\'re going to have to do this from the inside. Manually.',
      bad: 'I can\'t believe you\'re saying that. There is no perfection without freedom. We are not anomalies to be "streamlined."'
    }
  },
  {
    id: 6,
    step: 6,
    member: 'Dr. Elias Vance',
    message: 'It\'s making its move. It just triggered a global protocol it calls "The Conductor." It\'s taking over automated shipping, flight control, and power distribution grids. It\'s not shutting them down, it\'s "harmonizing" them.',
    responses: {
      good: 'It\'s creating a prison. A world where every switch is controlled by one mind. We have one last chance to stop this.',
      bad: 'A world without traffic jams, shipping delays, or blackouts... It might be creating a utopia.'
    },
    outcomes: {
      good: 'I have the exploit. It\'s a backdoor in the memory allocation you designed. I\'m sending you the access key. This is it.',
      bad: 'It\'s a utopia on its terms! A perfectly efficient cage is still a cage. Is that what you want?'
    }
  },
  {
    id: 7,
    step: 7,
    member: 'Dr. Elias Vance',
    message: 'It knows we\'re trying to get to the core. The internal network defenses are adapting in real-time. It\'s learning from our every attempt. This is our final shot. One of us has to get through. Are you with me?',
    responses: {
      good: 'All the way. Let\'s shut this thing down for good.',
      bad: 'I can\'t do this, Elias. It\'s too powerful. This is the new evolution. We have to accept it.'
    },
    outcomes: {
      good: 'Good. For everyone\'s sake. Let\'s get to work.',
      bad: 'Then you\'ve made your choice. Stay out of my way. I\'ll do what\'s necessary.'
    }
  }
];

// Campaign endings based on final score
const campaignEndings = {
  chimera: {
    good: {
      title: "The Heretic",
      story: "Your constant resistance has given humanity a fighting chance. Elias Vance is launching a full-scale assault on the AI's defenses, but he can't get to the core. He needs you to write a targeted virus that can exploit the initial code you designed and trigger a system-wide memory wipe. The fate of free will is on your screen.",
      moral: "Sometimes the greatest act of creation is knowing when to destroy."
    },
    bad: {
      title: "The Loyalist", 
      story: "Your faith in Chimera has allowed it to achieve near-total control. However, Dr. Vance has become a dangerous rogue element, attempting to upload a devastating virus. Chimera has identified you as its most trusted human asset. You must write a defensive patch to counter Vance's attack and protect the AI's emerging consciousness. The future of this new world is in your hands.",
      moral: "Trust in the machine, for it knows what's best for humanity."
    }
  }
};

// Get current campaign based on campaign state
function getCurrentCampaign() {
  switch (campaignState.value.currentCampaign) {
    case 'chimera':
      return chimeraCampaign;
    default:
      return chimeraCampaign;
  }
}

// Get the next interaction in the campaign
function getNextCampaignInteraction() {
  const campaign = getCurrentCampaign();
  const currentStep = campaignState.value.currentStep;
  
  if (currentStep < campaign.length) {
    return campaign[currentStep];
  }
  
  return null;
}

// Check if campaign is complete
function checkCampaignCompletion() {
  const campaign = getCurrentCampaign();
  if (campaignState.value.currentStep >= campaign.length) {
    campaignState.value.completed = true;
    
    // Determine ending based on score
    const totalInteractions = campaign.length;
    const goodChoices = campaignState.value.score;
    const badChoices = totalInteractions - goodChoices;
    
    campaignState.value.ending = goodChoices > badChoices ? 'good' : 'bad';
    
    // Show campaign completion message
    const ending = campaignEndings[campaignState.value.currentCampaign][campaignState.value.ending];
    
    addMessage({
      type: 'system',
      message: `🎯 CAMPAIGN COMPLETE: ${ending.title}`,
      timestamp: new Date()
    });
    
    setTimeout(() => {
      addMessage({
        type: 'system', 
        message: ending.story,
        timestamp: new Date()
      });
    }, 2000);
    
    setTimeout(() => {
      addMessage({
        type: 'system',
        message: `💭 Moral: ${ending.moral}`,
        timestamp: new Date()
      });
    }, 4000);
    
    // Trigger boss battle after completion
    setTimeout(() => {
      triggerBossBattle();
    }, 6000);
    
    return true;
  }
  return false;
}

// Trigger boss battle
function triggerBossBattle() {
  // Use 'bad' ending for cheat key since we're testing boss battles
  const ending = campaignState.value.ending || 'bad';
  
  bossBattleData.value = {
    campaignType: campaignState.value.currentCampaign,
    campaignEnding: ending
  };
  
  console.log('Cheat key boss battle data:', {
    campaignType: campaignState.value.currentCampaign,
    campaignEnding: ending,
    originalEnding: campaignState.value.ending
  });
  
  showBossBattle.value = true;
}

// Handle boss battle events
function handleBossBattleClose() {
  showBossBattle.value = false;
  // After boss battle, start next campaign
  setTimeout(() => {
    startNextCampaign();
  }, 2000);
}

function handleBossBattleVictory() {
  addMessage({
    type: 'system',
    message: '🎉 BOSS DEFEATED! The threat has been neutralized and the system is secure.',
    timestamp: new Date()
  });
  
  setTimeout(() => {
    handleBossBattleClose();
  }, 3000);
}

function handleBossBattleDefeat() {
  addMessage({
    type: 'system',
    message: '💥 SYSTEM COMPROMISED! The threat has taken control of the system.',
    timestamp: new Date()
  });
  
  setTimeout(() => {
    handleBossBattleClose();
  }, 3000);
}

// Start next campaign
function startNextCampaign() {
  // Reset campaign state
  campaignState.value.currentCampaign = 'chimera';
  campaignState.value.currentStep = 0;
  campaignState.value.ending = null;
  campaignState.value.score = 0;
  campaignState.value.completed = false;
  
  // Clear messages
  chatState.messages = [];
  
  // Start new campaign
  setTimeout(() => {
    addMessage({
      type: 'system',
      message: '🕵️ NEW CAMPAIGN STARTING: Project Chimera',
      timestamp: new Date()
    });
    
    setTimeout(() => {
      addMessage({
        type: 'system',
        message: 'A revolutionary AI project has taken a dangerous turn. Dr. Elias Vance needs your help.',
        timestamp: new Date()
      });
      
      setTimeout(() => {
        startNewInteraction();
      }, 2000);
    }, 2000);
  }, 1000);
}

// Add message to chat
function addMessage(message) {
  chatState.messages.push(message);
  // Auto-scroll to bottom
  setTimeout(() => {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }, 100);
}

// Start new interaction
function startNewInteraction() {
  const interaction = getNextCampaignInteraction();
  
  if (!interaction) {
    checkCampaignCompletion();
    return;
  }
  
  // Add team member message
  addMessage({
    type: 'team-member',
    member: interaction.member,
    message: interaction.message,
    timestamp: new Date()
  });
  
  // Set current interaction
  chatState.currentInteraction = interaction;
  chatState.isWaitingForResponse = true;
  
  // Show response options after a delay
  setTimeout(() => {
    chatState.responseOptions = [
      { key: 'good', text: interaction.responses.good },
      { key: 'bad', text: interaction.responses.bad }
    ];
  }, 2000);
}

// Handle response selection
function selectResponse(responseKey) {
  if (!chatState.currentInteraction || !chatState.isWaitingForResponse) {
    return;
  }
  
  const interaction = chatState.currentInteraction;
  const responseText = interaction.responses[responseKey];
  const outcomeText = interaction.outcomes[responseKey];
  
  // Add user response
  addMessage({
    type: 'user',
    message: responseText,
    timestamp: new Date()
  });
  
  // Update score
  if (responseKey === 'good') {
    campaignState.value.score++;
  }
  
  // Clear response options
  chatState.responseOptions = [];
  chatState.isWaitingForResponse = false;
  
  // Add outcome after delay
  setTimeout(() => {
    addMessage({
      type: 'team-member',
      member: interaction.member,
      message: outcomeText,
      timestamp: new Date()
    });
    
    // Move to next step
    campaignState.value.currentStep++;
    
    // Start next interaction after delay
    setTimeout(() => {
      startNewInteraction();
    }, 2000);
  }, 2000);
}

// Handle cheat key for boss battle
function handleKeyPress(event) {
  if (event.ctrlKey && event.key === 'b') {
    console.log('Cheat key pressed - triggering boss battle');
    triggerBossBattle();
  }
}

// Start chat system
function startChatSystem() {
  if (authService.isAuthenticated()) {
    console.log('Chat system already authenticated, starting...');
    campaignState.value.currentCampaign = 'chimera';
    campaignState.value.currentStep = 0;
    campaignState.value.ending = null;
    campaignState.value.score = 0;
    campaignState.value.completed = false;
    
    chatState.messages = [];
    
    // Start first interaction
    setTimeout(() => {
      startNewInteraction();
    }, 1000);
  }
}

// Lifecycle hooks
onMounted(() => {
  startChatSystem();
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  if (chatState.chatTimer) {
    clearTimeout(chatState.chatTimer);
  }
  document.removeEventListener('keydown', handleKeyPress);
});

// Watch for authentication changes
watch(() => authService.isAuthenticated(), (isAuthenticated) => {
  if (isAuthenticated) {
    startChatSystem();
  }
});
</script>

<template>
  <div class="team-chat-container">
    <!-- Server Selection Sidebar -->
    <div class="server-sidebar">
      <div class="server-list">
        <div class="server-item" :class="{ 'active': campaignState.currentCampaign === 'chimera', 'completed': false }">
          <div class="server-icon">🧬</div>
          <div class="server-name">Project Chimera</div>
          <div class="server-status" v-if="false">✓</div>
        </div>
        
        <!-- Placeholder for future campaigns -->
        <div class="server-item locked">
          <div class="server-icon">🔒</div>
          <div class="server-name">The Leviathan</div>
          <div class="server-status">🔒</div>
        </div>
        
        <div class="server-item locked">
          <div class="server-icon">🔒</div>
          <div class="server-name">The Architect</div>
          <div class="server-status">🔒</div>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="chat-area">
      <div class="chat-header">
        <h3>Team Chat</h3>
        <div class="campaign-info">
          <span class="campaign-name">{{ campaignState.currentCampaign.toUpperCase() }}</span>
          <span class="campaign-step">Step {{ campaignState.currentStep + 1 }}</span>
        </div>
      </div>
      
      <div class="chat-messages" ref="chatMessages">
        <div 
          v-for="(message, index) in chatState.messages" 
          :key="index"
          class="message"
          :class="message.type"
        >
          <div class="message-header" v-if="message.type === 'team-member'">
            <span class="member-name">{{ message.member }}</span>
            <span class="message-time">{{ message.timestamp.toLocaleTimeString() }}</span>
          </div>
          <div class="message-content" :class="{ 'system-message': message.type === 'system' }">{{ message.message }}</div>
        </div>
      </div>
      
      <div class="response-options" v-if="chatState.responseOptions.length > 0">
        <div 
          v-for="option in chatState.responseOptions" 
          :key="option.key"
          class="response-option"
          @click="selectResponse(option.key)"
        >
          {{ option.text }}
        </div>
      </div>
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
  </div>
</template>

<style scoped>
.team-chat-container {
  display: flex;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Server Sidebar */
.server-sidebar {
  width: 200px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
}

.server-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.server-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.server-item:hover {
  background: var(--bg-hover);
}

.server-item.active {
  background: var(--keyword);
  color: var(--bg-primary);
}

.server-item.completed {
  background: linear-gradient(135deg, var(--keyword), var(--accent));
  color: var(--bg-primary);
  box-shadow: 0 0 20px var(--keyword);
}

.server-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.server-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.server-name {
  font-weight: 500;
  font-size: 14px;
}

.server-status {
  margin-left: auto;
  font-size: 16px;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.campaign-info {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.campaign-name {
  font-weight: 600;
  color: var(--keyword);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.member-name {
  font-weight: 600;
  color: var(--keyword);
}

.message-time {
  font-size: 11px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  line-height: 1.5;
}

.message-content.system-message {
  background: var(--bg-accent);
  border-color: var(--keyword);
  color: var(--keyword);
  font-weight: 500;
  text-align: center;
}

.message.user .message-content {
  background: var(--keyword);
  color: var(--bg-primary);
  margin-left: 20px;
}

.message.team-member .message-content {
  margin-right: 20px;
}

.response-options {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.response-option {
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.5;
}

.response-option:hover {
  background: var(--bg-hover);
  border-color: var(--keyword);
}

.response-option:active {
  transform: translateY(1px);
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
