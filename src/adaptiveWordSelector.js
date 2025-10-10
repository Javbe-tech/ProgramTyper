// Adaptive word selection system based on user weaknesses
import { userStatsService } from './services/userStatsService.js';
import { settingsService } from './services/settingsService.js';

class AdaptiveWordSelector {
  constructor(wordPool) {
    this.wordPool = wordPool;
    this.baseWeight = 1.0;
    this.weaknessMultiplier = 3.0;
    this.recentWords = [];
    this.maxRecentWords = 20;
  }

  // Get weighted word selection based on user weaknesses
  selectWords(count = 20) {
    const weakestChars = userStatsService.getWeakestCharacters();
    const weakestWords = userStatsService.getWeakestWords();
    
    // Create character weakness map
    const charWeaknessMap = new Map();
    weakestChars.forEach(char => {
      charWeaknessMap.set(char.character, char.mistakeRate);
    });

    // Create word weakness map
    const wordWeaknessMap = new Map();
    weakestWords.forEach(word => {
      wordWeaknessMap.set(word.word, word.mistakeRate);
    });

    // Calculate weights for each word
    const weightedWords = this.wordPool.map(word => ({
      word,
      weight: this.calculateWordWeight(word, charWeaknessMap, wordWeaknessMap)
    }));

    // Sort by weight (higher weight = more likely to be selected)
    weightedWords.sort((a, b) => b.weight - a.weight);

    // Select words using weighted random selection
    const selectedWords = [];
    for (let i = 0; i < count; i++) {
      const word = this.weightedRandomSelect(weightedWords);
      if (word && !this.recentWords.includes(word)) {
        selectedWords.push(word);
        this.recentWords.push(word);
        
        // Maintain recent words list
        if (this.recentWords.length > this.maxRecentWords) {
          this.recentWords.shift();
        }
      }
    }

    // Inject targeted practice to ensure coverage of under-practiced letters (z, x, q, j, k, v, y, g, p)
    this.ensureLetterCoverage(selectedWords, count);

    // If we don't have enough unique words, fill with random words
    while (selectedWords.length < count) {
      const randomWord = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
      if (!selectedWords.includes(randomWord)) {
        selectedWords.push(randomWord);
      }
    }

    return selectedWords;
  }

  // Calculate weight for a word based on weaknesses
  calculateWordWeight(word, charWeaknessMap, wordWeaknessMap) {
    let weight = this.baseWeight;

    // Check if this specific word is weak
    if (wordWeaknessMap.has(word)) {
      weight += wordWeaknessMap.get(word) * this.weaknessMultiplier;
    }

    // Check for weak characters in the word
    const wordChars = word.split('');
    let weakCharCount = 0;
    let totalWeakness = 0;

    wordChars.forEach(char => {
      if (charWeaknessMap.has(char)) {
        weakCharCount++;
        totalWeakness += charWeaknessMap.get(char);
      }
    });

    // Increase weight based on weak characters
    if (weakCharCount > 0) {
      const avgWeakness = totalWeakness / weakCharCount;
      weight += avgWeakness * this.weaknessMultiplier * (weakCharCount / wordChars.length);
    }

    // Slight penalty for very recent words to avoid repetition
    if (this.recentWords.includes(word)) {
      weight *= 0.5;
    }

    // Bonus for words with common weak character combinations
    weight += this.getCombinationBonus(word, charWeaknessMap);

    return weight;
  }

