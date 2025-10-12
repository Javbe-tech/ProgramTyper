<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { authService } from '../services/authService.js';

const props = defineProps({
  showChat: { type: Boolean, default: true }
});

const user = ref(null);
const isAuthenticated = ref(false);
const messages = ref([]);
const currentMessage = ref('');
const selectedResponse = ref(null);
const isTyping = ref(false);
const chatTimer = ref(null);
const currentInteraction = ref(null);
const interactionHistory = ref([]);

// Team members with realistic names and avatars
const teamMembers = [
  { id: 1, name: 'Sarah Chen', avatar: '👩‍💻', role: 'Frontend Lead' },
  { id: 2, name: 'Marcus Rodriguez', avatar: '👨‍💻', role: 'Backend Dev' },
  { id: 3, name: 'Alex Kim', avatar: '👨‍🔬', role: 'DevOps Engineer' },
  { id: 4, name: 'Jordan Taylor', avatar: '👩‍🎨', role: 'UI/UX Designer' },
  { id: 5, name: 'Casey Williams', avatar: '👨‍💼', role: 'Product Manager' },
  { id: 6, name: 'Riley Patel', avatar: '👩‍🔧', role: 'QA Engineer' },
  { id: 7, name: 'Morgan Lee', avatar: '👨‍📊', role: 'Data Analyst' },
  { id: 8, name: 'Sam Johnson', avatar: '👩‍⚡', role: 'Security Specialist' }
];

