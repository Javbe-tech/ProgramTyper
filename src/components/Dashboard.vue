<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { userStatsService } from '../services/userStatsService.js';
import { authService } from '../services/authService.js';
import { events } from '../eventBus.js';
import StatsChart from './StatsChart.vue';

const stats = ref({});
const showDashboard = ref(false);
const isAuthenticated = ref(false);

// Check authentication status
function updateAuthState() {
  isAuthenticated.value = authService.isUserAuthenticated();
}

// Load statistics on component mount
onMounted(() => {
  updateAuthState();
  if (isAuthenticated.value) {
    stats.value = userStatsService.getStatsSummary();
  }
  
  // Check for auth changes periodically
  setInterval(updateAuthState, 1000);
});

// Watch for statistics updates
watch(events, (newEventObject) => {
  if (newEventObject.updateLastRun || newEventObject.updateSessionStats) {
    refreshStats();
  }
}, { deep: true });

// Computed properties for display
const lifetimeStats = computed(() => stats.value.lifetime || {});
const dailyStats = computed(() => stats.value.currentDay || {});
const weakestChars = computed(() => stats.value.weakestCharacters || []);
const weakestWords = computed(() => stats.value.weakestWords || []);
const sessionHistory = computed(() => (stats.value.lifetime?.sessionHistory) || []);
const lessonHistory = computed(() => (stats.value.lifetime?.lessonHistory) || []);

// Chart data
const wpmChartData = computed(() => ({
  labels: ['Today', 'Lifetime'],
  datasets: [{
    label: 'Average WPM',
    data: [dailyStats.value.averageWpm || 0, lifetimeStats.value.averageWpm || 0],
    backgroundColor: ['#8b5cf6', '#06b6d4'],
    borderColor: ['#7c3aed', '#0891b2'],
    borderWidth: 2
  }]
}));

const accuracyChartData = computed(() => ({
  labels: ['Today', 'Lifetime'],
  datasets: [{
    label: 'Accuracy %',
    data: [dailyStats.value.averageAccuracy || 0, lifetimeStats.value.averageAccuracy || 0],
    backgroundColor: ['#10b981', '#f59e0b'],
    borderColor: ['#059669', '#d97706'],
    borderWidth: 2
  }]
}));

const characterMistakeChartData = computed(() => {
  const topChars = weakestChars.value.slice(0, 8);
  return {
    labels: topChars.map(char => char.character),
    datasets: [{
      label: 'Error Rate (%)',
      data: topChars.map(char => Math.round(char.mistakeRate * 100)),
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      borderWidth: 2
    }]
  };
});

// New: Progress over lessons chart (WPM & Accuracy + trajectories)
const progressChartData = computed(() => {
  const labels = lessonHistory.value.map((_, i) => `Lesson ${i + 1}`);
  const wpmData = lessonHistory.value.map(s => s.wpm);
  const accData = lessonHistory.value.map(s => s.accuracy || 0);

  function trendLine(data) {
    if (data.length === 0) return [];
    const n = data.length;
    const xs = Array.from({ length: n }, (_, i) => i + 1);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * data[i], 0);
    const sumXX = xs.reduce((a, x) => a + x * x, 0);
    const m = (n * sumXY - sumX * sumY) / Math.max(1, (n * sumXX - sumX * sumX));
    const b = (sumY - m * sumX) / n;
    return xs.map(x => Math.round(m * x + b));
  }

  return {
    labels,
    datasets: [
      {
        label: 'WPM',
        data: wpmData,
        borderColor: '#34d399',
        backgroundColor: 'transparent',
        tension: 0.2
      },
      {
        label: 'Accuracy %',
        data: accData,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.2
      },
      {
        label: 'WPM Trend',
        data: trendLine(wpmData),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderDash: [6, 6],
        tension: 0
      },
      {
        label: 'Accuracy Trend',
        data: trendLine(accData),
        borderColor: '#d97706',
        backgroundColor: 'transparent',
        borderDash: [6, 6],
        tension: 0
      }
    ]
  };
});

// Format time display
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Format percentage
function formatPercentage(value) {
  return `${Math.round(value)}%`;
}

