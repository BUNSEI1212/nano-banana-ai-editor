// Subscription service for billing and plan management
export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: {
    monthlyCredits: number;
    maxConcurrency: number;
  };
  description: string;
  popular?: boolean;
}

export interface Subscription {
  plan_code: string;
  plan_name: string;
  status: string;
  monthly_credits: number;
  start_at?: string;
  end_at?: string;
}

class SubscriptionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_PROXY_ENDPOINT || 'http://localhost:3001';
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    const token = localStorage.getItem('auth_token');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Don't retry on authentication errors
          if (response.status === 401 || response.status === 403) {
            throw new Error(errorData.message || '认证失败，请重新登录');
          }

          // Don't retry on client errors (except 429 rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(errorData.message || `请求错误 (${response.status})`);
          }

          // Retry on server errors and rate limits
          if (attempt === retries) {
            throw new Error(errorData.message || `服务器错误 (${response.status})`);
          }

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        return response.json();
      } catch (error) {
        if (attempt === retries) {
          if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('网络连接失败，请检查网络连接');
          }
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('请求失败');
  }

  async getPlans(): Promise<{ plans: Plan[] }> {
    return this.makeRequest<{ plans: Plan[] }>('/billing/plans');
  }

  async getCurrentSubscription(): Promise<Subscription> {
    return this.makeRequest<Subscription>('/billing/subscription');
  }

  async createPayment(planId: string): Promise<{ paymentUrl: string; orderId: string }> {
    return this.makeRequest<{ paymentUrl: string; orderId: string }>('/billing/create-payment', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async activateSubscription(planId: string): Promise<{ success: boolean; subscription: any }> {
    return this.makeRequest<{ success: boolean; subscription: any }>('/billing/activate-subscription', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  // Generate Casdoor pricing page URL for external payment
  getCasdoorPricingUrl(): string {
    const casdoorEndpoint = import.meta.env.VITE_CASDOOR_ENDPOINT || 'http://localhost:8000';
    return `${casdoorEndpoint}/pricing`;
  }

  // Generate Casdoor payment URL for specific plan
  getCasdoorPaymentUrl(planId: string): string {
    const casdoorEndpoint = import.meta.env.VITE_CASDOOR_ENDPOINT || 'http://localhost:8000';
    const clientId = import.meta.env.VITE_CASDOOR_CLIENT_ID || '';
    const organizationName = import.meta.env.VITE_CASDOOR_ORGANIZATION_NAME || 'built-in';
    const applicationName = import.meta.env.VITE_CASDOOR_APPLICATION_NAME || 'nano-banana-app';

    return `${casdoorEndpoint}/buy/${organizationName}/${applicationName}/${planId}?clientId=${clientId}&redirectUri=${encodeURIComponent(window.location.origin)}&provider=alipay-provider`;
  }

  // Create payment order with Alipay
  async createPaymentWithAlipay(planId: string): Promise<{ paymentUrl: string; orderId: string }> {
    // In development mode, return mock payment URL
    if (import.meta.env.DEV) {
      return {
        paymentUrl: this.getCasdoorPaymentUrl(planId),
        orderId: `dev-order-${Date.now()}`
      };
    }

    // In production, create actual payment order
    return this.makeRequest<{ paymentUrl: string; orderId: string }>('/billing/create-payment', {
      method: 'POST',
      body: JSON.stringify({ planId, paymentMethod: 'alipay' }),
    });
  }
}

export const subscriptionService = new SubscriptionService();
