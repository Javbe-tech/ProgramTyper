// Enhanced User Statistics Service with Google Account Integration
import { authService } from './authService.js';

class UserStatsService {
  constructor() {
    this.stats = null;
    this.currentSession = {
      startTime: null,
      totalTime: 0,
      totalStrokes: 0,
      correctStrokes: 0,
      mistakes: 0,
      wordsCompleted: 0,
      characterStats: {},
      wordStats: {},
      highestLineWpm: 0
    };
    
    // Initialize stats when user logs in
    this.initializeStats();
  }

  initializeStats() {
    if (authService.isUserAuthenticated()) {
      this.loadUserStats();
    } else {
      this.loadGuestStats();
    }
  }

  // Load stats for authenticated user
  loadUserStats() {
    const savedStats = authService.getUserStats();
    if (savedStats) {
      this.stats = savedStats;
      console.log('User stats loaded from account');
    } else {
      // Check if there are guest stats to migrate
      const guestStats = this.getGuestStats();
      if (guestStats && this.hasSignificantGuestData(guestStats)) {
        console.log('Migrating guest stats to user account');
        this.stats = this.migrateGuestStatsToUser(guestStats);
        this.saveUserStats();
        // Clear guest stats after migration
        localStorage.removeItem('guest_typing_stats');
        
        // Show migration notification (you could emit an event here)
        console.log('✅ Guest stats successfully migrated to your Google account!');
      } else {
        this.stats = this.getDefaultStats();
        this.saveUserStats();
      }
    }
  }

  // Load stats for guest user (localStorage only)
  loadGuestStats() {
    try {
      const savedStats = localStorage.getItem('guest_typing_stats');
      this.stats = savedStats ? JSON.parse(savedStats) : this.getDefaultStats();
    } catch (error) {
      console.error('Error loading guest stats:', error);
      this.stats = this.getDefaultStats();
    }
  }

  // Get guest stats from localStorage
  getGuestStats() {
    try {
      const savedStats = localStorage.getItem('guest_typing_stats');
      return savedStats ? JSON.parse(savedStats) : null;
    } catch (error) {
      console.error('Error getting guest stats:', error);
      return null;
    }
  }

  // Check if guest stats have significant data worth migrating
  hasSignificantGuestData(guestStats) {
    return guestStats && (
      guestStats.lifetime.totalTime > 60 || // More than 1 minute of typing
      guestStats.lifetime.wordsCompleted > 10 || // More than 10 words
      guestStats.lifetime.sessionsCompleted > 0 // At least one session
    );
  }

  // Migrate guest stats to user account format
  migrateGuestStatsToUser(guestStats) {
    const userStats = this.getDefaultStats();
    
    // Migrate all the data from guest stats
    userStats.lifetime = { ...guestStats.lifetime };
    userStats.currentDay = { ...guestStats.currentDay };
    
    // Update user info to reflect authenticated status
    userStats.userInfo.accountType = 'google';
    userStats.userInfo.userId = authService.getUser()?.id;
    userStats.userInfo.createdAt = guestStats.userInfo?.createdAt || new Date().toISOString();
    userStats.userInfo.lastActive = new Date().toISOString();
    
    return userStats;
  }

  getDefaultStats() {
    return {
      lifetime: {
        totalTime: 0,
        totalStrokes: 0,
        correctStrokes: 0,
        mistakes: 0,
        wordsCompleted: 0,
        sessionsCompleted: 0,
        averageWpm: 0,
        highestWpm: 0,
        averageAccuracy: 0,
        characterStats: {},
        wordStats: {},
        dailyStats: {},
        sessionHistory: [], // each: { wpm, accuracy, timestamp } (per session)
        lessonHistory: []   // each: { wpm, accuracy, timestamp } (per typable line)
      },
      currentDay: {
        date: new Date().toDateString(),
        totalTime: 0,
        totalStrokes: 0,
        correctStrokes: 0,
        mistakes: 0,
        wordsCompleted: 0,
        sessionsCompleted: 0,
        averageWpm: 0,
        highestWpm: 0,
        averageAccuracy: 0,
        characterStats: {},
        wordStats: {},
        lessonHistory: []
      },
      userInfo: {
        accountType: authService.isUserAuthenticated() ? 'google' : 'guest',
        userId: authService.isUserAuthenticated() ? authService.getUser()?.id : 'guest',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }
    };
  }