// 40 unique chat interactions with positive/negative outcomes
const chatInteractions = [
  {
    id: 1,
    member: 'Sarah Chen',
    message: 'Hey! The new feature looks great, but I noticed some performance issues. Should we optimize now or focus on the deadline?',
    responses: {
      positive: 'Let\'s optimize first - quality over speed!',
      negative: 'We\'ll fix it later, deadline is more important.'
    },
    outcomes: {
      positive: 'Thanks for prioritizing quality! The team appreciates your leadership.',
      negative: 'Understood. We\'ll address performance in the next sprint.'
    }
  },
  {
    id: 2,
    member: 'Marcus Rodriguez',
    message: 'The API is ready for testing. Should I deploy to staging or wait for your review?',
    responses: {
      positive: 'Go ahead and deploy - I trust your work!',
      negative: 'Wait, I need to review the code first.'
    },
    outcomes: {
      positive: 'Deployed! Thanks for the trust. Everything looks good.',
      negative: 'No problem, I\'ll wait for your review. Better safe than sorry.'
    }
  },
  {
    id: 3,
    member: 'Alex Kim',
    message: 'Server costs are higher than expected this month. Should we scale down or investigate the spike?',
    responses: {
      positive: 'Let\'s investigate - there might be a leak or inefficiency.',
      negative: 'Just scale down for now, we\'ll look into it later.'
    },
    outcomes: {
      positive: 'Good call! Found a memory leak in the cache. Fixed it!',
      negative: 'Scaled down. We\'ll monitor and investigate next week.'
    }
  },
  {
    id: 4,
    member: 'Jordan Taylor',
    message: 'The design system needs an update. Should we do a full redesign or incremental improvements?',
    responses: {
      positive: 'Let\'s do incremental improvements - less disruptive.',
      negative: 'Full redesign! Time for something fresh.'
    },
    outcomes: {
      positive: 'Smart approach! The team will appreciate the gradual changes.',
      negative: 'Exciting! I\'ll start working on the new design concepts.'
    }
  },
  {
    id: 5,
    member: 'Casey Williams',
    message: 'User feedback is mixed on the new feature. Should we iterate quickly or gather more data?',
    responses: {
      positive: 'Let\'s gather more data - we need to understand the feedback better.',
      negative: 'Quick iteration! Let\'s fix the obvious issues now.'
    },
    outcomes: {
      positive: 'Good thinking. More data will help us make better decisions.',
      negative: 'Agreed! Let\'s address the main pain points immediately.'
    }
  },
  {
    id: 6,
    member: 'Riley Patel',
    message: 'Found several bugs in the latest build. Should we delay the release or fix them quickly?',
    responses: {
      positive: 'Let\'s fix them properly - quality is important.',
      negative: 'Quick fixes only, we can\'t delay the release.'
    },
    outcomes: {
      positive: 'Thanks for prioritizing quality! The fixes are thorough.',
      negative: 'Understood. Quick fixes applied, release is on track.'
    }
  },
  {
    id: 7,
    member: 'Morgan Lee',
    message: 'Analytics show users are dropping off at step 3. Should we redesign that flow or add more guidance?',
    responses: {
      positive: 'Let\'s redesign - the flow itself might be the issue.',
      negative: 'Add more guidance first, then we can redesign if needed.'
    },
    outcomes: {
      positive: 'Great insight! The redesign should solve the core issue.',
      negative: 'Good approach! Guidance will help while we plan the redesign.'
    }
  },
  {
    id: 8,
    member: 'Sam Johnson',
    message: 'Security audit found some vulnerabilities. Should we patch immediately or schedule for next sprint?',
    responses: {
      positive: 'Patch immediately - security can\'t wait.',
      negative: 'Schedule for next sprint, current features are priority.'
    },
    outcomes: {
      positive: 'Excellent! Security first. Patches are being deployed.',
      negative: 'Understood. I\'ll prioritize them for next sprint.'
    }
  },
  {
    id: 9,
    member: 'Sarah Chen',
    message: 'The codebase is getting complex. Should we refactor now or add more documentation?',
    responses: {
      positive: 'Let\'s refactor - clean code is easier to maintain.',
      negative: 'Add documentation first, refactoring can wait.'
    },
    outcomes: {
      positive: 'Good call! Refactoring will make future development easier.',
      negative: 'Documentation will help the team understand the current structure.'
    }
  },
  {
    id: 10,
    member: 'Marcus Rodriguez',
    message: 'Database queries are slow. Should we optimize the queries or add caching?',
    responses: {
      positive: 'Let\'s optimize queries first - fix the root cause.',
      negative: 'Add caching for now, optimization can come later.'
    },
    outcomes: {
      positive: 'Smart! Optimized queries will improve performance long-term.',
      negative: 'Caching will help immediately while we plan optimization.'
    }
  },
  {
    id: 11,
    member: 'Alex Kim',
    message: 'Deployment pipeline is failing intermittently. Should we debug the pipeline or use manual deployment?',
    responses: {
      positive: 'Let\'s debug the pipeline - automation is important.',
      negative: 'Use manual deployment for now, we\'ll fix the pipeline later.'
    },
    outcomes: {
      positive: 'Good thinking! A reliable pipeline saves time in the long run.',
      negative: 'Manual deployment will keep us moving while we fix the pipeline.'
    }
  },
  {
    id: 12,
    member: 'Jordan Taylor',
    message: 'Users are confused by the new interface. Should we add tooltips or simplify the design?',
    responses: {
      positive: 'Let\'s simplify the design - make it more intuitive.',
      negative: 'Add tooltips first, then we can simplify later.'
    },
    outcomes: {
      positive: 'Great approach! Simpler design will reduce confusion.',
      negative: 'Tooltips will help users while we work on simplification.'
    }
  },
  {
    id: 13,
    member: 'Casey Williams',
    message: 'Competitor launched a similar feature. Should we pivot our approach or stay the course?',
    responses: {
      positive: 'Let\'s stay the course - our approach has unique value.',
      negative: 'Time to pivot! We need to differentiate quickly.'
    },
    outcomes: {
      positive: 'Good confidence! Our unique approach will stand out.',
      negative: 'Smart move! Pivoting will help us stay competitive.'
    }
  },
  {
    id: 14,
    member: 'Riley Patel',
    message: 'Test coverage is below target. Should we write more tests or focus on new features?',
    responses: {
      positive: 'Write more tests - quality assurance is crucial.',
      negative: 'Focus on new features, we\'ll improve coverage later.'
    },
    outcomes: {
      positive: 'Excellent! Better test coverage will prevent future bugs.',
      negative: 'Understood. New features first, then we\'ll boost coverage.'
    }
  },
  {
    id: 15,
    member: 'Morgan Lee',
    message: 'User engagement is declining. Should we analyze the data deeper or try new features?',
    responses: {
      positive: 'Analyze the data deeper - understand the root cause.',
      negative: 'Try new features - maybe users need something fresh.'
    },
    outcomes: {
      positive: 'Good approach! Data analysis will reveal the real issues.',
      negative: 'New features might re-engage users. Let\'s try it!'
    }
  },
  {
    id: 16,
    member: 'Sam Johnson',
    message: 'Third-party service is unreliable. Should we build our own solution or find alternatives?',
    responses: {
      positive: 'Build our own - we\'ll have full control.',
      negative: 'Find alternatives - building takes too long.'
    },
    outcomes: {
      positive: 'Smart! Building our own will give us reliability and control.',
      negative: 'Good point! Alternatives will get us up and running faster.'
    }
  },
  {
    id: 17,
    member: 'Sarah Chen',
    message: 'Code reviews are taking too long. Should we reduce review requirements or add more reviewers?',
    responses: {
      positive: 'Add more reviewers - quality reviews are important.',
      negative: 'Reduce requirements - speed is more important right now.'
    },
    outcomes: {
      positive: 'Good call! More reviewers will improve code quality.',
      negative: 'Understood. Faster reviews will help us move quicker.'
    }
  },
  {
    id: 18,
    member: 'Marcus Rodriguez',
    message: 'API rate limits are being hit. Should we implement queuing or upgrade the plan?',
    responses: {
      positive: 'Implement queuing - it\'s a better long-term solution.',
      negative: 'Upgrade the plan - quick fix for now.'
    },
    outcomes: {
      positive: 'Excellent! Queuing will handle spikes gracefully.',
      negative: 'Upgrade will solve it immediately while we plan queuing.'
    }
  },
  {
    id: 19,
    member: 'Alex Kim',
    message: 'Monitoring alerts are too noisy. Should we tune the alerts or add more monitoring?',
    responses: {
      positive: 'Tune the alerts - reduce noise and focus on real issues.',
      negative: 'Add more monitoring - better visibility is always good.'
    },
    outcomes: {
      positive: 'Smart! Tuned alerts will help us focus on what matters.',
      negative: 'More monitoring will give us better insights into system health.'
    }
  },
  {
    id: 20,
    member: 'Jordan Taylor',
    message: 'Design system is inconsistent across teams. Should we enforce standards or provide better documentation?',
    responses: {
      positive: 'Enforce standards - consistency is crucial.',
      negative: 'Better documentation - education over enforcement.'
    },
    outcomes: {
      positive: 'Good call! Enforced standards will ensure consistency.',
      negative: 'Documentation will help teams understand and follow the system.'
    }
  },
  {
    id: 21,
    member: 'Casey Williams',
    message: 'User onboarding is too long. Should we shorten it or make it more engaging?',
    responses: {
      positive: 'Make it more engaging - better experience is worth the time.',
      negative: 'Shorten it - users want to get started quickly.'
    },
    outcomes: {
      positive: 'Great thinking! Engaging onboarding will improve retention.',
      negative: 'Good point! Shorter onboarding will reduce drop-off.'
    }
  },
  {
    id: 22,
    member: 'Riley Patel',
    message: 'Automated tests are flaky. Should we fix the tests or add more manual testing?',
    responses: {
      positive: 'Fix the tests - reliable automation is essential.',
      negative: 'Add manual testing - we need coverage while fixing tests.'
    },
    outcomes: {
      positive: 'Excellent! Reliable tests will catch issues consistently.',
      negative: 'Manual testing will ensure quality while we fix automation.'
    }
  },
  {
    id: 23,
    member: 'Morgan Lee',
    message: 'User feedback is overwhelming. Should we prioritize by impact or by frequency?',
    responses: {
      positive: 'Prioritize by impact - high-impact changes matter most.',
      negative: 'Prioritize by frequency - common issues affect more users.'
    },
    outcomes: {
      positive: 'Smart approach! High-impact changes will drive the most value.',
      negative: 'Good thinking! Addressing frequent issues will help many users.'
    }
  },
  {
    id: 24,
    member: 'Sam Johnson',
    message: 'Security scan found vulnerabilities. Should we patch immediately or schedule for maintenance window?',
    responses: {
      positive: 'Patch immediately - security can\'t wait.',
      negative: 'Schedule for maintenance window - avoid disrupting users.'
    },
    outcomes: {
      positive: 'Excellent! Immediate patching protects users right away.',
      negative: 'Good planning! Maintenance window will minimize disruption.'
    }
  },
  {
    id: 25,
    member: 'Sarah Chen',
    message: 'Performance is slow on mobile. Should we optimize the app or create a mobile-specific version?',
    responses: {
      positive: 'Optimize the app - one codebase is easier to maintain.',
      negative: 'Create mobile-specific version - better user experience.'
    },
    outcomes: {
      positive: 'Good call! Optimized app will work well across all devices.',
      negative: 'Smart! Mobile-specific version will provide the best experience.'
    }
  },
  {
    id: 26,
    member: 'Marcus Rodriguez',
    message: 'Database migration is complex. Should we do it incrementally or all at once?',
    responses: {
      positive: 'Incremental approach - safer and more manageable.',
      negative: 'All at once - get it over with quickly.'
    },
    outcomes: {
      positive: 'Smart! Incremental migration reduces risk and complexity.',
      negative: 'Understood. All-at-once approach will complete the migration faster.'
    }
  },
  {
    id: 27,
    member: 'Alex Kim',
    message: 'CI/CD pipeline is slow. Should we optimize the pipeline or add more parallel jobs?',
    responses: {
      positive: 'Optimize the pipeline - fix the root cause.',
      negative: 'Add parallel jobs - quick fix for now.'
    },
    outcomes: {
      positive: 'Excellent! Optimized pipeline will be faster and more efficient.',
      negative: 'Good solution! Parallel jobs will speed up builds immediately.'
    }
  },
  {
    id: 28,
    member: 'Jordan Taylor',
    message: 'User interface is cluttered. Should we redesign or reorganize the current layout?',
    responses: {
      positive: 'Redesign - fresh approach will solve the clutter.',
      negative: 'Reorganize - work with what we have.'
    },
    outcomes: {
      positive: 'Great idea! Redesign will create a cleaner, more intuitive interface.',
      negative: 'Good approach! Reorganization will improve the current layout.'
    }
  },
  {
    id: 29,
    member: 'Casey Williams',
    message: 'Feature requests are piling up. Should we focus on the most requested or the most innovative?',
    responses: {
      positive: 'Most requested - give users what they want.',
      negative: 'Most innovative - stay ahead of the competition.'
    },
    outcomes: {
      positive: 'Smart! Focusing on requested features will satisfy users.',
      negative: 'Great thinking! Innovation will keep us competitive.'
    }
  },
  {
    id: 30,
    member: 'Riley Patel',
    message: 'Bug reports are increasing. Should we hire more QA or improve our testing process?',
    responses: {
      positive: 'Improve testing process - better prevention is key.',
      negative: 'Hire more QA - we need more coverage.'
    },
    outcomes: {
      positive: 'Excellent! Better testing process will prevent bugs from reaching users.',
      negative: 'Good solution! More QA will catch issues before release.'
    }
  },
  {
    id: 31,
    member: 'Morgan Lee',
    message: 'User retention is dropping. Should we analyze churn data or implement retention features?',
    responses: {
      positive: 'Analyze churn data - understand why users are leaving.',
      negative: 'Implement retention features - give users reasons to stay.'
    },
    outcomes: {
      positive: 'Smart! Churn analysis will reveal the root causes.',
      negative: 'Good approach! Retention features will keep users engaged.'
    }
  },
  {
    id: 32,
    member: 'Sam Johnson',
    message: 'Compliance audit is coming up. Should we prepare documentation or fix compliance issues?',
    responses: {
      positive: 'Fix compliance issues - address the real problems.',
      negative: 'Prepare documentation - show our current state.'
    },
    outcomes: {
      positive: 'Excellent! Fixing issues will ensure we pass the audit.',
      negative: 'Good planning! Documentation will demonstrate our compliance efforts.'
    }
  },
  {
    id: 33,
    member: 'Sarah Chen',
    message: 'Code complexity is increasing. Should we refactor now or add more comments?',
    responses: {
      positive: 'Refactor now - clean code is easier to maintain.',
      negative: 'Add comments - documentation helps understanding.'
    },
    outcomes: {
      positive: 'Great call! Refactoring will make the codebase more maintainable.',
      negative: 'Good approach! Comments will help the team understand the code.'
    }
  },
  {
    id: 34,
    member: 'Marcus Rodriguez',
    message: 'API documentation is outdated. Should we update it or create interactive docs?',
    responses: {
      positive: 'Create interactive docs - better developer experience.',
      negative: 'Update existing docs - quick fix for now.'
    },
    outcomes: {
      positive: 'Excellent! Interactive docs will make the API easier to use.',
      negative: 'Good solution! Updated docs will provide current information.'
    }
  },
  {
    id: 35,
    member: 'Alex Kim',
    message: 'Server costs are rising. Should we optimize resources or migrate to cheaper infrastructure?',
    responses: {
      positive: 'Optimize resources - make current setup more efficient.',
      negative: 'Migrate to cheaper infrastructure - reduce costs immediately.'
    },
    outcomes: {
      positive: 'Smart! Resource optimization will improve performance and reduce costs.',
      negative: 'Good thinking! Migration will provide immediate cost savings.'
    }
  },
  {
    id: 36,
    member: 'Jordan Taylor',
    message: 'User experience is inconsistent. Should we standardize components or create style guidelines?',
    responses: {
      positive: 'Standardize components - consistency across the app.',
      negative: 'Create style guidelines - help teams maintain consistency.'
    },
    outcomes: {
      positive: 'Great approach! Standardized components will ensure consistency.',
      negative: 'Good solution! Style guidelines will help teams stay consistent.'
    }
  },
  {
    id: 37,
    member: 'Casey Williams',
    message: 'Feature adoption is low. Should we improve onboarding or add more features?',
    responses: {
      positive: 'Improve onboarding - help users discover features.',
      negative: 'Add more features - give users more options.'
    },
    outcomes: {
      positive: 'Smart! Better onboarding will increase feature adoption.',
      negative: 'Good thinking! More features will provide additional value.'
    }
  },
  {
    id: 38,
    member: 'Riley Patel',
    message: 'Test environment is unstable. Should we fix the environment or use production for testing?',
    responses: {
      positive: 'Fix the environment - proper testing setup is essential.',
      negative: 'Use production for testing - we need to test somehow.'
    },
    outcomes: {
      positive: 'Excellent! Stable test environment will improve testing quality.',
      negative: 'Understood. Production testing will work while we fix the environment.'
    }
  },
  {
    id: 39,
    member: 'Morgan Lee',
    message: 'User data is incomplete. Should we improve data collection or clean existing data?',
    responses: {
      positive: 'Improve data collection - better data going forward.',
      negative: 'Clean existing data - fix what we have.'
    },
    outcomes: {
      positive: 'Great approach! Better data collection will improve future analysis.',
      negative: 'Good solution! Clean data will make current analysis more accurate.'
    }
  },
  {
    id: 40,
    member: 'Sam Johnson',
    message: 'Security incident occurred. Should we investigate thoroughly or implement quick fixes?',
    responses: {
      positive: 'Investigate thoroughly - understand the full scope.',
      negative: 'Implement quick fixes - secure the system immediately.'
    },
    outcomes: {
      positive: 'Excellent! Thorough investigation will prevent future incidents.',
      negative: 'Good call! Quick fixes will secure the system right away.'
    }
  }
];

