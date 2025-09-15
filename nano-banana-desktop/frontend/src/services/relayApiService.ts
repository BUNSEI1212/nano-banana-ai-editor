import OpenAI from 'openai';

/**
 * 中转API服务类 - 前端版本
 * 使用第三方中转服务来调用Gemini API，避免自建服务器
 */
export class RelayApiService {
  private client: OpenAI;
  private useRelayApi: boolean;

  constructor() {
    this.useRelayApi = import.meta.env.VITE_USE_RELAY_API === 'true';
    
    if (this.useRelayApi) {
      const apiKey = import.meta.env.VITE_RELAY_API_KEY || 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS';
      const baseUrl = import.meta.env.VITE_RELAY_API_URL || 'https://hiapi.online/v1';
      
      this.client = new OpenAI({
        apiKey,
        baseURL: baseUrl,
        dangerouslyAllowBrowser: true // 允许在浏览器中使用
      });
      
      console.log('RelayApiService initialized with relay API');
    } else {
      console.log('RelayApiService disabled, using backend proxy');
    }
  }

  /**
   * 生成图像
   */
  async generateImage(request: {
    prompt: string;
    temperature?: number;
    referenceImages?: string[];
  }): Promise<string[]> {
    if (!this.useRelayApi) {
      throw new Error('Relay API is disabled, use backend proxy instead');
    }

    try {
      const messages: any[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Generate an image: ${request.prompt}`
            }
          ]
        }
      ];

      // 添加参考图像（如果有）
      if (request.referenceImages && request.referenceImages.length > 0) {
        request.referenceImages.forEach(image => {
          messages[0].content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${image}`
            }
          });
        });
      }

      const response = await this.client.chat.completions.create({
        model: 'gemini-2.5-flash-image-preview',
        messages,
        temperature: request.temperature || 0.7
      });

      // 从响应中提取图片URL
      const content = response.choices[0].message.content || '';
      const imageUrls = this.extractImageUrls(content);
      
      console.log(`Generated ${imageUrls.length} images via relay API`);
      return imageUrls;
    } catch (error) {
      console.error('Error generating image via relay API:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * 编辑图像
   */
  async editImage(request: {
    instruction: string;
    originalImage: string;
    maskImage?: string;
    referenceImages?: string[];
  }): Promise<string[]> {
    if (!this.useRelayApi) {
      throw new Error('Relay API is disabled, use backend proxy instead');
    }

    try {
      const messages: any[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Edit this image: ${request.instruction}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${request.originalImage}`
              }
            }
          ]
        }
      ];

      // 添加蒙版图像（如果有）
      if (request.maskImage) {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${request.maskImage}`
          }
        });
      }

      // 添加参考图像（如果有）
      if (request.referenceImages && request.referenceImages.length > 0) {
        request.referenceImages.forEach(image => {
          messages[0].content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${image}`
            }
          });
        });
      }

      const response = await this.client.chat.completions.create({
        model: 'gemini-2.5-flash-image-preview',
        messages
      });

      const content = response.choices[0].message.content || '';
      const imageUrls = this.extractImageUrls(content);
      
      console.log(`Edited image via relay API, got ${imageUrls.length} results`);
      return imageUrls;
    } catch (error) {
      console.error('Error editing image via relay API:', error);
      throw new Error(`Image editing failed: ${error.message}`);
    }
  }

  /**
   * 分析图像
   */
  async analyzeImage(imageBase64: string, prompt: string = "Describe this image"): Promise<string> {
    if (!this.useRelayApi) {
      throw new Error('Relay API is disabled, use backend proxy instead');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      });

      const result = response.choices[0].message.content || '';
      console.log('Image analyzed via relay API');
      return result;
    } catch (error) {
      console.error('Error analyzing image via relay API:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * 从响应内容中提取图片URL
   */
  private extractImageUrls(content: string): string[] {
    const imageUrls: string[] = [];
    
    // 匹配图片URL的正则表达式
    const urlRegex = /https?:\/\/[^\s\)]+\.(?:png|jpg|jpeg|gif|webp)/gi;
    const matches = content.match(urlRegex);
    
    if (matches) {
      imageUrls.push(...matches);
    }

    // 如果没有找到URL，可能图片是以base64形式返回的
    const base64Regex = /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/gi;
    const base64Matches = content.match(base64Regex);
    
    if (base64Matches) {
      imageUrls.push(...base64Matches);
    }

    return imageUrls;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    if (!this.useRelayApi) {
      return false;
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      });
      
      const isHealthy = response.choices[0].message.content !== null;
      console.log(`Relay API health check: ${isHealthy ? 'OK' : 'Failed'}`);
      return isHealthy;
    } catch (error) {
      console.error('Relay API health check failed:', error);
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.useRelayApi) {
      return [];
    }

    try {
      const models = await this.client.models.list();
      const modelIds = models.data.map(model => model.id);
      console.log(`Available models via relay API: ${modelIds.length}`);
      return modelIds;
    } catch (error) {
      console.warn('Could not fetch models from relay API:', error);
      return ['gemini-2.5-flash-image-preview']; // 返回默认模型
    }
  }

  /**
   * 检查是否启用了中转API
   */
  isRelayApiEnabled(): boolean {
    return this.useRelayApi;
  }
}

// 创建单例实例
export const relayApiService = new RelayApiService();
