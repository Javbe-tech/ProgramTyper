// Google OAuth Authentication Service using Google Identity Services
class AuthService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Only initialize if we have a valid client ID
      if (this.googleClientId && this.googleClientId !== 'your-google-client-id') {
        console.log('Initializing Google Auth with Client ID:', this.googleClientId);
        
        // Load Google Identity Services script
        await this.loadGoogleScript();
        
        // Initialize Google Identity Services
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: this.googleClientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: true,  // Enable FedCM as Google is making it mandatory
            itp_support: true  // Enable Intelligent Tracking Prevention support
          });
          console.log('Google Identity Services initialized successfully');
        }
      } else {
        console.warn('Google Client ID not configured:', this.googleClientId);
      }

      // Check if user is already logged in
      this.checkExistingAuth();
    } catch (error) {
      // Silently fail if Google Auth is not configured
      console.warn('Google Auth not configured, running in guest mode:', error);
    }
  }

  loadGoogleScript() {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  checkExistingAuth() {
    try {
      const userInfo = localStorage.getItem('user_info');
      const token = localStorage.getItem('google_auth_token');
      
      if (userInfo && token) {
        this.user = JSON.parse(userInfo);
        this.isAuthenticated = true;
        // User already authenticated
      }
    } catch (error) {
      console.error('Error checking existing auth:', error);
      this.logout();
    }
  }

  async login() {
    try {
      if (!window.google || this.googleClientId === 'your-google-client-id') {
        throw new Error('Google Authentication not configured. Please set up Google OAuth to enable login.');
      }

      console.log('Starting Google login process...');
      
      // Use the One Tap method which is more reliable than FedCM
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('One Tap not displayed, trying alternative method');
          // If One Tap doesn't work, show a message to the user
          alert('Please try logging in using the popup that should appear, or check if pop-ups are blocked.');
        }
      });
      
      return new Promise((resolve, reject) => {
        this.loginResolve = resolve;
        this.loginReject = reject;
        
        // Set a timeout for the login process
        setTimeout(() => {
          if (this.loginReject) {
            this.loginReject(new Error('Login timeout - please try again'));
            this.loginResolve = null;
            this.loginReject = null;
          }
        }, 30000); // 30 second timeout
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  handleCredentialResponse(response) {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const userInfo = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name
      };

      this.user = userInfo;
      this.isAuthenticated = true;
      localStorage.setItem('google_auth_token', response.credential);
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      
      // User logged in successfully
      console.log('User logged in successfully:', userInfo);
      
      // Resolve the login promise
      if (this.loginResolve) {
        this.loginResolve(userInfo);
        this.loginResolve = null;
        this.loginReject = null;
      }
    } catch (error) {
      console.error('Error handling credential response:', error);
      
      // Reject the login promise
      if (this.loginReject) {
        this.loginReject(error);
        this.loginResolve = null;
        this.loginReject = null;
      }
    }
  }

  logout() {
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('google_auth_token');
    localStorage.removeItem('user_info');
    
    // Clear Google Identity Services state if available
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.warn('Could not disable Google auto-select:', error);
      }
    }
    
    console.log('User logged out successfully');
  }

  getUser() {
    return this.user;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Get user stats from localStorage (will be enhanced with backend later)
  getUserStats() {
    if (!this.isAuthenticated) return null;
    
    const userStats = localStorage.getItem(`user_stats_${this.user.id}`);
    return userStats ? JSON.parse(userStats) : null;
  }

  // Save user stats to localStorage (will be enhanced with backend later)
  saveUserStats(stats) {
    if (!this.isAuthenticated) return false;
    
    try {
      localStorage.setItem(`user_stats_${this.user.id}`, JSON.stringify(stats));
      // User stats saved successfully
      return true;
    } catch (error) {
      console.error('Failed to save user stats:', error);
      return false;
    }
  }

  // Load user stats on login
  loadUserStats() {
    if (!this.isAuthenticated) return null;
    
    const savedStats = this.getUserStats();
    if (savedStats) {
      // User stats loaded
      return savedStats;
    }
    
    return null;
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;
