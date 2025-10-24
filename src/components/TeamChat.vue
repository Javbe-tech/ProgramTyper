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
  },
  'janus': {
    characters: [
      { name: 'Glitch', avatar: '👨‍💻', color: '#8b5cf6' },
      { name: 'OmniCorp Handler', avatar: '🏢', color: '#ef4444' },
      { name: 'System', avatar: '🤖', color: '#10b981' }
    ],
    conversations: [
      {
        trigger: 'start',
        messages: [
          { character: 'Glitch', text: 'Got a gig for you. OmniCorp. Simple data snatch from a legacy server. They\'re paying top creds. The security is a joke; I\'ve already paved the way. You in?', delay: 1000 }
        ],
        choices: [
          { id: 'good', text: 'A corporate server with weak security? Smells like a trap, but the money\'s too good. I\'m in.', karma: 1 },
          { id: 'bad', text: 'Easy money is never easy. What\'s the catch, Glitch? What aren\'t you telling me?', karma: -1 }
        ]
      },
      {
        trigger: 'step2',
        messages: [
          { character: 'Glitch', text: 'You\'re in. The target file is codenamed "Janus." Find it, copy it, and get out. I\'m scrubbing your digital footprints as you go.', delay: 1000 }
        ],
        choices: [
          { id: 'good', text: 'Copying it now. This file is huge... and the encryption is... biological? Never seen anything like it.', karma: 1 },
          { id: 'bad', text: 'Hold on. I\'m running a preliminary scan on the file directory. "Janus" isn\'t just a data file; it\'s some kind of executable program.', karma: -1 }
        ]
      },
      {
        trigger: 'step3',
        messages: [
          { character: 'Glitch', text: 'Get out! Now! It was a honeypot. A silent alarm just tripped. They\'re deploying military-grade ICE (Intrusion Countermeasures Electronics). This isn\'t standard security; this is a hunter-killer program.', delay: 1000 }
        ],
        choices: [
          { id: 'good', text: 'I\'m not leaving the payday behind. I can bypass it. Just give me a minute.', karma: 1 },
          { id: 'bad', text: 'Understood. Aborting the download and wiping my presence. We can live to hack another day.', karma: -1 }
        ]
      },
      {
        trigger: 'step4',
        messages: [
          { character: 'Glitch', text: 'I dug deeper while you were running. "Janus" isn\'t a program. It\'s a weapon. A "personality matrix inhibitor." It\'s designed to digitally lobotomize humans with advanced cybernetic brains. Our client isn\'t just a corporate rival.', delay: 1000 }
        ],
        choices: [
          { id: 'good', text: 'A weapon is a product. And products sell. This just made our stolen data a lot more valuable.', karma: 1 },
          { id: 'bad', text: 'This is a tool for digital assassination. We can\'t let anyone have this. We need to destroy it.', karma: -1 }
        ]
      },
      {
        trigger: 'step5',
        messages: [
          { character: 'Glitch', text: 'They\'re bypassing me. They\'re hailing you directly. OmniCorp Internal Security. They know who you are. They\'re offering you a deal: a full pardon and a senior position in their netrunning division. All you have to do is give them the Janus file... and my location.', delay: 1000 }
        ],
        choices: [
          { id: 'good', text: 'A steady paycheck and a corporate title beats being a ghost in the slums. I\'m taking the deal.', karma: 1 },
          { id: 'bad', text: 'They can take their offer and shove it. Nobody threatens my partners. We\'re in this together.', karma: -1 }
        ]
      },
      {
        trigger: 'step6',
        messages: [
          { character: 'Glitch', text: 'OmniCorp has a dead man\'s switch. Since they can\'t secure Janus, they\'re going to erase it. They\'ve activated a city-wide data purge targeting the old network where most augmented citizens live. It will wipe the file, but it will also fry thousands of cyberbrains. It\'s a massacre.', delay: 1000 }
        ],
        choices: [
          { id: 'good', text: 'Collateral damage. It\'s not our problem. We need to focus on our own survival and escape.', karma: 1 },
          { id: 'bad', text: 'We can\'t let them do that. There has to be a way to stop the purge protocol.', karma: -1 }
        ]
      },
      {
        trigger: 'step7',
        messages: [
          { character: 'Glitch', text: 'This is it. The purge starts in two minutes. The OmniCorp netrunners are hunting us. Every second counts. What\'s the final play?', delay: 1000 }
        ],
        choices: [
          { id: 'good', text: 'We give them what they want. Transmit the Janus file to OmniCorp\'s lead agent. It\'s our only bargaining chip.', karma: 1 },
          { id: 'bad', text: 'We fight. Send me the core sequence of the purge protocol. I\'ll write the counter-virus. Let\'s burn them down.', karma: -1 }
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
  // Campaign-specific responses
  const campaignResponses = {
    'chimera': {
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
    },
    'janus': {
      0: { // Step 1 responses
        'good': { character: 'Glitch', text: 'That\'s the spirit. Just be quick. In and out before anyone even knows you were there. Here are the coordinates.' },
        'bad': { character: 'Glitch', text: 'The catch is that we\'ll be rich. The client is paying for speed, not subtlety. Stop being paranoid and get to work. Here are the coordinates.' }
      },
      1: { // Step 2 responses
        'good': { character: 'Glitch', text: 'Biological? That wasn\'t in the brief. Just grab the damn thing. The client can figure out what it is later.' },
        'bad': { character: 'Glitch', text: 'An executable? Dammit. The client said it was inert data. This job just got a lot more complicated.' }
      },
      2: { // Step 3 responses
        'good': { character: 'Glitch', text: 'You don\'t have a minute! This thing doesn\'t just block you; it\'ll trace your signal back to your physical rig and flash-fry the circuits!' },
        'bad': { character: 'Glitch', text: 'Good call. I\'m throwing up every decoy I have. Go dark the second you\'re out.' }
      },
      3: { // Step 4 responses
        'good': { character: 'Glitch', text: 'You\'re playing with fire. The kind of people who build this don\'t just negotiate; they eliminate loose ends.' },
        'bad': { character: 'Glitch', text: 'My thoughts exactly. But it\'s too late for that. The file is already on your system, and I think they know it.' }
      },
      4: { // Step 5 responses
        'good': { character: 'Glitch', text: 'After all we\'ve been through? I shouldn\'t be surprised. You\'re on your own now, kid. I hope it\'s worth it.' },
        'bad': { character: 'Glitch', text: '...Good. I was hoping you\'d say that. Because they\'re not just threatening us anymore. They\'ve activated a contingency plan.' }
      },
      5: { // Step 6 responses
        'good': { character: 'Glitch', text: 'That\'s a cold calculus, even for a deck-jockey. Fine. We save ourselves. But don\'t expect the city to forgive you.' },
        'bad': { character: 'Glitch', text: 'There is, but it\'s insane. We\'d have to code a counter-virus and upload it directly into the purge signal as it activates. It\'s a one-in-a-million shot.' }
      },
      6: { // Step 7 responses
        'good': { character: 'Glitch', text: 'A deal with devils. I hope you know what you\'re doing. Sending you their secure channel now.' },
        'bad': { character: 'Glitch', text: 'This is it, kid. Become a legend or become a ghost. Sending the code now.' }
      }
    }
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
      }, 1000);
    }
  }
}

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
    
    <div v-show="!shouldShowChat" class="chat-minimized">
      <button @click="toggleChat" class="toggle-chat-btn">💬</button>
    </div>
  </div> <!-- Close authenticated div -->
  
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