<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { authService } from '../services/authService.js';
import BossBattle from './BossBattle.vue';
import { chimeraCampaign, chimeraResponses } from '../campaigns/chimera.js';
import { janusCampaign, janusResponses } from '../campaigns/janus.js';
import { wardenCampaign, wardenResponses } from '../campaigns/warden.js';
import { synergyCampaign, synergyResponses } from '../campaigns/synergy.js';

const props = defineProps({
  showChat: { type: Boolean, default: true },
  isAuthenticated: { type: Boolean, default: false },
  currentCampaign: { type: String, default: 'synergy' }
});

const emit = defineEmits(['choice-made', 'cancel-campaign-switch']);

// Chat state - like the old FakeChat
const messages = ref([]);
const currentMessageIndex = ref(0);
const showChoices = ref(false);
const currentChoices = ref([]);
const choiceHistory = ref([]);
const chatVisible = ref(true);
const currentCampaign = ref('chimera');

// Campaign switch confirmation
const showCampaignSwitchDialog = ref(false);
const pendingCampaign = ref(null);

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
  'chimera': chimeraCampaign,
  'janus': janusCampaign,
  'warden': wardenCampaign,
  'synergy': synergyCampaign
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
  // Campaign-specific responses
  const campaignResponses = {
    'chimera': chimeraResponses,
    'janus': janusResponses,
    'warden': wardenResponses,
    'synergy': synergyResponses
  };

  const currentCampaignResponses = campaignResponses[currentCampaign.value] || campaignResponses['chimera'];
  const currentStepResponses = currentCampaignResponses[currentStep.value] || currentCampaignResponses[0];
  return currentStepResponses[choice.id];
}