// Update auth state function
function updateAuthState() {
  isAuthenticated.value = authService.isUserAuthenticated();
  user.value = authService.getUser();
}

// Get random team member
function getRandomTeamMember() {
  return teamMembers[Math.floor(Math.random() * teamMembers.length)];
}

// Get random interaction that hasn't been used recently
function getRandomInteraction() {
  const recentIds = interactionHistory.value.slice(-10).map(i => i.id);
  const availableInteractions = chatInteractions.filter(i => !recentIds.includes(i.id));
  
  if (availableInteractions.length === 0) {
    // Reset history if all interactions have been used
    interactionHistory.value = [];
    return chatInteractions[Math.floor(Math.random() * chatInteractions.length)];
  }
  
  return availableInteractions[Math.floor(Math.random() * availableInteractions.length)];
}

// Start a new chat interaction
function startNewInteraction() {
  if (!isAuthenticated.value) return;
  
  const interaction = getRandomInteraction();
  const member = getRandomTeamMember();
  
  currentInteraction.value = {
    ...interaction,
    member: member.name,
    avatar: member.avatar,
    role: member.role
  };
  
  // Add team member message
  messages.value.push({
    id: Date.now(),
    type: 'team',
    member: member.name,
    avatar: member.avatar,
    role: member.role,
    message: interaction.message,
    timestamp: new Date()
  });
  
  // Show response options
  isTyping.value = true;
  
  // Record this interaction
  interactionHistory.value.push(interaction);
}

