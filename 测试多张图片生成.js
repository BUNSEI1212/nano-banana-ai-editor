const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// 配置中转API
const client = new OpenAI({
  apiKey: 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS',
  baseURL: 'https://hiapi.online/v1'
});

// 创建两个测试用的小图片（base64格式）
const testImage1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0+GQAAAABJRU5ErkJggg=='; // 1x1 红色像素
const testImage2 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 绿色像素

async function testMultipleImages() {
  console.log('🧪 测试多张参考图片的图像生成...\n');

  try {
    // 测试1：单张图片
    console.log('📸 测试1：单张参考图片');
    const singleImageResponse = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate an image: 一只可爱的小猫'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImage1}`
              }
            }
          ]
        }
      ],
      temperature: 0.7
    });

    console.log('✅ 单张图片测试成功');
    console.log('响应内容长度:', singleImageResponse.choices[0].message.content?.length || 0);
    
    // 提取图片URL
    const content1 = singleImageResponse.choices[0].message.content || '';
    const imageUrls1 = content1.match(/https?:\/\/[^\s\)]+\.(?:png|jpg|jpeg|gif|webp)/gi) || [];
    console.log('提取到的图片数量:', imageUrls1.length);
    console.log('图片URLs:', imageUrls1);
    console.log('');

    // 测试2：两张图片
    console.log('📸 测试2：两张参考图片');
    const multipleImageResponse = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate an image: 一只可爱的小狗，结合这两张参考图片的风格'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImage1}`
              }
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImage2}`
              }
            }
          ]
        }
      ],
      temperature: 0.7
    });

    console.log('✅ 两张图片测试成功');
    console.log('响应内容长度:', multipleImageResponse.choices[0].message.content?.length || 0);
    
    // 提取图片URL
    const content2 = multipleImageResponse.choices[0].message.content || '';
    const imageUrls2 = content2.match(/https?:\/\/[^\s\)]+\.(?:png|jpg|jpeg|gif|webp)/gi) || [];
    console.log('提取到的图片数量:', imageUrls2.length);
    console.log('图片URLs:', imageUrls2);
    console.log('');

    // 比较结果
    console.log('📊 结果比较:');
    console.log(`单张图片生成: ${imageUrls1.length} 张图片`);
    console.log(`两张图片生成: ${imageUrls2.length} 张图片`);
    
    if (imageUrls1.length > 0 && imageUrls2.length > 0) {
      console.log('✅ 两种情况都成功生成了图片');
    } else if (imageUrls1.length > 0 && imageUrls2.length === 0) {
      console.log('❌ 多张参考图片时生成失败');
    } else if (imageUrls1.length === 0 && imageUrls2.length > 0) {
      console.log('❌ 单张参考图片时生成失败');
    } else {
      console.log('❌ 两种情况都失败了');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testMultipleImages();