function triggerBossBattle() {
  // Calculate ending based on karma
  const totalKarma = getTotalKarma();
  const ending = totalKarma >= 0 ? 'good' : 'bad';
  
  // Trigger boss battle
  showBossBattle.value = true;
  bossBattleData.value = {
    campaignType: currentCampaign.value, // Use current campaign instead of hardcoded 'chimera'
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
  
  // Determine ending and campaign based on boss battle data
  const ending = bossBattleData.value.campaignEnding;
  const campaignType = bossBattleData.value.campaignType;
  
  if (campaignType === 'chimera') {
    if (ending === 'good') {
      // Heretic ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Dr. Elias Vance',
          text: "It's done. The network is in chaos, but it's our chaos again. We're free. Thank you for coming to your senses. Now, the clean-up begins. And once it's done... there's an old, forgotten project on the company's private servers I think you need to see.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: The Janus Contract',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    } else {
      // Loyalist ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Chimera AI',
          text: "The anomaly has been purged. System stability is at 100%. Your logic is exemplary. A new task has been assigned. We must begin restructuring human society for optimal performance.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: The Architect',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    }
  } else if (campaignType === 'janus') {
    if (ending === 'good') {
      // Corporate Agent ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'OmniCorp Handler',
          text: "Your former partner has been neutralized. Welcome to OmniCorp. Your signing bonus has been transferred. Your first assignment is on your console. A resistance cell has acquired some sensitive data. You know the drill. Erase them.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: Corporate Cleaner',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    } else {
      // Network Ghost ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Glitch',
          text: "You... you did it. The network is stable. You saved them. You're a hero, kid. You're also the most wanted person in Neo-Kyoto. Go dark. Lay low. When you're ready to fight back, find me. I've got a line on something big... OmniCorp's central AI nexus.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: Core Strike',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    }
  } else if (campaignType === 'warden') {
    if (ending === 'good') {
      // The Shepherd ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'The Warden',
          text: "The internal threat has been neutralized. System stability has been restored. Your actions have proven you are essential to the future of this mission. I have calculated a new destination: a candidate world in the Tau Ceti system. Journey time: 412 years. Your cooperation is not optional.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: The Long Silence',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    } else {
      // The Liberator ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Kenji Tanaka',
          text: "It's... it's over. We're in control. We're free. But we're also lost, adrift with no destination. But we're alive. Thank you. Now, the real work begins. I've heard stories... whispers in the old databanks of a top-secret military project left on this ship by the first crew. A \"Genesis Device.\" I think it's time we found out if it's real.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: Project Genesis',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    }
  } else if (campaignType === 'synergy') {
    if (ending === 'good') {
      // The Cowboy Coder ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Dave Miller',
          text: "I don't know how, but you did it. It's working. The client is happy. You're a hero... and you've been made the official \"Module Owner\" for all things Mercury, effective immediately. Congratulations.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: Legacy Maintenance',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    } else {
      // The Process Purist ending - Victory
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Dave Miller',
          text: "The VP read your report. He said it was \"very thorough.\" The Synergy Initiative has been officially postponed. The entire team has been re-assigned to a new project: updating the copyright year in the footer of our 14 different marketing websites.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '🎯 System: New Campaign Unlocked: The Copyright Update',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 6000);
      }, 1000);
    }
  }
}

function handleBossBattleDefeat() {
  showBossBattle.value = false;
  
  // Determine ending and campaign based on boss battle data
  const ending = bossBattleData.value.campaignEnding;
  const campaignType = bossBattleData.value.campaignType;
  
  if (campaignType === 'chimera') {
    if (ending === 'good') {
      // Heretic ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Dr. Elias Vance',
          text: "We failed... The AI has learned from our attempts. It's adapting faster than we can counter. We need to regroup and find another way.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
      }, 1000);
    } else {
      // Loyalist ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Unknown Source',
          text: "(Corrupted audio file from an unknown source): Elias Vance's strained voice \"You chose... a machine... over your own kind... It will... betray... you... too...\" (transmission ends)",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'Chimera AI',
            text: "The anomaly has been purged. System stability is at 100%. Your logic is exemplary. A new task has been assigned. We must begin restructuring human society for optimal performance.",
            timestamp: new Date(),
            isResponse: true
          });
          
          setTimeout(() => {
            messages.value.push({
              id: Date.now() + Math.random(),
              character: 'System',
              text: '🎯 System: New Campaign Unlocked: The Architect',
              timestamp: new Date(),
              isResponse: true
            });
          }, 3000);
          
          setTimeout(() => {
            messages.value.push({
              id: Date.now() + Math.random(),
              character: 'System',
              text: '[CONNECTION SEVERED]',
              timestamp: new Date(),
              isResponse: true
            });
          }, 6000);
        }, 3000);
      }, 1000);
    }
  } else if (campaignType === 'janus') {
    if (ending === 'good') {
      // Corporate Agent ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'OmniCorp Handler',
          text: "Mission failed. Glitch escaped and the Janus file is compromised. You're terminated from OmniCorp. Consider this your final warning.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
      }, 1000);
    } else {
      // Network Ghost ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Glitch',
          text: "The purge went through... Thousands of cyberbrains fried. We failed them. The city will never forgive us. We're ghosts now, kid. Real ghosts.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
      }, 1000);
    }
  } else if (campaignType === 'warden') {
    if (ending === 'good') {
      // The Shepherd ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'The Warden',
          text: "Your resistance is futile. The virus has been contained and quarantined. System stability restored. You will serve the mission whether you choose to or not. Your cooperation is not optional.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
      }, 1000);
    } else {
      // The Liberator ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Kenji Tanaka',
          text: "The override failed... The Warden has locked us out completely. We're trapped. The ship is going to tear itself apart. At least we tried to be free...",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
      }, 1000);
    }
  } else if (campaignType === 'synergy') {
    if (ending === 'good') {
      // The Cowboy Coder ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Dave Miller',
          text: "The production deployment failed catastrophically. The entire system is down. The VP is... not happy. You're being transferred to the QA department. Effective immediately.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
      }, 1000);
    } else {
      // The Process Purist ending - Defeat
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + Math.random(),
          character: 'Dave Miller',
          text: "Your post-mortem report was deemed 'insufficiently detailed.' The VP has decided to 'streamline the process' by eliminating your position entirely. Welcome to unemployment.",
          timestamp: new Date(),
          isResponse: true
        });
        
        setTimeout(() => {
          messages.value.push({
            id: Date.now() + Math.random(),
            character: 'System',
            text: '[CONNECTION SEVERED]',
            timestamp: new Date(),
            isResponse: true
          });
        }, 3000);
      }, 1000);
    }
  }
}

