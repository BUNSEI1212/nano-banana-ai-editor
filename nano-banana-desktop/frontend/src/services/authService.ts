// Authentication service for Casdoor integration
export interface User {
  userId: string;
  email: string;
  roles: string[];
  plan: string;
  usage: {
    genCount: number;
    editCount: number;
    creditsRemaining: number;
  };
}

export interface LoginConfig {
  casdoorEndpoint: string;
  proxyEndpoint: string;
  clientId: string;
  organizationName: string;
  applicationName: string;
  redirectUri: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private config: LoginConfig;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      casdoorEndpoint: import.meta.env.VITE_CASDOOR_ENDPOINT || 'http://localhost:8000',
      proxyEndpoint: import.meta.env.VITE_PROXY_ENDPOINT || 'http://localhost:3001',
      clientId: import.meta.env.VITE_CASDOOR_CLIENT_ID || '',
      organizationName: import.meta.env.VITE_CASDOOR_ORGANIZATION_NAME || 'built-in',
      applicationName: import.meta.env.VITE_CASDOOR_APPLICATION_NAME || 'nano-banana-app',
      redirectUri: import.meta.env.VITE_CASDOOR_REDIRECT_URI || window.location.origin + '/oauth/callback'
    };

    // Load token from localStorage on initialization
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      this.token = storedToken;
    }
  }

  private saveTokenToStorage(token: string) {
    localStorage.setItem('auth_token', token);
    this.token = token;
  }

  private clearTokenFromStorage() {
    localStorage.removeItem('auth_token');
    this.token = null;
    this.user = null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get auth token
  getToken(): string | null {
    return this.token;
  }

  // Generate Casdoor login URL
  getLoginUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: 'openid profile email',
      state: this.generateState()
    });

    return `${this.config.casdoorEndpoint}/login/oauth/authorize?${params.toString()}`;
  }

  // Generate state parameter for OAuth
  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);
    return state;
  }

  // Verify state parameter
  private verifyState(state: string): boolean {
    const storedState = localStorage.getItem('oauth_state');
    return storedState === state;
  }

  // Clear state after successful verification
  private clearState(): void {
    localStorage.removeItem('oauth_state');
  }

  // Handle OAuth callback
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      if (!this.verifyState(state)) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for token via our backend proxy
      const response = await fetch(`${this.config.proxyEndpoint}/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          state: state
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to exchange code for token');
      }

      const data = await response.json();
      this.saveTokenToStorage(data.token);

      // Store user info if provided
      if (data.user) {
        this.currentUser = data.user;
        this.notifyAuthStateChange();
      }

      // Fetch user info if not already provided
      if (!this.currentUser) {
        await this.fetchUserInfo();
      }

      // Clear state after successful login
      this.clearState();

      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  }

  // Fetch current user information
  async fetchUserInfo(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_PROXY_ENDPOINT || 'http://localhost:3001'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear it
          this.clearTokenFromStorage();
          return null;
        }
        throw new Error('Failed to fetch user info');
      }

      const userData = await response.json();
      this.user = userData;
      return userData;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  // Login (redirect to Casdoor)
  login() {
    window.location.href = this.getLoginUrl();
  }

  // Logout
  async logout() {
    try {
      // Optional: Call Casdoor logout endpoint
      if (this.token) {
        await fetch(`${this.config.casdoorEndpoint}/api/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokenFromStorage();
      // Redirect to home page
      window.location.href = '/';
    }
  }

  // Get user's subscription info
  async getSubscription() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_PROXY_ENDPOINT || 'http://localhost:3001'}/billing/subscription`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  // Get available plans
  async getPlans() {
    try {
      const response = await fetch(`${import.meta.env.VITE_PROXY_ENDPOINT || 'http://localhost:3001'}/billing/plans`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  // Get pricing page URL
  getPricingUrl(): string {
    return `${this.config.casdoorEndpoint}/pricing`;
  }
}

export const authService = new AuthService();
