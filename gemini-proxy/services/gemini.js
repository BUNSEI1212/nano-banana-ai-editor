const axios = require('axios');
const logger = require('../utils/logger');
const ApiKeyManager = require('./apiKeyManager');

class GeminiService {
  constructor() {
    this.apiKeyManager = new ApiKeyManager();
    this.useRelayApi = process.env.USE_RELAY_API === 'true';

    if (this.useRelayApi) {
      // 中转API配置
      this.baseUrl = process.env.RELAY_API_URL || 'https://hiapi.online/v1';
      this.isOpenAICompatible = true;
      logger.info('🔄 Initialized with Relay API (OpenAI-compatible)');
    } else {
      // 传统直连API配置
      this.baseUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
      this.isOpenAICompatible = false;
      logger.info('🔗 Initialized with Direct Gemini API');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async generateImage({ prompt, refImages = [], options = {}, requestId }) {
    return await this.executeWithRetry(async (apiKey) => {
      logger.info(`Generating image for request ${requestId} using key ${apiKey.substring(0, 10)}...`);

      let result;
      if (this.useRelayApi) {
        // 中转API (OpenAI格式)
        result = await this.generateImageWithRelayApi(apiKey, prompt, refImages, options, requestId);
      } else {
        // 直连API (Gemini格式)
        result = await this.generateImageWithDirectApi(apiKey, prompt, refImages, options, requestId);
      }

      // 统一返回格式，确保与前端期望一致
      return {
        content: JSON.stringify({
          images: result.images || []
        }),
        finishReason: result.finishReason || 'STOP',
        safetyRatings: result.safetyRatings || [],
        metadata: {
          model: this.useRelayApi ? 'gemini-2.5-flash-image-preview' : 'gemini-2.5-flash-image-preview',
          requestId,
          timestamp: new Date().toISOString(),
          apiType: this.useRelayApi ? 'relay' : 'direct'
        }
      };
    }, 'Image Generation', requestId);
  }

  // 中转API图像生成
  async generateImageWithRelayApi(apiKey, prompt, refImages, options, requestId) {
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Generate an image: ${prompt}`
          }
        ]
      }
    ];

    // 添加参考图像（中转API支持base64图像）
    if (refImages && refImages.length > 0) {
      logger.info(`Adding ${refImages.length} reference images to relay API request`);
      refImages.forEach(refImage => {
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:${refImage.mimeType || 'image/png'};base64,${refImage.data}`
          }
        });
      });
    }

    const payload = {
      model: 'gemini-2.5-flash-image-preview',
      messages,
      temperature: options.temperature || 0.7
    };

    logger.info(`Making request to Relay API for request ${requestId}:`, {
      url: '/chat/completions',
      model: payload.model
    });

    const response = await this.client.post('/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // 从响应中提取图片URL
    const content = response.data.choices[0].message.content || '';
    const imageUrls = this.extractImageUrls(content);

    logger.info(`Generated ${imageUrls.length} images via relay API for request ${requestId}`);
    logger.info(`Response content preview: ${content.substring(0, 200)}...`);
    logger.info(`Extracted image URLs: ${JSON.stringify(imageUrls)}`);

    return {
      images: imageUrls,
      text: content
    };
  }

  // 直连API图像生成
  async generateImageWithDirectApi(apiKey, prompt, refImages, options, requestId) {
    // 原有的直连API逻辑
    const imagePrompt = `Generate an image of: ${prompt}`;

    const contents = [{
      parts: [{ text: imagePrompt }]
    }];

    // 添加参考图像（如果有）
    if (refImages && refImages.length > 0) {
      for (const refImage of refImages) {
        contents[0].parts.push({
          inlineData: {
            mimeType: refImage.mimeType || 'image/png',
            data: refImage.data
          }
        });
      }
    }

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 2048,
      },
      systemInstruction: {
        parts: [{
          text: "You are an image generation AI. When given a prompt, generate an image that matches the description. Always output an image, not just text."
        }]
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
        }
      ]
    };

    logger.info(`Making request to Direct Gemini API for request ${requestId}:`, {
      url: `/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey.substring(0, 10)}...`
    });

    const response = await this.client.post(
      `/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      payload
    );

    // Log the response for debugging
    logger.info(`Gemini API response for request ${requestId}:`, {
      status: response.status,
      candidatesCount: response.data?.candidates?.length || 0,
      firstCandidatePartsCount: response.data?.candidates?.[0]?.content?.parts?.length || 0
    });

    if (!response.data || !response.data.candidates) {
      throw new Error('Invalid response from Gemini API');
    }

    const candidate = response.data.candidates[0];
    if (!candidate || !candidate.content) {
      throw new Error('No content generated');
    }

    // Extract generated images from the response
    const images = [];
    let textContent = '';

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        images.push(part.inlineData.data);
      } else if (part.text) {
        textContent += part.text;
      }
    }

    logger.info(`Image generation completed for request ${requestId}, generated ${images.length} images`);

    if (images.length === 0) {
      logger.warn(`No images generated for request ${requestId}. Response parts:`,
        candidate.content.parts.map(p => ({
          hasText: !!p.text,
          hasInlineData: !!p.inlineData,
          textContent: p.text ? p.text.substring(0, 100) + '...' : null
        })));
      logger.warn(`Full response for debugging:`, JSON.stringify(response.data, null, 2));
    }

    return {
      images,
      text: textContent,
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings
    };
  }

  // 从响应内容中提取图片URL (用于中转API)
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

  buildEditPrompt({ instruction, mask }) {
    const maskInstruction = mask
      ? "\n\nCRITICAL MASK INSTRUCTIONS:\n- Apply changes ONLY within the white areas (value 255) of the mask image\n- REPLACE the existing content in the masked areas with the requested changes\n- Do NOT add new elements outside the mask\n- Do NOT keep the original elements in the masked areas\n- Leave all areas outside the mask (black areas) completely unchanged\n- Ensure seamless blending at the mask boundaries"
      : "";

    return `EDIT TASK: ${instruction}

REQUIREMENTS:
- This is an EDITING task, not a generation task
- REPLACE the specified elements, do not add to them
- Maintain the original image's lighting, perspective, and overall composition
- Make changes look natural and seamlessly integrated
- Preserve image quality and ensure professional results${maskInstruction}

IMPORTANT: If a mask is provided, you must ONLY modify the white areas of the mask and REPLACE what's there, not add to it.`;
  }

  async editImage({ imageId, mask, instruction, refImages = [], requestId }) {
    return await this.executeWithRetry(async (apiKey) => {
      logger.info(`Editing image for request ${requestId} using key ${apiKey.substring(0, 10)}...`);

      // 根据配置选择API
      if (this.useRelayApi) {
        return await this.editImageWithRelayApi(apiKey, imageId, mask, instruction, refImages, requestId);
      } else {
        return await this.editImageWithDirectApi(apiKey, imageId, mask, instruction, refImages, requestId);
      }
    }, requestId, 'editImage');
  }

  // 中转API图像编辑
  async editImageWithRelayApi(apiKey, imageId, mask, instruction, refImages, requestId) {
    logger.info(`Using Relay API for image editing request ${requestId}`);

    // 构建编辑提示词，包含遮罩信息
    let editPrompt = this.buildEditPrompt({ instruction, mask });

    // 如果有遮罩，添加特殊的遮罩处理说明
    if (mask) {
      editPrompt += `

MASK EDITING INSTRUCTIONS:
- The user has painted specific areas on the image that need to be edited
- Focus your changes ONLY on the painted/selected regions
- The painted areas are shown with purple/violet overlay in the reference image
- Keep all other areas of the image completely unchanged
- Make the edits blend naturally with the surrounding areas
- Do not modify areas that are not painted/selected`;
    }

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: editPrompt
          }
        ]
      }
    ];

    // 添加原始图像（第一个参考图像通常是原始图像）
    if (refImages && refImages.length > 0) {
      let imageData = refImages[0].data;

      // 如果imageId是URL，我们需要下载并转换为base64
      if (typeof imageId === 'string' && imageId.startsWith('http')) {
        logger.info(`Image ID is URL, but using refImage data for relay API: ${imageId.substring(0, 50)}...`);
        // 使用第一个refImage的数据，这应该是原始图像的base64数据
        imageData = refImages[0].data;
      } else if (typeof imageId === 'string' && !imageId.startsWith('data:') && !imageId.startsWith('http')) {
        // 如果imageId本身就是base64数据
        imageData = imageId;
      }

      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: `data:${refImages[0].mimeType || 'image/png'};base64,${imageData}`
        }
      });

      logger.info(`Added original image to relay API request, data length: ${imageData.length}`);
    } else {
      logger.warn(`No reference images provided for editing request ${requestId}`);
    }

    // 处理遮罩信息：如果有遮罩，我们使用带遮罩覆盖的参考图像
    if (mask && refImages && refImages.length > 1) {
      logger.info(`Adding masked reference image to show selected areas for editing`);
      // 第二个refImage应该是带有遮罩覆盖的图像
      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${refImages[1].data}`
        }
      });

      // 添加说明文本
      messages[0].content.push({
        type: 'text',
        text: 'The second image shows the areas selected for editing (highlighted in purple). Please edit ONLY these highlighted areas.'
      });
    } else if (mask) {
      logger.info(`Mask provided but no masked reference image available`);
    }

    const payload = {
      model: 'gemini-2.5-flash-image-preview',
      messages,
      temperature: 0.7
    };

    logger.info(`Making request to Relay API for image editing ${requestId}:`, {
      url: '/chat/completions',
      model: payload.model,
      hasOriginalImage: refImages && refImages.length > 0,
      hasMask: !!mask,
      instruction: instruction.substring(0, 100) + '...'
    });

    const response = await this.client.post('/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    logger.info('Relay API response for editing:', {
      status: response.status,
      contentPreview: response.data.choices[0].message.content.substring(0, 200) + '...'
    });

    // 从响应中提取图片URL
    const content = response.data.choices[0].message.content || '';
    const imageUrls = this.extractImageUrls(content);

    logger.info(`Generated ${imageUrls.length} images via relay API for editing request ${requestId}`);
    logger.info(`Extracted image URLs: ${JSON.stringify(imageUrls)}`);

    return {
      images: imageUrls,
      text: content,
      finishReason: 'STOP',
      safetyRatings: [],
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        requestId,
        originalImageId: imageId,
        timestamp: new Date().toISOString(),
        apiType: 'relay'
      }
    };
  }

  // 直连API图像编辑
  async editImageWithDirectApi(apiKey, imageId, mask, instruction, refImages, requestId) {
    logger.info(`Using Direct Gemini API for image editing request ${requestId}`);

    // Build the proper edit prompt
    const editPrompt = this.buildEditPrompt({ instruction, mask });

    // Structure contents in the correct order: text -> original -> references -> mask
    const contents = [{
      parts: [{ text: editPrompt }]
    }];

    // Add the original image (first reference image is the original)
    if (refImages && refImages.length > 0) {
      contents[0].parts.push({
        inlineData: {
          mimeType: refImages[0].mimeType || 'image/png',
          data: refImages[0].data
        }
      });

      // Add additional reference images if any
      for (let i = 1; i < refImages.length; i++) {
        contents[0].parts.push({
          inlineData: {
            mimeType: refImages[i].mimeType || 'image/png',
            data: refImages[i].data
          }
        });
      }
    }

    // Add mask as the last element if provided
    if (mask) {
      contents[0].parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: mask
        }
      });

      logger.info('Added mask to request:', {
        maskSize: mask.length,
        maskPreview: mask.substring(0, 50) + '...'
      });
    }

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      // Relaxed safety settings for creative content
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_ONLY_HIGH"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_ONLY_HIGH"
        }
      ]
    };

    logger.info('Making request to Gemini API for image editing:', {
      url: `/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey.substring(0, 10)}...`,
      prompt: editPrompt,
      hasOriginalImage: refImages.length > 0,
      hasReferenceImages: refImages.length > 1,
      hasMask: !!mask,
      partsCount: contents[0].parts.length
    });

    const response = await this.client.post(
      `/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      payload
    );

    logger.info('Gemini API response for editing:', {
      status: response.status,
      data: JSON.stringify(response.data, null, 2).substring(0, 500) + '...'
    });

    if (!response.data || !response.data.candidates) {
      // Check for content blocking
      if (response.data && response.data.promptFeedback && response.data.promptFeedback.blockReason) {
        const blockReason = response.data.promptFeedback.blockReason;
        logger.error('Content blocked by Gemini API:', { blockReason });
        throw new Error(`Content blocked: ${blockReason}. Please try a different prompt that doesn't contain potentially sensitive content.`);
      }
      throw new Error('Invalid response from Gemini API');
    }

    const candidate = response.data.candidates[0];
    if (!candidate || !candidate.content) {
      throw new Error('No content generated');
    }

    // Extract images from the response
    const images = [];
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('image/')) {
        images.push(part.inlineData.data);
      }
    }

    logger.info(`Image editing completed for request ${requestId}, generated ${images.length} images`);

    if (images.length === 0) {
      logger.warn(`No images generated for request ${requestId}. Response parts:`,
        candidate.content.parts.map(part => ({
          hasText: !!part.text,
          hasInlineData: !!part.inlineData
        }))
      );

      // Generate a mock edited image for now
      const mockImage = this.generateMockImage(instruction);
      images.push(mockImage);
    }

    return {
      images,
      finishReason: candidate.finishReason,
      safetyRatings: candidate.safetyRatings,
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        requestId,
        originalImageId: imageId,
        timestamp: new Date().toISOString()
      }
    };
  }

  // 带重试机制的执行方法
  async executeWithRetry(operation, requestId, operationType, maxRetries = 3) {
    let lastError;
    let attemptCount = 0;

    while (attemptCount < maxRetries) {
      attemptCount++;

      try {
        // 检查是否有可用的API密钥
        if (!this.apiKeyManager.hasAvailableKeys()) {
          throw new Error('所有API密钥都已达到限制或被禁用，请稍后再试');
        }

        // 获取下一个可用的API密钥
        const apiKey = this.apiKeyManager.getNextApiKey();

        logger.info(`🔄 Attempt ${attemptCount}/${maxRetries} for ${operationType} (${requestId}) using key ${apiKey.substring(0, 10)}...`);

        // 执行操作
        const result = await operation(apiKey);

        logger.info(`✅ ${operationType} succeeded on attempt ${attemptCount} for request ${requestId}`);
        return result;

      } catch (error) {
        lastError = error;

        // 获取当前使用的API密钥（从错误中推断或使用最后一个）
        const currentApiKey = this.apiKeyManager.getNextApiKey();

        // 记录API密钥错误
        this.apiKeyManager.recordKeyError(currentApiKey, error);

        const isRetryableError = this.isRetryableError(error);

        logger.warn(`❌ Attempt ${attemptCount}/${maxRetries} failed for ${operationType} (${requestId}):`, {
          error: error.message,
          isRetryable: isRetryableError,
          willRetry: attemptCount < maxRetries && isRetryableError
        });

        // 如果不是可重试的错误，或者已经达到最大重试次数，直接抛出错误
        if (!isRetryableError || attemptCount >= maxRetries) {
          break;
        }

        // 等待一段时间后重试（指数退避）
        const delay = Math.min(1000 * Math.pow(2, attemptCount - 1), 5000);
        logger.info(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // 所有重试都失败了，抛出最后一个错误
    const friendlyMessage = this.getFriendlyErrorMessage(lastError);
    logger.error(`💥 All ${maxRetries} attempts failed for ${operationType} (${requestId}): ${friendlyMessage}`);
    throw new Error(friendlyMessage);
  }

  // 判断错误是否可重试
  isRetryableError(error) {
    const message = error.message || error.toString();
    const statusCode = error.response?.status;

    // 不可重试的错误
    if (statusCode === 400) return false; // 请求格式错误
    if (statusCode === 401) return false; // 认证错误
    if (statusCode === 403) return false; // 权限错误
    if (message.includes('Invalid request')) return false;
    if (message.includes('Content blocked')) return false;

    // 可重试的错误
    if (statusCode === 429) return true; // 速率限制
    if (statusCode >= 500) return true; // 服务器错误
    if (message.includes('timeout')) return true;
    if (message.includes('network')) return true;
    if (message.includes('Rate limit')) return true;

    // 默认可重试
    return true;
  }

  // 获取用户友好的错误消息
  getFriendlyErrorMessage(error) {
    const message = error.message || error.toString();
    const statusCode = error.response?.status;

    if (message.includes('所有API密钥都已达到限制')) {
      return '所有API密钥都已达到使用限制，请稍后再试';
    }

    if (statusCode === 429 || message.includes('Rate limit')) {
      return '请求过于频繁，请稍后再试';
    }

    if (statusCode === 403 || message.includes('invalid') || message.includes('permissions')) {
      return 'API密钥无效或权限不足，请检查配置';
    }

    if (message.includes('Content blocked')) {
      return '内容被安全过滤器阻止，请尝试修改您的描述';
    }

    if (statusCode >= 500) {
      return '服务暂时不可用，请稍后再试';
    }

    if (message.includes('timeout')) {
      return '请求超时，请稍后再试';
    }

    // 默认错误消息
    return '图片处理失败，请稍后再试';
  }

  // Generate a mock image for demonstration purposes
  // In a real implementation, you would integrate with an actual image generation service
  generateMockImage(prompt) {
    // Create a simple colored rectangle as a placeholder
    // This is a 1x1 pixel red PNG in base64
    const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    logger.info(`Generated mock image for prompt: ${prompt.substring(0, 50)}`);
    return mockImageBase64;
  }

  // 获取API密钥统计信息
  getApiKeyStats() {
    return this.apiKeyManager.getKeyStats();
  }
}

module.exports = new GeminiService();