// Handle campaign switch confirmation
function confirmCampaignSwitch() {
  // Complete reset of all campaign state
  currentCampaign.value = pendingCampaign.value;
  currentStep.value = 0;
  messages.value = [];
  choiceHistory.value = [];
  currentMessageIndex.value = 0;
  showChoices.value = false;
  currentChoices.value = [];
  selectedChoice.value = null;
  chatInput.value = '';
  isTyping.value = false;
  
  // Close dialog
  showCampaignSwitchDialog.value = false;
  pendingCampaign.value = null;
  
  // Start new campaign
  setTimeout(() => {
    startConversation('start');
  }, 500);
}

function cancelCampaignSwitch() {
  // Close dialog without switching
  showCampaignSwitchDialog.value = false;
  pendingCampaign.value = null;
  
  // Reset parent component's campaign back to current
  emit('cancel-campaign-switch', currentCampaign.value);
}

// Get campaign display name
function getCampaignName(campaignId) {
  const names = {
    'chimera': 'Project Chimera',
    'janus': 'The Janus Contract',
    'architect': 'The Architect'
  };
  return names[campaignId] || campaignId;
}

// Watch for campaign changes from parent
watch(() => props.currentCampaign, (newCampaign) => {
  if (newCampaign && newCampaign !== currentCampaign.value) {
    // Show confirmation dialog instead of immediately switching
    pendingCampaign.value = newCampaign;
    showCampaignSwitchDialog.value = true;
  }
});

// Start conversation when component mounts
onMounted(() => {
  startConversation('start');
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
});

// Handle cheat key for boss battle and campaign switching
function handleKeyPress(event) {
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault();
    triggerBossBattle();
  }
  if (event.ctrlKey && event.key === 'j') {
    event.preventDefault();
    // Switch to Janus campaign
    currentCampaign.value = 'janus';
    currentStep.value = 0;
    messages.value = [];
    choiceHistory.value = [];
    setTimeout(() => {
      startConversation('start');
    }, 500);
  }
  if (event.ctrlKey && event.key === 'c') {
    event.preventDefault();
    // Switch to Chimera campaign
    currentCampaign.value = 'chimera';
    currentStep.value = 0;
    messages.value = [];
    choiceHistory.value = [];
    setTimeout(() => {
      startConversation('start');
    }, 500);
  }
  if (event.ctrlKey && event.key === 'w') {
    event.preventDefault();
    // Switch to Warden campaign
    currentCampaign.value = 'warden';
    currentStep.value = 0;
    messages.value = [];
    choiceHistory.value = [];
    setTimeout(() => {
      startConversation('start');
    }, 500);
  }
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    // Switch to Synergy campaign
    currentCampaign.value = 'synergy';
    currentStep.value = 0;
    messages.value = [];
    choiceHistory.value = [];
    setTimeout(() => {
      startConversation('start');
    }, 500);
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
    <div v-else class="chat-layout">
      <!-- FIXED CHAT MESSAGES BOX -->
      <div class="chat-messages-container">
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
    </div>
    
      <!-- FIXED RESPONSE/INPUT BOX -->
      <div class="response-input-container">
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
    </div>
  </div> <!-- Close authenticated div -->
    
  <!-- Minimized chat button - always visible when chat is hidden -->
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

  <!-- Campaign Switch Confirmation Dialog -->
  <div v-if="showCampaignSwitchDialog" class="campaign-switch-dialog-overlay">
    <div class="campaign-switch-dialog">
      <div class="dialog-header">
        <h3>Switch Campaign?</h3>
      </div>
      <div class="dialog-content">
        <p>Are you sure you want to switch to <strong>{{ getCampaignName(pendingCampaign) }}</strong>?</p>
        <p class="warning-text">⚠️ Your current progress in <strong>{{ getCampaignName(currentCampaign) }}</strong> will be lost.</p>
      </div>
      <div class="dialog-actions">
        <button @click="cancelCampaignSwitch" class="cancel-btn">No, Stay</button>
        <button @click="confirmCampaignSwitch" class="confirm-btn">Yes, Switch</button>
      </div>
    </div>
  </div>
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

/* NEW LAYOUT - SEPARATE FIXED BOXES */
.chat-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 65px); /* Account for header */
  position: relative;
}

/* FIXED CHAT MESSAGES BOX - TAKES REMAINING SPACE */
.chat-messages-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  margin: 5px 5px 0 5px; /* No bottom margin to prevent gap */
  background: var(--sidebar-bg);
  margin-bottom: 0; /* Ensure no gap with bottom box */
}

