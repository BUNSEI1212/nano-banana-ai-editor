// Electron service for desktop app integration
interface ElectronAPI {
  activateApp: (activationCode: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getRemainingCredits: () => Promise<{ success: boolean; credits?: number; error?: string }>;
  useCredits: (count: number) => Promise<{ success: boolean; remaining?: number; error?: string }>;
  getAppInfo: () => Promise<{ version: string; name: string; isActivated: boolean }>;
  platform: string;
  isElectron: boolean;
}

interface NanoBananaAPI {
  getRemainingCredits: () => Promise<{ success: boolean; credits?: number; error?: string }>;
  useCredits: (count: number) => Promise<{ success: boolean; remaining?: number; error?: string }>;
  getAppInfo: () => Promise<{ version: string; name: string; isActivated: boolean }>;
  generateImage: (request: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  editImage: (request: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  isElectron: boolean;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    activationAPI?: {
      activate: (code: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      getAppInfo: () => Promise<{ version: string; name: string; isActivated: boolean }>;
    };
    nanoBananaAPI?: NanoBananaAPI;
  }
}

class ElectronService {
  private isElectronEnv: boolean;

  constructor() {
    this.isElectronEnv = this.checkElectronEnvironment();
  }

  private checkElectronEnvironment(): boolean {
    return !!(window.electronAPI || window.nanoBananaAPI || window.activationAPI);
  }

  public isElectron(): boolean {
    return this.isElectronEnv;
  }

  public async getRemainingCredits(): Promise<number> {
    if (!this.isElectronEnv) {
      throw new Error('Not running in Electron environment');
    }

    try {
      const result = await window.nanoBananaAPI?.getRemainingCredits();
      if (result?.success) {
        return result.credits || 0;
      } else {
        throw new Error(result?.error || 'Failed to get remaining credits');
      }
    } catch (error) {
      console.error('Error getting remaining credits:', error);
      return 0;
    }
  }

  public async useCredits(count: number = 1): Promise<number> {
    if (!this.isElectronEnv) {
      throw new Error('Not running in Electron environment');
    }

    try {
      const result = await window.nanoBananaAPI?.useCredits(count);
      if (result?.success) {
        return result.remaining || 0;
      } else {
        throw new Error(result?.error || 'Failed to use credits');
      }
    } catch (error) {
      console.error('Error using credits:', error);
      throw error;
    }
  }

  public async getAppInfo(): Promise<any> {
    if (!this.isElectronEnv) {
      throw new Error('Not running in Electron environment');
    }

    try {
      const result = await window.activationAPI?.getAppInfo();
      return result;
    } catch (error) {
      console.error('Error getting app info:', error);
      return null;
    }
  }

  public async getActivationHistory(): Promise<any[]> {
    if (!this.isElectronEnv) {
      throw new Error('Not running in Electron environment');
    }

    try {
      const result = await window.nanoBananaAPI?.getActivationHistory();
      if (result?.success) {
        return result.history || [];
      } else {
        throw new Error(result?.error || 'Failed to get activation history');
      }
    } catch (error) {
      console.error('Error getting activation history:', error);
      return [];
    }
  }

  public async activateCode(code: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.isElectronEnv) {
      throw new Error('Not running in Electron environment');
    }

    try {
      const result = await window.activationAPI?.activate(code);
      return result || { success: false, error: 'No response from activation API' };
    } catch (error) {
      console.error('Error activating code:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }



  public getPlatform(): string {
    if (this.isElectronEnv && window.nanoBananaAPI?.platform) {
      return window.nanoBananaAPI.platform;
    }
    return 'web';
  }

  // For activation page
  public async activateApp(activationCode: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.isElectronEnv || !window.activationAPI) {
      return { success: false, error: 'Not running in Electron environment' };
    }

    try {
      return await window.activationAPI.activate(activationCode);
    } catch (error) {
      console.error('Error activating app:', error);
      return { success: false, error: 'Activation failed' };
    }
  }

  // Image generation API
  public async generateImage(request: any): Promise<any> {
    if (!this.isElectronEnv) {
      throw new Error('Not running in Electron environment');
    }

    try {
      const result = await window.nanoBananaAPI?.generateImage(request);
      if (result?.success) {
        return result.data;
      } else {
        throw new Error(result?.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  // Image editing API
  public async editImage(request: any): Promise<any> {
    if (!this.isElectronEnv) {
      throw new Error('Not running in Electron environment');
    }

    try {
      const result = await window.nanoBananaAPI?.editImage(request);
      if (result?.success) {
        return result.data;
      } else {
        throw new Error(result?.error || 'Failed to edit image');
      }
    } catch (error) {
      console.error('Error editing image:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const electronService = new ElectronService();

// Export types for use in other components
export type { ElectronAPI, NanoBananaAPI };