// Send response
function sendResponse(responseType) {
  if (!currentInteraction.value || !selectedResponse.value) return;
  
  const responseText = currentInteraction.value.responses[responseType];
  const outcomeText = currentInteraction.value.outcomes[responseType];
  
  // Add user response
  messages.value.push({
    id: Date.now() + 1,
    type: 'user',
    message: responseText,
    timestamp: new Date()
  });
  
  // Clear response selection
  selectedResponse.value = null;
  isTyping.value = false;
  
  // Add team member outcome after a delay
  setTimeout(() => {
    messages.value.push({
      id: Date.now() + 2,
      type: 'team',
      member: currentInteraction.value.member,
      avatar: currentInteraction.value.avatar,
      role: currentInteraction.value.role,
      message: outcomeText,
      timestamp: new Date()
    });
    
    currentInteraction.value = null;
    
    // Start next interaction after 2 minutes
    chatTimer.value = setTimeout(() => {
      startNewInteraction();
    }, 120000); // 2 minutes
  }, 2000);
}

// Start chat system
function startChatSystem() {
  if (!isAuthenticated.value) return;
  
  // Start first interaction after a short delay
  setTimeout(() => {
    startNewInteraction();
  }, 5000); // 5 seconds after login
}

// Stop chat system
function stopChatSystem() {
  if (chatTimer.value) {
    clearTimeout(chatTimer.value);
    chatTimer.value = null;
  }
  messages.value = [];
  currentInteraction.value = null;
  selectedResponse.value = null;
  isTyping.value = false;
}

