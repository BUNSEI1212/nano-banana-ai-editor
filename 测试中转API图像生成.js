const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS',
  baseURL: 'https://hiapi.online/v1'
});

async function testImageGeneration() {
  console.log('🧪 测试中转API图像生成功能...\n');

  // 测试1：纯文本生成
  console.log('📝 测试1：纯文本生成');
  try {
    const response1 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate an image: 超人'
            }
          ]
        }
      ],
      temperature: 0.7
    });

    console.log('✅ 纯文本生成成功');
    console.log('Response:', response1.choices[0].message.content.substring(0, 200) + '...');
    
    // 提取图片URL
    const content = response1.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
  } catch (error) {
    console.log('❌ 纯文本生成失败:', error.message);
    console.log('');
  }

  // 测试2：带参考图片生成（base64格式）
  console.log('📝 测试2：带参考图片生成');
  try {
    // 创建一个简单的测试图片base64（1x1像素的PNG）
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA60e6kgAAAABJRU5ErkJggg==';
    
    const response2 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Generate an image based on this reference: 将这张照片变成角色手办'
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

    console.log('✅ 带参考图片生成成功');
    console.log('Response:', response2.choices[0].message.content.substring(0, 200) + '...');
    
    // 提取图片URL
    const content = response2.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
  } catch (error) {
    console.log('❌ 带参考图片生成失败:', error.message);
    console.log('');
  }

  // 测试3：检查模型列表
  console.log('📝 测试3：检查可用模型');
  try {
    const models = await client.models.list();
    console.log('✅ 可用模型数量:', models.data.length);
    const imageModels = models.data.filter(model => 
      model.id.includes('image') || 
      model.id.includes('vision') || 
      model.id.includes('gemini')
    );
    console.log('🖼️ 图像相关模型:');
    imageModels.forEach(model => {
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

testImageGeneration().catch(console.error);
