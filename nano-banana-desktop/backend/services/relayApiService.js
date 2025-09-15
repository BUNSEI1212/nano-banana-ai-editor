const OpenAI = require('openai');
const logger = require('../utils/logger');

/**
 * 中转API服务类
 * 使用第三方中转服务来调用Gemini API，避免自建服务器
 */
class RelayApiService {
  constructor() {
    this.apiKey = process.env.RELAY_API_KEY || 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS';
    this.baseUrl = process.env.RELAY_API_URL || 'https://hiapi.online/v1';
    this.useRelayApi = process.env.USE_RELAY_API === 'true';
    
    if (this.useRelayApi) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseUrl
      });
      logger.info('RelayApiService initialized with relay API');
    } else {
      logger.info('RelayApiService disabled, using direct API');
    }
  }

  /**
   * 生成图像
   */
  async generateImage(request) {
    if (!this.useRelayApi) {
      throw new Error('Relay API is disabled');
    }

    try {
      const messages = [
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
      
      logger.info(`Generated ${imageUrls.length} images via relay API`);
      return imageUrls;
    } catch (error) {
      logger.error('Error generating image via relay API:', error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * 编辑图像
   */
  async editImage(request) {
    if (!this.useRelayApi) {
      throw new Error('Relay API is disabled');
    }

    try {
      const messages = [
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
      
      logger.info(`Edited image via relay API, got ${imageUrls.length} results`);
      return imageUrls;
    } catch (error) {
      logger.error('Error editing image via relay API:', error);
      throw new Error(`Image editing failed: ${error.message}`);
    }
  }

  /**
   * 分析图像
   */
  async analyzeImage(imageBase64, prompt = "Describe this image") {
    if (!this.useRelayApi) {
      throw new Error('Relay API is disabled');
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
      logger.info('Image analyzed via relay API');
      return result;
    } catch (error) {
      logger.error('Error analyzing image via relay API:', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * 从响应内容中提取图片URL
   */
  extractImageUrls(content) {
    const imageUrls = [];
    
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
  async healthCheck() {
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
      logger.info(`Relay API health check: ${isHealthy ? 'OK' : 'Failed'}`);
      return isHealthy;
    } catch (error) {
      logger.error('Relay API health check failed:', error);
      return false;
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels() {
    if (!this.useRelayApi) {
      return [];
    }

    try {
      const models = await this.client.models.list();
      const modelIds = models.data.map(model => model.id);
      logger.info(`Available models via relay API: ${modelIds.length}`);
      return modelIds;
    } catch (error) {
      logger.warn('Could not fetch models from relay API:', error);
      return ['gemini-2.5-flash-image-preview']; // 返回默认模型
    }
  }
}

module.exports = RelayApiService;
