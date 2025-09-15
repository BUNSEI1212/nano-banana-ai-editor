const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS',
  baseURL: 'https://hiapi.online/v1'
});

async function testImageEditing() {
  console.log('🧪 测试中转API图像编辑功能...\n');

  // 创建一个简单的测试图片base64（1x1像素的红色PNG）
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  // 测试1：基础图像编辑
  console.log('📝 测试1：基础图像编辑');
  try {
    const response1 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请编辑这张图片，将其变成蓝色，并生成一张新的图片'
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

    console.log('✅ 基础图像编辑成功');
    console.log('Response:', response1.choices[0].message.content.substring(0, 300) + '...');
    
    const content = response1.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
    
    return imageUrls.length > 0;
  } catch (error) {
    console.log('❌ 基础图像编辑失败:', error.message);
    console.log('');
    return false;
  }
}

async function testImageEditingWithMask() {
  console.log('📝 测试2：带遮罩的图像编辑');
  
  // 创建一个简单的遮罩图片（白色区域表示要编辑的部分）
  const maskImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg=='; // 白色像素
  const originalImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='; // 红色像素
  
  try {
    const response2 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请根据遮罩编辑这张图片，只修改遮罩中白色区域的内容，将其变成绿色。原始图片：'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${originalImageBase64}`
              }
            },
            {
              type: 'text',
              text: '遮罩图片（白色区域需要编辑）：'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${maskImageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.7
    });

    console.log('✅ 带遮罩的图像编辑成功');
    console.log('Response:', response2.choices[0].message.content.substring(0, 300) + '...');
    
    const content = response2.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
    
    return imageUrls.length > 0;
  } catch (error) {
    console.log('❌ 带遮罩的图像编辑失败:', error.message);
    console.log('');
    return false;
  }
}

async function testImageEditingWithInstruction() {
  console.log('📝 测试3：指令式图像编辑');
  
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  try {
    const response3 = await client.chat.completions.create({
      model: 'gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'EDIT TASK: 换成蜘蛛侠\n\nREQUIREMENTS:\n- This is an EDITING task, not a generation task\n- REPLACE the specified elements, do not add to them\n- Maintain the original image\'s lighting, perspective, and overall composition\n- Make changes look natural and seamlessly integrated\n- Preserve image quality and ensure professional results'
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

    console.log('✅ 指令式图像编辑成功');
    console.log('Response:', response3.choices[0].message.content.substring(0, 300) + '...');
    
    const content = response3.choices[0].message.content;
    const imageUrls = extractImageUrls(content);
    console.log('提取的图片URLs:', imageUrls);
    console.log('');
    
    return imageUrls.length > 0;
  } catch (error) {
    console.log('❌ 指令式图像编辑失败:', error.message);
    console.log('');
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

async function main() {
  console.log('🚀 开始测试中转API图像编辑功能...\n');
  
  const results = {
    basicEdit: await testImageEditing(),
    maskEdit: await testImageEditingWithMask(),
    instructionEdit: await testImageEditingWithInstruction()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结:');
  console.log('='.repeat(50));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ 通过' : '❌ 失败';
    console.log(`${test}: ${status}`);
  });
  
  console.log(`\n总体结果: ${passed}/${total} 项测试通过`);
  
  if (passed > 0) {
    console.log('🎉 中转API支持图像编辑功能！');
  } else {
    console.log('⚠️ 中转API可能不支持图像编辑，或需要特殊格式');
  }
  
  return results;
}

main().catch(console.error);