  // Save stats based on user type
  saveUserStats() {
    if (authService.isUserAuthenticated()) {
      // Save to user account
      const success = authService.saveUserStats(this.stats);
      if (success) {
        // User stats saved
      }
    } else {
      // Save to localStorage for guest
      try {
        localStorage.setItem('guest_typing_stats', JSON.stringify(this.stats));
        // Guest stats saved
      } catch (error) {
        console.error('Error saving guest stats:', error);
      }
    }
  }

  // Start a new typing session
  startSession() {
    this.currentSession = {
      startTime: new Date(),
      totalTime: 0,
      totalStrokes: 0,
      correctStrokes: 0,
      mistakes: 0,
      wordsCompleted: 0,
      characterStats: {},
      wordStats: {},
      highestLineWpm: 0
    };
    
    // Update last active time
    this.stats.userInfo.lastActive = new Date().toISOString();
    this.saveUserStats();
  }

  // Record the WPM for a completed line to track peak speed
  recordLineResult(lineWpm) {
    if (!this.currentSession.startTime) return;
    if (!this.stats) {
      console.warn('Stats not initialized, cannot record line result');
      return;
    }
    
    if (typeof lineWpm === 'number' && lineWpm > this.currentSession.highestLineWpm) {
      this.currentSession.highestLineWpm = lineWpm;
    }
    // Track today's highest based on line peaks
    if (lineWpm > this.stats.currentDay.highestWpm) {
      this.stats.currentDay.highestWpm = lineWpm;
    }
  }

  // Record a completed lesson (typable line) with both WPM and accuracy
  recordLessonResult(wpm, accuracy) {
    if (!this.stats) {
      console.warn('Stats not initialized, cannot record lesson result');
      return;
    }
    
    const now = Date.now();
    const lessonData = { wpm: Number(wpm) || 0, accuracy: Number(accuracy) || 0, timestamp: now };
    
    // Ensure arrays exist before pushing
    if (!this.stats.lifetime.lessonHistory) {
      this.stats.lifetime.lessonHistory = [];
    }
    if (!this.stats.currentDay.lessonHistory) {
      this.stats.currentDay.lessonHistory = [];
    }
    
    this.stats.lifetime.lessonHistory.push(lessonData);
    this.stats.currentDay.lessonHistory.push(lessonData);
  }

  // Record a character input
  recordCharacter(char, isCorrect, word = null) {
    if (!this.currentSession.startTime) return;

    this.currentSession.totalStrokes++;
    if (isCorrect) {
      this.currentSession.correctStrokes++;
    } else {
      this.currentSession.mistakes++;
    }

    // Track character statistics
    const charKey = char.toLowerCase();
    if (!this.currentSession.characterStats[charKey]) {
      this.currentSession.characterStats[charKey] = { total: 0, mistakes: 0 };
    }
    this.currentSession.characterStats[charKey].total++;
    if (!isCorrect) {
      this.currentSession.characterStats[charKey].mistakes++;
    }

    // Note: word-level mistakes are calculated on completion; avoid
    // inflating by attributing every char to the entire line as a word.
  }

  // Complete a word
  completeWord(word, timeTaken, isCorrect = true) {
    if (!this.currentSession.startTime) return;
    if (!this.stats) {
      console.warn('Stats not initialized, cannot complete word');
      return;
    }

    this.currentSession.wordsCompleted++;
    
    // Update word statistics
    const wordKey = word.toLowerCase();
    if (!this.stats.lifetime.wordStats[wordKey]) {
      this.stats.lifetime.wordStats[wordKey] = { 
        total: 0, 
        mistakes: 0, 
        totalTime: 0,
        averageTime: 0
      };
    }
    
    this.stats.lifetime.wordStats[wordKey].total++;
    this.stats.lifetime.wordStats[wordKey].totalTime += timeTaken;
    this.stats.lifetime.wordStats[wordKey].averageTime = 
      this.stats.lifetime.wordStats[wordKey].totalTime / 
      this.stats.lifetime.wordStats[wordKey].total;
    
    // Track word-level mistakes
    if (!isCorrect) {
      this.stats.lifetime.wordStats[wordKey].mistakes++;
    }
    
    // Also track in current session for merging later
    if (!this.currentSession.wordStats[wordKey]) {
      this.currentSession.wordStats[wordKey] = { total: 0, mistakes: 0 };
    }
    this.currentSession.wordStats[wordKey].total++;
    if (!isCorrect) {
      this.currentSession.wordStats[wordKey].mistakes++;
    }

    // Note: do not update current day stats here; updated only when a session ends
  }

