const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS',
  baseURL: 'https://hiapi.online/v1'
});

async function testImageInputFormats() {
  console.log('🧪 测试中转API图像输入格式...\n');

  // 创建一个简单的测试图片base64（1x1像素的红色PNG）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  // 测试1：标准OpenAI格式
  console.log('📝 测试1：标准OpenAI格式 (image_url)');
  try {
    const response1 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate an image based on this reference: 超人'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${testImageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.7
    });

    console.log('✅ 标准格式成功');
    console.log('Response:', response1.choices[0].message.content.substring(0, 200) + '...');
    
    const content = response1.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
  } catch (error) {
    console.log('❌ 标准格式失败:', error.message);
    console.log('');
  }

  // 测试2：尝试不同的base64格式
  console.log('📝 测试2：不带data:前缀的base64');
  try {
    const response2 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate an image based on this reference: 超人'
            },
            {
              type: 'image_url',
              image_url: {
                url: testImageBase64
              }
            }
          ]
        }
      ],
      temperature: 0.7
    });

    console.log('✅ 不带前缀格式成功');
    console.log('Response:', response2.choices[0].message.content.substring(0, 200) + '...');
    
    const content = response2.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
  } catch (error) {
    console.log('❌ 不带前缀格式失败:', error.message);
    console.log('');
  }

  // 测试3：尝试使用HTTP URL
  console.log('📝 测试3：使用HTTP URL');
  try {
    const response3 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate an image based on this reference: 超人'
            },
            {
              type: 'image_url',
              image_url: {
                url: 'https://via.placeholder.com/100x100/ff0000/ffffff?text=Test'
              }
            }
          ]
        }
      ],
      temperature: 0.7
    });

    console.log('✅ HTTP URL格式成功');
    console.log('Response:', response3.choices[0].message.content.substring(0, 200) + '...');
    
    const content = response3.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
  } catch (error) {
    console.log('❌ HTTP URL格式失败:', error.message);
    console.log('');
  }

  // 测试4：检查支持的模型
  console.log('📝 测试4：检查支持图像输入的模型');
  try {
    const models = await client.models.list();
    console.log('✅ 可用模型数量:', models.data.length);
    
    // 查找支持图像的模型
    const visionModels = models.data.filter(model => 
      model.id.includes('vision') || 
      model.id.includes('image') ||
      model.id.includes('gpt-4') ||
      model.id.includes('gemini')
    );
    
    console.log('🖼️ 可能支持图像的模型:');
    visionModels.forEach(model => {
      console.log(`  - ${model.id}`);
    });
  } catch (error) {
    console.log('❌ 获取模型列表失败:', error.message);
  }
}

function extractImageUrls(content) {
  const imageUrls = [];
  
  // 匹配markdown格式的图片链接
  const markdownMatches = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/g);
  if (markdownMatches) {
    markdownMatches.forEach(match => {
      const urlMatch = match.match(/\((https?:\/\/[^\)]+)\)/);
      if (urlMatch) {
        imageUrls.push(urlMatch[1]);
      }
    });
  }
  
  // 匹配直接的URL
  const urlMatches = content.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+\.(png|jpg|jpeg|gif|webp)/gi);
  if (urlMatches) {
    urlMatches.forEach(url => {
      if (!imageUrls.includes(url)) {
        imageUrls.push(url);
      }
    });
  }
  
  return imageUrls;
}

testImageInputFormats().catch(console.error);
