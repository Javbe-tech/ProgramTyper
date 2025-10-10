<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close']);

function closeModal() {
  emit('close');
}
</script>

<template>
  <div class="help-overlay" @click.self="closeModal">
    <div class="help-content" @click.stop>
      <div class="help-header">
        <h2>ProgramTyper Help & Instructions</h2>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="help-body">
        <!-- How to Play Section -->
        <div class="help-section">
          <h3>🎯 How to Play</h3>
          <div class="help-content-text">
            <p><strong>ProgramTyper</strong> is a typing game that helps you learn to code faster by practicing typing real code snippets.</p>
            
            <div class="feature-list">
              <div class="feature-item">
                <span class="feature-icon">⌨️</span>
                <div>
                  <strong>Type the Code:</strong> Type the highlighted code lines exactly as shown
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <div>
                  <strong>Track Progress:</strong> Your WPM and accuracy are tracked in real-time
                </div>
              </div>
              
              <div class="feature-item">
                <span class="feature-icon">🏆</span>
                <div>
                  <strong>Complete Challenges:</strong> Finish all lines in a file to unlock new files
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Features Section -->
        <div class="help-section">
          <h3>✨ Features</h3>
          <div class="features-grid">
            <div class="feature-card">
              <h4>📈 Real-time Stats</h4>
              <p>See your WPM and accuracy update as you type</p>
            </div>
            
            <div class="feature-card">
              <h4>🎨 Multiple Themes</h4>
              <p>Choose from Default, Matrix, Black & White, and more</p>
            </div>
            
            <div class="feature-card">
              <h4>📊 Detailed Analytics</h4>
              <p>View comprehensive stats in the Dashboard</p>
            </div>
            
            <div class="feature-card">
              <h4>🔐 Google Login</h4>
              <p>Save your progress across devices</p>
            </div>
            
            <div class="feature-card">
              <h4>📁 File System</h4>
              <p>Practice with real programming files and structures</p>
            </div>
            
            <div class="feature-card">
              <h4>🎯 Adaptive Challenges</h4>
              <p>New challenges regenerate automatically</p>
            </div>
          </div>
        </div>

        <!-- Controls Section -->
        <div class="help-section">
          <h3>🎮 Controls & Interface</h3>
          <div class="controls-list">
            <div class="control-item">
              <span class="control-key">Terminal</span>
              <span class="control-desc">Toggle terminal visibility (shows/hides stats)</span>
            </div>
            
            <div class="control-item">
              <span class="control-key">View</span>
              <span class="control-desc">Change themes and visual settings</span>
            </div>
            
            <div class="control-item">
              <span class="control-key">📊 Dashboard</span>
              <span class="control-desc">View detailed statistics and progress</span>
            </div>
            
            <div class="control-item">
              <span class="control-key">👤 Sign In</span>
              <span class="control-desc">Save progress to Google account</span>
            </div>
          </div>
        </div>

        <!-- Tips Section -->
        <div class="help-section">
          <h3>💡 Pro Tips</h3>
          <div class="tips-list">
            <div class="tip-item">
              <span class="tip-number">1</span>
              <p><strong>Focus on Accuracy First:</strong> Speed will come naturally with practice</p>
            </div>
            
            <div class="tip-item">
              <span class="tip-number">2</span>
              <p><strong>Use Proper Finger Placement:</strong> Keep your fingers on the home row</p>
            </div>
            
            <div class="tip-item">
              <span class="tip-number">3</span>
              <p><strong>Practice Daily:</strong> Even 10-15 minutes daily makes a big difference</p>
            </div>
            
            <div class="tip-item">
              <span class="tip-number">4</span>
              <p><strong>Check Your Stats:</strong> Use the Dashboard to identify problem areas</p>
            </div>
            
            <div class="tip-item">
              <span class="tip-number">5</span>
              <p><strong>Sign In:</strong> Save your progress to track improvement over time</p>
            </div>
          </div>
        </div>

        <!-- Scoring Section -->
        <div class="help-section">
          <h3>📊 Scoring System</h3>
          <div class="scoring-info">
            <div class="score-item">
              <span class="score-label">WPM (Words Per Minute):</span>
              <span class="score-desc">Based on 5 characters = 1 word</span>
            </div>
            
            <div class="score-item">
              <span class="score-label">Accuracy:</span>
              <span class="score-desc">Percentage of correct keystrokes</span>
            </div>
            
            <div class="score-item">
              <span class="score-label">Status Colors:</span>
              <span class="score-desc">🟢 Above average | 🔴 Below average</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="help-footer">
        <button @click="closeModal" class="got-it-btn">Got it! Let's start typing! 🚀</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.help-overlay {
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

.help-content {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.help-header h2 {
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

.help-body {
  padding: 20px;
}

.help-section {
  margin-bottom: 30px;
}

.help-section h3 {
  margin: 0 0 15px 0;
  color: var(--font-color);
  font-size: 1.2rem;
  border-bottom: 2px solid var(--keyword);
  padding-bottom: 5px;
}

.help-content-text p {
  margin: 0 0 15px 0;
  color: var(--gray);
  line-height: 1.5;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.feature-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.feature-item div {
  color: var(--gray);
  line-height: 1.4;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.feature-card {
  background: var(--terminal-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 15px;
}

.feature-card h4 {
  margin: 0 0 8px 0;
  color: var(--font-color);
  font-size: 1rem;
}

.feature-card p {
  margin: 0;
  color: var(--gray);
  font-size: 0.9rem;
  line-height: 1.4;
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.control-key {
  font-family: 'Consolas', monospace;
  background: var(--keyword);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: bold;
}

.control-desc {
  color: var(--gray);
  font-size: 0.9rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.tip-number {
  background: var(--keyword);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.tip-item p {
  margin: 0;
  color: var(--gray);
  line-height: 1.4;
}

.scoring-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.score-label {
  font-weight: bold;
  color: var(--font-color);
}

.score-desc {
  color: var(--gray);
  font-size: 0.9rem;
}

.help-footer {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.got-it-btn {
  background: var(--keyword);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.got-it-btn:hover {
  background: #6d28d9;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .help-content {
    width: 95%;
    margin: 10px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .control-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .score-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>
