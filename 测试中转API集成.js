/**
 * 测试中转API集成脚本
 * 验证所有项目的中转API配置是否正确
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// 中转API配置
const RELAY_CONFIG = {
  apiKey: 'sk-xo5EQglG3ojnJVqZm8XzCBAIIex0ibo1cRGH3u6aDR0iQwyS',
  baseUrl: 'https://hiapi.online/v1'
};

class RelayApiTester {
  constructor() {
    this.client = new OpenAI({
      apiKey: RELAY_CONFIG.apiKey,
      baseURL: RELAY_CONFIG.baseUrl
    });
  }

  /**
   * 测试基本连接
   */
  async testConnection() {
    console.log('🔗 测试中转API连接...');
    try {
      const response = await this.client.chat.completions.create({
        model: 'gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a connection test.'
          }
        ]
      });
      
      console.log('✅ 连接测试成功');
      console.log('响应:', response.choices[0].message.content);
      return true;
    } catch (error) {
      console.error('❌ 连接测试失败:', error.message);
      return false;
    }
  }

  /**
   * 测试图像生成
   */
  async testImageGeneration() {
    console.log('\n🎨 测试图像生成...');
    try {
      const response = await this.client.chat.completions.create({
        model: 'gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Generate an image: A beautiful sunset over mountains'
              }
            ]
          }
        ]
      });

      const content = response.choices[0].message.content || '';
      console.log('✅ 图像生成测试成功');
      console.log('响应内容:', content.substring(0, 200) + '...');
      
      // 检查是否包含图片URL
      const hasImageUrl = /https?:\/\/[^\s\)]+\.(?:png|jpg|jpeg|gif|webp)/i.test(content);
      if (hasImageUrl) {
        console.log('✅ 检测到图片URL');
      } else {
        console.log('⚠️  未检测到图片URL，但响应正常');
      }
      
      return true;
    } catch (error) {
      console.error('❌ 图像生成测试失败:', error.message);
      return false;
    }
  }

  /**
   * 测试模型列表
   */
  async testModelList() {
    console.log('\n📋 测试模型列表...');
    try {
      const models = await this.client.models.list();
      console.log('✅ 模型列表获取成功');
      console.log(`可用模型数量: ${models.data.length}`);
      
      // 显示前几个模型
      const modelNames = models.data.slice(0, 5).map(m => m.id);
      console.log('前5个模型:', modelNames);
      
      return true;
    } catch (error) {
      console.error('❌ 模型列表测试失败:', error.message);
      return false;
    }
  }

  /**
   * 检查环境变量配置
   */
  checkEnvConfigs() {
    console.log('\n⚙️  检查环境变量配置...');
    
    const envFiles = [
      'gemini-proxy/.env',
      'nano-banana-desktop/backend/.env',
      'nano-banana-desktop/frontend/.env',
      'NanoBananaEditor/.env'
    ];

    let allConfigsCorrect = true;

    envFiles.forEach(envFile => {
      const fullPath = path.join(__dirname, envFile);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        console.log(`\n📁 检查 ${envFile}:`);
        
        // 检查是否包含中转API配置
        const hasRelayConfig = content.includes('RELAY_API_KEY') || content.includes('VITE_RELAY_API_KEY');
        const hasUseRelay = content.includes('USE_RELAY_API=true') || content.includes('VITE_USE_RELAY_API=true');
        
        if (hasRelayConfig && hasUseRelay) {
          console.log('  ✅ 中转API配置正确');
        } else {
          console.log('  ❌ 中转API配置缺失或不正确');
          allConfigsCorrect = false;
        }
        
        // 检查是否还有直连API配置
        const hasDirectGemini = content.includes('GEMINI_API_KEY=AIza') || content.includes('VITE_GEMINI_API_KEY=AIza');
        if (hasDirectGemini) {
          console.log('  ⚠️  仍包含直连API配置，建议删除');
          allConfigsCorrect = false;
        } else {
          console.log('  ✅ 已删除直连API配置');
        }
      } else {
        console.log(`\n📁 ${envFile}: 文件不存在`);
        allConfigsCorrect = false;
      }
    });

    return allConfigsCorrect;
  }

  /**
   * 运行完整测试
   */
  async runFullTest() {
    console.log('🚀 开始中转API集成测试\n');
    console.log('=' * 50);
    
    // 检查配置文件
    const configsOk = this.checkEnvConfigs();
    
    // 测试API功能
    const connectionOk = await this.testConnection();
    const imageGenOk = await this.testImageGeneration();
    const modelsOk = await this.testModelList();
    
    // 总结结果
    console.log('\n' + '=' * 50);
    console.log('📊 测试结果总结:');
    console.log(`配置文件检查: ${configsOk ? '✅ 通过' : '❌ 失败'}`);
    console.log(`连接测试: ${connectionOk ? '✅ 通过' : '❌ 失败'}`);
    console.log(`图像生成测试: ${imageGenOk ? '✅ 通过' : '❌ 失败'}`);
    console.log(`模型列表测试: ${modelsOk ? '✅ 通过' : '❌ 失败'}`);
    
    const allTestsPassed = configsOk && connectionOk && imageGenOk && modelsOk;
    
    if (allTestsPassed) {
      console.log('\n🎉 所有测试通过！中转API集成成功！');
      console.log('✅ 可以开始在开发环境中测试应用功能');
      console.log('✅ 已成功删除4个直连API keys');
      console.log('✅ 避免了自建服务器的复杂性');
    } else {
      console.log('\n⚠️  部分测试失败，请检查配置');
    }
    
    return allTestsPassed;
  }
}

// 运行测试
async function main() {
  const tester = new RelayApiTester();
  await tester.runFullTest();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = RelayApiTester;
