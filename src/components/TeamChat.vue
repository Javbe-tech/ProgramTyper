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

// Campaign progress tracking
const campaignProgress = reactive({
  chimera: {
  currentStep: 0,
    score: 0,
  completed: false,
    hasUnread: false,
    lastMessageTime: null
  }
});

// Campaign selector state
const campaignSelector = reactive({
  isExpanded: false,
  campaigns: [
    {
      id: 'chimera',
      name: 'Project Chimera',
      icon: '🧬',
      status: 'available'
    },
    {
      id: 'leviathan',
      name: 'The Leviathan',
      icon: '🔒',
      status: 'locked'
    },
    {
      id: 'architect',
      name: 'The Architect',
      icon: '🔒',
      status: 'locked'
    }
  ]
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
  
  // Mark other campaigns as having unread messages
  Object.keys(campaignProgress).forEach(campaignId => {
    if (campaignId !== campaignState.currentCampaign) {
      campaignProgress[campaignId].hasUnread = true;
    }
  });
  
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
  
  // Show response options after a delay (1 second for fast testing)
  setTimeout(() => {
    chatState.responseOptions = [
      { key: 'good', text: interaction.responses.good },
      { key: 'bad', text: interaction.responses.bad }
    ];
  }, 1000);
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
  
  // Add outcome after delay (1 second for fast testing)
  setTimeout(() => {
    addMessage({
      type: 'team-member',
      member: interaction.member,
      message: outcomeText,
      timestamp: new Date()
    });
    
    // Move to next step
    campaignState.value.currentStep++;
    
    // Start next interaction after delay (1 second for fast testing)
    setTimeout(() => {
      startNewInteraction();
    }, 1000);
  }, 1000);
}

// Handle cheat key for boss battle
function handleKeyPress(event) {
  if (event.ctrlKey && event.key === 'b') {
    console.log('Cheat key pressed - triggering boss battle');
    triggerBossBattle();
  }
}

// Toggle campaign selector
function toggleCampaignSelector() {
  campaignSelector.isExpanded = !campaignSelector.isExpanded;
}

// Switch to different campaign
function switchCampaign(campaignId) {
  if (campaignId === campaignState.currentCampaign) {
    campaignSelector.isExpanded = false;
    return;
  }
  
  // Save current progress before switching
  saveCampaignProgress();
  
  // Switch to new campaign
  campaignState.currentCampaign = campaignId;
  campaignState.currentStep = campaignProgress[campaignId]?.currentStep || 0;
  campaignState.score = campaignProgress[campaignId]?.score || 0;
  campaignState.completed = campaignProgress[campaignId]?.completed || false;
  
  // Clear current chat
  chatState.messages = [];
  chatState.currentInteraction = null;
  chatState.responseOptions = [];
  chatState.isWaitingForResponse = false;
  
  // Mark as read
  campaignProgress[campaignId].hasUnread = false;
  
  // Collapse selector
  campaignSelector.isExpanded = false;
  
  // Start the campaign
  if (campaignId === 'chimera') {
    startChimeraCampaign();
  }
}

// Save current campaign progress
function saveCampaignProgress() {
  const currentId = campaignState.currentCampaign;
  if (campaignProgress[currentId]) {
    campaignProgress[currentId].currentStep = campaignState.currentStep;
    campaignProgress[currentId].score = campaignState.score;
    campaignProgress[currentId].completed = campaignState.completed;
    campaignProgress[currentId].lastMessageTime = new Date();
  }
}

// Start Chimera campaign
function startChimeraCampaign() {
  if (campaignState.currentStep === 0) {
    // Fresh start - start immediately
    startNewInteraction();
  } else {
    // Resume from saved progress
    addMessage({
      type: 'system',
      message: `📖 RESUMING PROJECT CHIMERA: Step ${campaignState.currentStep + 1}`,
      timestamp: new Date()
    });
    
    setTimeout(() => {
      startNewInteraction();
    }, 1000);
  }
}

// Start chat system
function startChatSystem() {
  console.log('Starting chat system...');
  
  // Initialize campaign progress if not exists
  if (!campaignProgress.chimera) {
    campaignProgress.chimera = {
      currentStep: 0,
      score: 0,
      completed: false,
      hasUnread: false,
      lastMessageTime: null
    };
  }
  
  // Load saved progress
  campaignState.currentCampaign = 'chimera';
  campaignState.currentStep = campaignProgress.chimera.currentStep;
  campaignState.score = campaignProgress.chimera.score;
  campaignState.completed = campaignProgress.chimera.completed;
  
  chatState.messages = [];
  
  // Start Chimera campaign
  startChimeraCampaign();
}

// Computed properties
const hasUnreadMessages = computed(() => {
  return Object.values(campaignProgress).some(campaign => campaign.hasUnread);
});

const getCurrentCampaignName = () => {
  const campaign = campaignSelector.campaigns.find(c => c.id === campaignState.currentCampaign);
  return campaign ? campaign.name : 'Unknown Campaign';
};

const getCampaignDescription = (campaignId) => {
  const descriptions = {
    chimera: 'AI project gone wrong - Dr. Elias Vance needs help',
    leviathan: 'Deep sea exploration mission - coming soon',
    architect: 'Urban planning conspiracy - coming soon'
  };
  return descriptions[campaignId] || 'Campaign description';
};

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
    <!-- Clean Team Chat Area - Like Original -->
    <div class="chat-area">
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

/* Clean Team Chat Area - Like Original */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
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
