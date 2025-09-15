const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS',
  baseURL: 'https://hiapi.online/v1'
});

async function testReferenceImageGeneration() {
  console.log('🧪 测试中转API参考图片生成功能...\n');

  // 创建一个简单的测试图片base64（1x1像素的红色PNG）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  console.log('📝 测试：带参考图片的图像生成');
  try {
    const response = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '基于这张参考图片，生成一个超人的图像'
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
    console.log('Response:', response.choices[0].message.content.substring(0, 300) + '...');
    
    // 提取图片URL
    const content = response.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    
    if (imageUrls.length > 0) {
      console.log('🎉 成功生成图片！URL:', imageUrls[0]);
      return true;
    } else {
      console.log('⚠️ 没有找到图片URL，但请求成功');
      return false;
    }
  } catch (error) {
    console.log('❌ 带参考图片生成失败:', error.message);
    return false;
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

testReferenceImageGeneration().catch(console.error);