// Refresh statistics
function refreshStats() {
  if (isAuthenticated.value) {
    stats.value = userStatsService.getStatsSummary();
  }
}

// Reset all statistics
function resetStats() {
  if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
    userStatsService.resetStats();
    refreshStats();
  }
}

// Handle login
async function handleLogin() {
  try {
    await authService.login();
    updateAuthState();
    if (isAuthenticated.value) {
      stats.value = userStatsService.getStatsSummary();
    }
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed. Please try again.');
  }
}

// Toggle dashboard visibility
function toggleDashboard() {
  showDashboard.value = !showDashboard.value;
  if (showDashboard.value) {
    refreshStats();
  }
}
</script>

<template>
  <div class="dashboard-container">
    <button @click="toggleDashboard" class="dashboard-toggle">
      📊 Dashboard
    </button>
    
    <div v-if="showDashboard" class="dashboard-overlay" @click.self="showDashboard = false">
      <div class="dashboard-content" @click.stop>
        <div class="dashboard-header">
          <h2>Typing Statistics Dashboard</h2>
          <button @click="showDashboard = false" class="close-btn">×</button>
        </div>
        
        <div class="dashboard-body">
          <!-- Login Prompt for Non-Authenticated Users -->
          <div v-if="!isAuthenticated" class="login-prompt-section">
            <div class="login-prompt-content">
              <div class="login-icon">📊</div>
              <h3>Sign in to View Your Stats</h3>
              <p>Track your typing progress, view detailed analytics, and save your statistics across devices.</p>
              <div class="login-benefits">
                <div class="benefit-item">✓ Free to sign in with Google</div>
                <div class="benefit-item">✓ Save progress across devices</div>
                <div class="benefit-item">✓ Detailed performance analytics</div>
                <div class="benefit-item">✓ Track improvement over time</div>
              </div>
              <button @click="handleLogin" class="login-btn">
                Sign in with Google
              </button>
            </div>
          </div>
          
          <!-- Stats Content for Authenticated Users -->
          <div v-else>
          <!-- Current Day Stats -->
          <div class="stats-section">
            <h3>Today's Performance</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ dailyStats.averageWpm || 0 }}</div>
                <div class="stat-label">Average WPM</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ dailyStats.highestWpm || 0 }}</div>
                <div class="stat-label">Highest WPM</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ formatPercentage(dailyStats.averageAccuracy || 0) }}</div>
                <div class="stat-label">Accuracy</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ formatTime(dailyStats.totalTime || 0) }}</div>
                <div class="stat-label">Time Typed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ dailyStats.wordsCompleted || 0 }}</div>
                <div class="stat-label">Words Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ (dailyStats.lessonHistory?.length) || 0 }}</div>
                <div class="stat-label">Lessons</div>
              </div>
            </div>
          </div>

          <!-- Lifetime Stats -->
          <div class="stats-section">
            <h3>Lifetime Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ lifetimeStats.averageWpm || 0 }}</div>
                <div class="stat-label">Average WPM</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ lifetimeStats.highestWpm || 0 }}</div>
                <div class="stat-label">Highest WPM</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ formatPercentage(lifetimeStats.averageAccuracy || 0) }}</div>
                <div class="stat-label">Accuracy</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ formatTime(lifetimeStats.totalTime || 0) }}</div>
                <div class="stat-label">Total Time</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ lifetimeStats.wordsCompleted || 0 }}</div>
                <div class="stat-label">Words Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ (lifetimeStats.lessonHistory?.length) || 0 }}</div>
                <div class="stat-label">Total Lessons</div>
              </div>
            </div>
          </div>

          <!-- Weakest Characters -->
          <div class="stats-section">
            <h3>Characters to Practice</h3>
            <div class="weakness-list">
              <div v-for="char in weakestChars" :key="char.character" class="weakness-item">
                <span class="weakness-char">"{{ char.character }}"</span>
                <span class="weakness-rate">{{ formatPercentage(char.mistakeRate * 100) }} errors</span>
                <span class="weakness-attempts">{{ char.total }} attempts</span>
              </div>
              <div v-if="weakestChars.length === 0" class="no-data">
                No character data available yet. Start typing to see your weaknesses!
              </div>
            </div>
          </div>

          <!-- Weakest Words -->
          <div class="stats-section">
            <h3>Words to Practice</h3>
            <div class="weakness-list">
              <div v-for="word in weakestWords" :key="word.word" class="weakness-item">
                <span class="weakness-word">"{{ word.word }}"</span>
                <span class="weakness-rate">{{ formatPercentage(word.mistakeRate * 100) }} errors</span>
                <span class="weakness-attempts">{{ word.total }} attempts</span>
              </div>
              <div v-if="weakestWords.length === 0" class="no-data">
                No word data available yet. Start typing to see your weaknesses!
              </div>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="stats-section">
            <h3>Performance Charts</h3>
            <div class="charts-grid">
              <div class="chart-card">
                <StatsChart 
                  :data="wpmChartData" 
                  type="bar" 
                  title="Average WPM Comparison" 
                />
              </div>
              <div class="chart-card">
                <StatsChart 
                  :data="accuracyChartData" 
                  type="bar" 
                  title="Accuracy Comparison" 
                />
              </div>
              <div class="chart-card">
                <StatsChart 
                  :data="characterMistakeChartData" 
                  type="bar" 
                  title="Character Mistake Rates" 
                />
              </div>
              <div class="chart-card wide">
                <StatsChart 
                  :data="progressChartData"
                  type="line"
                  title="Progress Over Lessons (WPM & Accuracy + Trends)"
                />
              </div>
            </div>
          </div>
          </div> <!-- Close v-else div -->

          <!-- Actions -->
          <div class="dashboard-actions">
            <button @click="refreshStats" class="action-btn">🔄 Refresh</button>
            <button @click="resetStats" class="action-btn danger">🗑️ Reset Stats</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  position: relative;
}

