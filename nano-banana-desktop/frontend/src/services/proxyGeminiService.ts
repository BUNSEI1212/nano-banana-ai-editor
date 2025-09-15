import { authService } from './authService';

export interface GenerationRequest {
  prompt: string;
  referenceImages?: string[]; // base64 array
  temperature?: number;
  seed?: number;
}

export interface EditRequest {
  instruction: string;
  originalImage: string; // base64
  referenceImages?: string[]; // base64 array
  maskImage?: string; // base64
  temperature?: number;
  seed?: number;
}

export interface ProxyResponse {
  success: boolean;
  requestId: string;
  result: {
    content: string;
    finishReason: string;
    safetyRatings: any[];
    metadata: {
      model: string;
      requestId: string;
      timestamp: string;
    };
  };
}

export interface QuotaError {
  error: string;
  message: string;
  usage?: {
    creditsUsed: number;
    monthlyCredits: number;
    creditsRemaining: number;
  };
  upgradeUrl?: string;
}

export class ProxyGeminiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_PROXY_ENDPOINT || 'http://localhost:3001';
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': this.generateIdempotencyKey()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        // Token expired or invalid
        authService.logout();
        throw new Error('Session expired. Please log in again.');
      } else if (response.status === 429) {
        // Quota exceeded
        const quotaError: QuotaError = {
          error: 'Quota exceeded',
          message: errorData.message || 'You have exceeded your usage quota.',
          usage: errorData.usage,
          upgradeUrl: errorData.upgradeUrl || authService.getPricingUrl()
        };
        throw quotaError;
      } else if (response.status >= 500) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(errorData.error || 'Request failed');
      }
    }

    return await response.json();
  }

  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  async generateImage(request: GenerationRequest): Promise<string[]> {
    try {
      const payload = {
        prompt: request.prompt,
        refImages: request.referenceImages?.map(image => ({
          mimeType: 'image/png',
          data: image
        })) || [],
        options: {
          temperature: request.temperature || 0.7,
          seed: request.seed
        }
      };

      const response: ProxyResponse = await this.makeRequest('/api/generate', payload);
      
      // Parse the response content to extract images
      // This is a simplified implementation - you may need to adjust based on actual Gemini response format
      const images = this.extractImagesFromContent(response.result.content);
      
      return images;
    } catch (error) {
      console.error('Error generating image:', error);
      
      if (error.error === 'Quota exceeded') {
        throw error; // Re-throw quota errors as-is
      }
      
      throw new Error('Failed to generate image. Please try again.');
    }
  }

  async editImage(request: EditRequest): Promise<string[]> {
    try {
      const payload = {
        imageId: this.generateImageId(request.originalImage),
        mask: request.maskImage,
        instruction: request.instruction,
        refImages: [{
          mimeType: 'image/png',
          data: request.originalImage
        }].concat(request.referenceImages?.map(image => ({
          mimeType: 'image/png',
          data: image
        })) || [])
      };

      const response: ProxyResponse = await this.makeRequest('/api/edit', payload);

      // Extract images from the response
      let images: string[] = [];

      // First try to get images from the direct images array
      if (response.result.images && response.result.images.length > 0) {
        images = response.result.images;
      } else if (response.result.content) {
        // Fallback to extracting from content
        images = this.extractImagesFromContent(response.result.content);
      }

      if (images.length === 0) {
        throw new Error('No edited images were generated');
      }

      return images;
    } catch (error) {
      console.error('Error editing image:', error);

      if (error.error === 'Quota exceeded') {
        throw error; // Re-throw quota errors as-is
      }

      throw new Error('Failed to edit image. Please try again.');
    }
  }

  private generateImageId(imageData: string): string {
    // Generate a simple hash-like ID from image data
    let hash = 0;
    for (let i = 0; i < Math.min(imageData.length, 1000); i++) {
      const char = imageData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `img_${Math.abs(hash).toString(36)}`;
  }

  private extractImagesFromContent(content: string): string[] {
    // This is a placeholder implementation
    // In reality, you'll need to parse the actual response format from Gemini
    // For now, we'll assume the content contains base64 image data or references
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (parsed.images && Array.isArray(parsed.images)) {
        return parsed.images;
      }
    } catch (e) {
      // Not JSON, might be direct base64 or other format
    }

    // Check if content looks like base64 image data
    if (content.match(/^[A-Za-z0-9+/]+=*$/)) {
      return [content];
    }

    // For now, return empty array if we can't parse
    // You'll need to implement proper parsing based on actual Gemini response format
    console.warn('Could not extract images from content:', content.substring(0, 100));
    return [];
  }

  // Get current user usage info
  async getUserUsage() {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch usage info');
    }

    const data = await response.json();
    return data.usage;
  }

  // Check service health
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const proxyGeminiService = new ProxyGeminiService();