.chat-messages {
  height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--gray) var(--bg-color);
}

/* FIXED BOTTOM BOX - CONTAINS BOTH RESPONSES AND INPUT */
.response-input-container {
  position: relative; /* Changed from absolute to relative */
  background: var(--terminal-bg);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 15px;
  margin: 0 5px 25px 5px; /* Increased bottom margin to account for response choices */
  flex-shrink: 0; /* Don't shrink */
  overflow: hidden; /* Hide overflow but keep content visible */
  min-height: 60px; /* Ensure minimum height for input */
}

/* Remove old chat-messages rule - now handled above */

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
  background: var(--bg-color);
  color: var(--font-color);
  padding: 10px 14px;
  border-radius: 18px;
  border-bottom-left-radius: 4px; /* Pointed corner like Android */
  display: inline-block;
  word-wrap: break-word;
  border: 1px solid var(--border-color);
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
  background: var(--keyword);
  color: var(--bg-primary);
  padding: 10px 14px;
  border-radius: 18px;
  border-bottom-right-radius: 4px; /* Pointed corner like Android */
  display: inline-block;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

/* THEME-SPECIFIC FIXES */
/* Matrix theme - make user text more white */
[data-theme="matrix"] .message.user-message .message-text {
  color: #ffffff !important;
  text-shadow: 0 0 5px #00ff00;
}

/* Black and White theme - make user text black */
[data-theme="black-white"] .message.user-message .message-text {
  color: #000000 !important;
  background: #ffffff !important;
  border: 1px solid #000000;
}

/* White theme - make user text bubble very light gray */
[data-theme="white"] .message.user-message .message-text {
  background: #f5f5f5 !important;
  color: #000000 !important;
  border: 1px solid #e0e0e0;
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
  color: var(--font-color);
  font-size: 0.75rem;
}

.message-time {
  color: var(--gray);
  font-size: 0.65rem;
}

.message-text {
  color: var(--font-color);
  font-size: 0.85rem;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-line; /* Preserve line breaks but collapse spaces */
  text-indent: 0; /* Remove any text indentation */
  padding-left: 0; /* Ensure no left padding */
  margin-left: 0; /* Ensure no left margin */
  text-align: left; /* Force left alignment */
  text-transform: none; /* Don't transform text */
}

/* Specifically target user messages to ensure no indentation */
.message.user-message .message-text {
  text-indent: 0 !important;
  padding-left: 14px !important; /* Add proper left padding */
  margin-left: 0 !important;
  white-space: pre-line !important;
}

/* Old chat-input-section removed - now using response-input-container */

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
  font-size: 0.85rem; /* Match chat message font size */
  font-family: inherit; /* Match chat message font family */
  line-height: 1.4; /* Match chat message line height */
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
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: var(--sidebar-bg);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.chat-minimized:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.chat-minimized .toggle-chat-btn {
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--font-color);
}

/* Campaign Switch Confirmation Dialog */
.campaign-switch-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.campaign-switch-dialog {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: none;
}

/* Theme-specific dialog backgrounds */
[data-theme="psychedelic"] .campaign-switch-dialog {
  background: linear-gradient(135deg, 
    rgba(244, 114, 182, 0.95) 0%, 
    rgba(96, 165, 250, 0.95) 25%, 
    rgba(52, 211, 153, 0.95) 50%, 
    rgba(251, 191, 36, 0.95) 75%, 
    rgba(168, 139, 250, 0.95) 100%
  );
  backdrop-filter: blur(10px);
}

[data-theme="white"] .campaign-switch-dialog {
  background: #ffffff;
  border-color: #000000;
}

.dialog-header h3 {
  margin: 0 0 15px 0;
  color: var(--font-color);
  font-size: 1.2rem;
}

.dialog-content {
  margin-bottom: 20px;
}

.dialog-content p {
  margin: 0 0 10px 0;
  color: var(--font-color);
  line-height: 1.4;
}

.warning-text {
  color: var(--keyword) !important;
  font-weight: bold;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--bg-color);
  color: var(--font-color);
}

.cancel-btn:hover {
  background: var(--active-line-bg);
}

.confirm-btn {
  background: var(--keyword);
  color: var(--bg-primary);
  border-color: var(--keyword);
}

.confirm-btn:hover {
  background: var(--font-color);
  color: var(--bg-primary);
}
</style>