// Computed properties
const canSendResponse = computed(() => {
  return selectedResponse.value && currentInteraction.value && isTyping.value;
});

const currentInteractionResponses = computed(() => {
  if (!currentInteraction.value) return [];
  return [
    { key: 'positive', text: currentInteraction.value.responses.positive },
    { key: 'negative', text: currentInteraction.value.responses.negative }
  ];
});

onMounted(() => {
  updateAuthState();
  
  // Check for auth changes periodically
  const authInterval = setInterval(() => {
    const newAuthState = authService.isUserAuthenticated();
    if (newAuthState !== isAuthenticated.value) {
      updateAuthState();
      if (newAuthState) {
        startChatSystem();
      } else {
        stopChatSystem();
      }
    }
  }, 1000);
  
  // Start chat if already authenticated
  if (isAuthenticated.value) {
    startChatSystem();
  }
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(authInterval);
    stopChatSystem();
  });
});
</script>

<template>
  <aside class="team-chat" v-show="showChat && isAuthenticated">
    <div class="chat-header">
      <h3>Team Chat</h3>
      <div class="status-indicator">
        <div class="status-dot"></div>
        <span>Active</span>
      </div>
    </div>
    
    <div class="chat-messages">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message"
        :class="message.type"
      >
        <div v-if="message.type === 'team'" class="message-header">
          <span class="member-avatar">{{ message.avatar }}</span>
          <div class="member-info">
            <span class="member-name">{{ message.member }}</span>
            <span class="member-role">{{ message.role }}</span>
          </div>
        </div>
        <div class="message-content">{{ message.message }}</div>
        <div class="message-time">{{ message.timestamp.toLocaleTimeString() }}</div>
      </div>
    </div>
    
    <div v-if="isTyping && currentInteraction" class="response-section">
      <div class="response-prompt">Choose your response:</div>
      <div class="response-options">
        <div 
          v-for="response in currentInteractionResponses"
          :key="response.key"
          class="response-option"
          :class="{ selected: selectedResponse === response.key }"
          @click="selectedResponse = response.key"
        >
          {{ response.text }}
        </div>
      </div>
      <button 
        class="send-button"
        :disabled="!canSendResponse"
        @click="sendResponse(selectedResponse)"
      >
        Send
      </button>
    </div>
    
    <div v-else class="chat-input">
      <input 
        v-model="currentMessage"
        placeholder="Type a message..."
        class="message-input"
        disabled
      />
      <button class="send-button" disabled>Send</button>
    </div>
    
    <div class="chat-footer">
      <div class="user-info">
        <img 
          v-if="user?.picture" 
          :src="user.picture" 
          :alt="user.name"
          class="user-avatar"
        />
        <div v-else class="user-avatar-placeholder">
          {{ user?.name?.charAt(0) || 'U' }}
        </div>
        <span class="user-name">{{ user?.name || 'User' }}</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.team-chat {
  width: 320px;
  border-left: 1px solid var(--border-color);
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  color: var(--font-color);
  font-size: 1.1rem;
  font-weight: 600;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--gray);
  font-size: 0.8rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chat-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--keyword);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.75rem;
}