  // End the current session
  endSession() {
    if (!this.currentSession.startTime) return;
    if (!this.stats) {
      console.warn('Stats not initialized, cannot end session');
      return;
    }

    const sessionDuration = (new Date() - this.currentSession.startTime) / 1000;
    this.currentSession.totalTime = sessionDuration;

    // Calculate session WPM
    const sessionWpm = this.calculateWpm(
      this.currentSession.correctStrokes,
      sessionDuration
    );

    // Update lifetime statistics
    this.stats.lifetime.totalTime += sessionDuration;
    this.stats.lifetime.totalStrokes += this.currentSession.totalStrokes;
    this.stats.lifetime.correctStrokes += this.currentSession.correctStrokes;
    this.stats.lifetime.mistakes += this.currentSession.mistakes;
    this.stats.lifetime.wordsCompleted += this.currentSession.wordsCompleted;
    this.stats.lifetime.sessionsCompleted++;

    // Update highest WPM (use best line in session OR session average)
    const peakThisSession = Math.max(this.currentSession.highestLineWpm || 0, sessionWpm || 0);
    if (peakThisSession > this.stats.lifetime.highestWpm) {
      this.stats.lifetime.highestWpm = peakThisSession;
    }

    // Update averages
    this.stats.lifetime.averageWpm = this.calculateWpm(
      this.stats.lifetime.correctStrokes,
      this.stats.lifetime.totalTime
    );
    this.stats.lifetime.averageAccuracy = this.calculateAccuracy(
      this.stats.lifetime.correctStrokes,
      this.stats.lifetime.totalStrokes
    );

    // Record session history point
    const sessionAccuracy = this.calculateAccuracy(
      this.currentSession.correctStrokes,
      this.currentSession.totalStrokes
    );
    this.stats.lifetime.sessionHistory.push({
      wpm: sessionWpm,
      accuracy: sessionAccuracy,
      timestamp: Date.now()
    });

    // Merge character and word stats
    this.mergeCharacterStats();
    this.mergeWordStats();

    // Update current day stats
    this.updateCurrentDayStats();

    // Save updated stats
    this.saveUserStats();

    // Session ended and stats updated
  }

  updateCurrentDayStats() {
    const today = new Date().toDateString();
    
    // Reset current day if it's a new day
    if (this.stats.currentDay.date !== today) {
      this.stats.currentDay = {
        date: today,
        totalTime: 0,
        totalStrokes: 0,
        correctStrokes: 0,
        mistakes: 0,
        wordsCompleted: 0,
        sessionsCompleted: 0,
        averageWpm: 0,
        highestWpm: 0,
        averageAccuracy: 0,
        characterStats: {},
        wordStats: {}
      };
    }

    // Update current day with session data
    this.stats.currentDay.totalTime += this.currentSession.totalTime;
    this.stats.currentDay.totalStrokes += this.currentSession.totalStrokes;
    this.stats.currentDay.correctStrokes += this.currentSession.correctStrokes;
    this.stats.currentDay.mistakes += this.currentSession.mistakes;
    this.stats.currentDay.wordsCompleted += this.currentSession.wordsCompleted;
    this.stats.currentDay.sessionsCompleted++;

    // Update current day averages
    this.stats.currentDay.averageWpm = this.calculateWpm(
      this.stats.currentDay.correctStrokes,
      this.stats.currentDay.totalTime
    );
    this.stats.currentDay.averageAccuracy = this.calculateAccuracy(
      this.stats.currentDay.correctStrokes,
      this.stats.currentDay.totalStrokes
    );

    // Update daily highest WPM
    const sessionWpm = this.calculateWpm(
      this.currentSession.correctStrokes,
      this.currentSession.totalTime
    );
    if (sessionWpm > this.stats.currentDay.highestWpm) {
      this.stats.currentDay.highestWpm = sessionWpm;
    }
  }

  mergeCharacterStats() {
    Object.keys(this.currentSession.characterStats).forEach(char => {
      if (!this.stats.lifetime.characterStats[char]) {
        this.stats.lifetime.characterStats[char] = { total: 0, mistakes: 0 };
      }
      this.stats.lifetime.characterStats[char].total += 
        this.currentSession.characterStats[char].total;
      this.stats.lifetime.characterStats[char].mistakes += 
        this.currentSession.characterStats[char].mistakes;
    });
  }

  mergeWordStats() {
    Object.keys(this.currentSession.wordStats).forEach(word => {
      if (!this.stats.lifetime.wordStats[word]) {
        this.stats.lifetime.wordStats[word] = { total: 0, mistakes: 0 };
      }
      this.stats.lifetime.wordStats[word].total += 
        this.currentSession.wordStats[word].total;
      this.stats.lifetime.wordStats[word].mistakes += 
        this.currentSession.wordStats[word].mistakes;
    });
  }