  // Ensure the selection contains words featuring letters users rarely type or struggle with
  ensureLetterCoverage(selectedWords, targetCount) {
    if (!Array.isArray(selectedWords) || selectedWords.length === 0) return;

    // Identify letters with low exposure or high mistake rate
    const lifetimeChars = userStatsService.getStatsSummary().lifetime.characterStats || {};
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

    const letterScores = alphabet.map(letter => {
      const stats = lifetimeChars[letter] || { total: 0, mistakes: 0 };
      const total = stats.total || 0;
      const mistakeRate = total > 0 ? stats.mistakes / total : 0.0;
      // Lower totals and higher mistake rates should increase priority
      const scarcity = Math.max(0, 50 - Math.min(50, total)); // cap to 50 for stability
      const score = scarcity / 50 + mistakeRate; // 0..2 scale approx
      return { letter, total, mistakeRate, score };
    });

    // Focus on top N letters needing practice; always include some rare letters commonly missed
    const guaranteedRare = ['z', 'x', 'q', 'j', 'k', 'v'];
    guaranteedRare.forEach(l => {
      if (!letterScores.find(s => s.letter === l)) {
        letterScores.push({ letter: l, total: 0, mistakeRate: 0, score: 1 });
      }
    });

    letterScores.sort((a, b) => b.score - a.score);
    const targetLetters = letterScores.slice(0, Math.max(2, Math.floor(targetCount * 0.2)));

    // For each target letter, try to ensure at least one word containing it is present
    targetLetters.forEach(({ letter }) => {
      const hasLetter = selectedWords.some(w => w.includes(letter));
      if (!hasLetter) {
        const candidates = this.getCharacterPracticeWords(letter, 25);
        const replacement = candidates.find(w => !selectedWords.includes(w));
        if (replacement) {
          // Replace the weakest-weight word to keep list size constant
          const replaceIndex = this.findReplacementIndex(selectedWords);
          if (replaceIndex === -1) {
            selectedWords.push(replacement);
          } else {
            selectedWords.splice(replaceIndex, 1, replacement);
          }
        }
      }
    });
  }

  findReplacementIndex(words) {
    if (!words.length) return -1;
    // Prefer to replace duplicates first
    const seen = new Set();
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (seen.has(w)) return i;
      seen.add(w);
    }
    // Otherwise, replace a random index
    return Math.floor(Math.random() * words.length);
  }

  // Get bonus weight for common weak character combinations
  getCombinationBonus(word, charWeaknessMap) {
    let bonus = 0;
    
    // Common weak combinations
    const weakCombinations = [
      'th', 'he', 'in', 'er', 'an', 're', 'nd', 'on', 'en', 'at',
      'ou', 'ed', 'ha', 'to', 'or', 'it', 'is', 'as', 'we', 'be'
    ];

    weakCombinations.forEach(combo => {
      if (word.includes(combo)) {
        const char1Weakness = charWeaknessMap.get(combo[0]) || 0;
        const char2Weakness = charWeaknessMap.get(combo[1]) || 0;
        bonus += (char1Weakness + char2Weakness) * 0.5;
      }
    });

    return bonus;
  }

  // Weighted random selection
  weightedRandomSelect(weightedWords) {
    const totalWeight = weightedWords.reduce((sum, item) => sum + item.weight, 0);
    
    if (totalWeight === 0) {
      return this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    }

    let random = Math.random() * totalWeight;
    
    for (const item of weightedWords) {
      random -= item.weight;
      if (random <= 0) {
        return item.word;
      }
    }

    return weightedWords[0].word;
  }

  // Generate a sentence with adaptive word selection
  generateAdaptiveSentence(wordCount = 20) {
    const selectedWords = this.selectWords(wordCount);
    return settingsService.applySettingsToSentence(selectedWords);
  }

  // Get words that contain specific weak characters
  getWordsWithWeakChars(weakChars, count = 10) {
    const wordsWithWeakChars = this.wordPool.filter(word => {
      return weakChars.some(char => word.includes(char));
    });

    // Sort by number of weak characters (more weak chars = higher priority)
    wordsWithWeakChars.sort((a, b) => {
      const aWeakCount = weakChars.filter(char => a.includes(char)).length;
      const bWeakCount = weakChars.filter(char => b.includes(char)).length;
      return bWeakCount - aWeakCount;
    });

    return wordsWithWeakChars.slice(0, count);
  }

  // Get words for specific character practice
  getCharacterPracticeWords(targetChar, count = 15) {
    const wordsWithChar = this.wordPool.filter(word => word.includes(targetChar));
    
    // Sort by frequency of the character in the word
    wordsWithChar.sort((a, b) => {
      const aCount = (a.match(new RegExp(targetChar, 'g')) || []).length;
      const bCount = (b.match(new RegExp(targetChar, 'g')) || []).length;
      return bCount - aCount;
    });

    return wordsWithChar.slice(0, count);
  }

  // Reset recent words (useful for new sessions)
  resetRecentWords() {
    this.recentWords = [];
  }

  // Update word pool
  updateWordPool(newWordPool) {
    this.wordPool = newWordPool;
  }
}

export { AdaptiveWordSelector };
