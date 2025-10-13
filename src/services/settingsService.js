// Settings service to manage typing preferences
class SettingsService {
  constructor() {
    this.defaultSettings = {
      enableCapitals: false,
      enablePeriods: false,
      enableWordCapitals: false,
      enableSpecialChars: false,
      fadedWordsBrightness: 0.5,
      typingSoundId: 1,
      errorSoundId: 2,
      soundVolume: 0.5
    };
    this.settings = { ...this.defaultSettings };
    this.loadSettings();
  }

  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('pt_typing_settings');
      if (savedSettings) {
        this.settings = { ...this.defaultSettings, ...JSON.parse(savedSettings) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('pt_typing_settings', JSON.stringify(this.settings));
  }

  // Apply settings to generate a sentence
  applySettingsToSentence(words) {
    let sentence = words.join(' ');
    
    // Apply capitals at start of sentences
    if (this.settings.enableCapitals) {
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    
    // Apply capitals for every word (Title Case)
    if (this.settings.enableWordCapitals) {
      sentence = sentence.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    
    // Add periods at end of sentences
    if (this.settings.enablePeriods && !sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
      sentence += '.';
    }
    
    // Add special programming characters
    if (this.settings.enableSpecialChars) {
      sentence = this.addSpecialCharacters(sentence);
    }
    
    return sentence;
  }

  addSpecialCharacters(sentence) {
    const specialChars = ['[', '{', '/', ':', "'", '"', ',', '>', '<', '}', ']', '(', ')', ';', '=', '+', '-', '*', '%'];
    const words = sentence.split(' ');
    
    // Randomly add special characters to some words
    return words.map((word, index) => {
      if (Math.random() < 0.3) { // 30% chance to add special chars
        const char = specialChars[Math.floor(Math.random() * specialChars.length)];
        const position = Math.random() < 0.5 ? 'before' : 'after';
        return position === 'before' ? char + word : word + char;
      }
      return word;
    }).join(' ');
  }
}

export const settingsService = new SettingsService();