  calculateWpm(correctStrokes, timeInSeconds) {
    if (timeInSeconds === 0) return 0;
    const words = correctStrokes / 5; // Average word length is 5 characters
    const minutes = timeInSeconds / 60;
    return Math.round(words / minutes);
  }

  calculateAccuracy(correctStrokes, totalStrokes) {
    if (totalStrokes === 0) return 100;
    return Math.round((correctStrokes / totalStrokes) * 100);
  }

  // Get statistics summary
  getStatsSummary() {
    // Create a non-persisted, live view that includes the active session
    const clone = JSON.parse(JSON.stringify(this.stats));

    // Merge current session into current day (preview only)
    if (this.currentSession.startTime) {
      clone.currentDay.totalTime = this.stats.currentDay.totalTime + this.currentSession.totalTime;
      clone.currentDay.totalStrokes = this.stats.currentDay.totalStrokes + this.currentSession.totalStrokes;
      clone.currentDay.correctStrokes = this.stats.currentDay.correctStrokes + this.currentSession.correctStrokes;
      clone.currentDay.mistakes = this.stats.currentDay.mistakes + this.currentSession.mistakes;
      clone.currentDay.wordsCompleted = this.stats.currentDay.wordsCompleted + this.currentSession.wordsCompleted;
      // Do not increase sessionsCompleted until endSession
      clone.currentDay.averageWpm = this.calculateWpm(
        clone.currentDay.correctStrokes,
        clone.currentDay.totalTime
      );
      clone.currentDay.averageAccuracy = this.calculateAccuracy(
        clone.currentDay.correctStrokes,
        clone.currentDay.totalStrokes
      );

      // Live preview of lifetime aggregates without mutating actual saved stats
      const liveLifetimeCorrect = this.stats.lifetime.correctStrokes + this.currentSession.correctStrokes;
      const liveLifetimeTotal = this.stats.lifetime.totalStrokes + this.currentSession.totalStrokes;
      const liveLifetimeTime = this.stats.lifetime.totalTime + this.currentSession.totalTime;
      clone.lifetime.averageWpm = this.calculateWpm(liveLifetimeCorrect, liveLifetimeTime);
      clone.lifetime.averageAccuracy = this.calculateAccuracy(liveLifetimeCorrect, liveLifetimeTotal);
      // Live highest WPM uses current session peak if higher
      clone.lifetime.highestWpm = Math.max(
        this.stats.lifetime.highestWpm,
        this.currentSession.highestLineWpm || 0
      );
    }

    return {
      lifetime: clone.lifetime,
      currentDay: clone.currentDay,
      userInfo: clone.userInfo,
      weakestCharacters: this.getWeakestCharacters(),
      weakestWords: this.getWeakestWords()
    };
  }

  getWeakestCharacters() {
    return Object.entries(this.stats.lifetime.characterStats)
      .map(([char, stats]) => ({
        character: char,
        mistakeRate: stats.total > 0 ? stats.mistakes / stats.total : 0,
        total: stats.total,
        mistakes: stats.mistakes
      }))
      .filter(item => item.total >= 5 && item.mistakeRate > 0) // Only show characters with actual mistakes
      .sort((a, b) => b.mistakeRate - a.mistakeRate)
      .slice(0, 15); // Limit to top 15 problematic characters
  }

  getWeakestWords() {
    return Object.entries(this.stats.lifetime.wordStats)
      .map(([word, stats]) => ({
        word: word,
        mistakeRate: stats.total > 0 ? stats.mistakes / stats.total : 0,
        total: stats.total,
        mistakes: stats.mistakes,
        averageTime: stats.averageTime || 0
      }))
      .filter(item => item.total >= 3 && item.mistakeRate > 0) // Only show words with actual mistakes
      .sort((a, b) => b.mistakeRate - a.mistakeRate)
      .slice(0, 10);
  }

  // Reset all statistics
  resetStats() {
    this.stats = this.getDefaultStats();
    this.saveUserStats();
    // Statistics reset
  }

  // Handle user login/logout
  onUserLogin() {
    console.log('User logged in, switching to authenticated stats');
    this.initializeStats();
  }

  onUserLogout() {
    console.log('User logged out, switching to guest stats');
    
    // Save current session if active
    if (this.currentSession.startTime) {
      this.endSession();
    }
    
    // Switch to guest mode
    this.initializeStats();
  }
}

// Create singleton instance
export const userStatsService = new UserStatsService();
export default userStatsService;