.dashboard-toggle {
  background-color: var(--keyword);
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
}

.dashboard-toggle:hover {
  background-color: #6d28d9;
}

.dashboard-overlay {
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

.dashboard-content {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.dashboard-header h2 {
  margin: 0;
  color: var(--font-color);
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

.dashboard-body {
  padding: 20px;
}

.stats-section {
  margin-bottom: 30px;
}

.stats-section h3 {
  margin: 0 0 15px 0;
  color: var(--font-color);
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat-card {
  background: var(--terminal-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 15px;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--keyword);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--gray);
}

.weakness-list {
  background: var(--terminal-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 15px;
}

.weakness-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.weakness-item:last-child {
  border-bottom: none;
}

.weakness-char,
.weakness-word {
  font-family: 'Consolas', monospace;
  color: var(--string);
  font-weight: bold;
}

.weakness-rate {
  color: var(--red);
  font-weight: bold;
}

.weakness-attempts {
  color: var(--gray);
  font-size: 0.85rem;
}

.no-data {
  text-align: center;
  color: var(--gray);
  font-style: italic;
  padding: 20px;
}

/* Login Prompt Styles */
.login-prompt-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.login-prompt-content {
  text-align: center;
  max-width: 500px;
}

.login-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.login-prompt-content h3 {
  color: var(--font-color);
  margin: 0 0 15px 0;
  font-size: 1.5rem;
}

.login-prompt-content p {
  color: var(--gray);
  margin: 0 0 25px 0;
  line-height: 1.5;
}

.login-benefits {
  margin: 25px 0;
  text-align: left;
  display: inline-block;
}

.benefit-item {
  color: var(--font-color);
  margin: 8px 0;
  font-size: 0.95rem;
}

.login-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 20px;
}

.login-btn:hover {
  background: #6d28d9;
}

.dashboard-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.action-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background: var(--function);
}

.action-btn.danger {
  background: var(--red);
}

.action-btn.danger:hover {
  background: #b91c1c;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.chart-card {
  background: var(--terminal-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 15px;
}
.chart-card.wide { grid-column: 1 / -1; height: 320px; }

@media (max-width: 768px) {
  .dashboard-content {
    width: 95%;
    margin: 10px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .weakness-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>