.user-name {
  color: var(--gray);
  font-size: 0.8rem;
  font-weight: 500;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.team {
  align-items: flex-start;
}

.message.user {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.member-avatar {
  font-size: 1.2rem;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  color: var(--font-color);
  font-size: 0.85rem;
  font-weight: 500;
}

.member-role {
  color: var(--gray);
  font-size: 0.75rem;
}

.message-content {
  background: var(--bg-color);
  padding: 8px 12px;
  border-radius: 12px;
  color: var(--font-color);
  font-size: 0.9rem;
  line-height: 1.4;
  max-width: 80%;
  word-wrap: break-word;
}

.message.user .message-content {
  background: var(--keyword);
  color: white;
}

.message-time {
  color: var(--gray);
  font-size: 0.7rem;
  margin-top: 2px;
}

.response-section {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
}

.response-prompt {
  color: var(--font-color);
  font-size: 0.9rem;
  margin-bottom: 12px;
  font-weight: 500;
}

.response-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.response-option {
  padding: 8px 12px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--gray);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.response-option:hover {
  background: var(--active-line-bg);
  color: var(--font-color);
  opacity: 0.8;
}

.response-option.selected {
  background: var(--keyword);
  color: white;
  border-color: var(--keyword);
  opacity: 1;
}

.send-button {
  width: 100%;
  padding: 8px 16px;
  background: var(--keyword);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.send-button:hover:not(:disabled) {
  background: #6d28d9;
}

.send-button:disabled {
  background: var(--gray);
  cursor: not-allowed;
  opacity: 0.5;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
  display: flex;
  gap: 8px;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--font-color);
  font-size: 0.9rem;
}

.message-input:focus {
  outline: none;
  border-color: var(--keyword);
}

.message-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
