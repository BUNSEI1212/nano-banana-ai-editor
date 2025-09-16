#!/usr/bin/env node

/**
 * 测试激活系统安全性
 * 验证一码一用功能是否正常工作
 */

const axios = require('axios');
const crypto = require('crypto');

// 测试配置
const TEST_CONFIG = {
  serverUrl: 'http://43.142.153.33:3001',
  testCode: 'NB-1234-5678-9ABC', // 测试激活码
  device1: {
    platform: 'win32',
    arch: 'x64',
    hostname: 'test-device-1',
    cpus: 'Intel Core i7',
    totalmem: 16777216000,
    networkInterfaces: ['00:11:22:33:44:55'],
    release: '10.0.19042',
    cpuCount: 8
  },
  device2: {
    platform: 'win32',
    arch: 'x64',
    hostname: 'test-device-2',
    cpus: 'Intel Core i5',
    totalmem: 8589934592,
    networkInterfaces: ['AA:BB:CC:DD:EE:FF'],
    release: '10.0.19042',
    cpuCount: 4
  }
};

async function testActivationSecurity() {
  console.log('🧪 开始测试激活系统安全性...');
  console.log('=====================================');
  
  try {
    // 测试1：第一台设备激活
    console.log('\n📱 测试1: 第一台设备激活');
    const result1 = await activateDevice(TEST_CONFIG.testCode, TEST_CONFIG.device1);
    console.log('结果:', result1.success ? '✅ 成功' : '❌ 失败', result1.message || '');
    
    // 测试2：第二台设备尝试使用同一激活码
    console.log('\n📱 测试2: 第二台设备使用同一激活码');
    const result2 = await activateDevice(TEST_CONFIG.testCode, TEST_CONFIG.device2);
    console.log('结果:', result2.success ? '❌ 成功（安全漏洞！）' : '✅ 失败（正确行为）', result2.message || '');
    
    // 测试3：第一台设备重新激活
    console.log('\n📱 测试3: 第一台设备重新激活');
    const result3 = await activateDevice(TEST_CONFIG.testCode, TEST_CONFIG.device1);
    console.log('结果:', result3.success ? '✅ 成功（允许重新激活）' : '❌ 失败', result3.message || '');
    
    // 总结
    console.log('\n📊 测试总结:');
    console.log('=====================================');
    
    if (!result1.success) {
      console.log('❌ 第一次激活失败 - 可能是服务器问题');
    } else if (result2.success) {
      console.log('🚨 安全漏洞：同一激活码可以在多台设备上使用！');
      console.log('💡 建议：检查服务器验证逻辑和数据库约束');
    } else {
      console.log('✅ 安全检查通过：激活码只能在一台设备上使用');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

async function activateDevice(activationCode, deviceInfo) {
  try {
    const response = await axios.post(`${TEST_CONFIG.serverUrl}/api/activation/verify`, {
      activationCode,
      deviceInfo
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nano-Banana-Security-Test/1.0'
      },
      timeout: 10000
    });
    
    return {
      success: true,
      data: response.data,
      message: '激活成功'
    };
    
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: error.response.data,
        message: error.response.data.error || '激活失败'
      };
    } else {
      return {
        success: false,
        error: error.message,
        message: `网络错误: ${error.message}`
      };
    }
  }
}

// 生成测试激活码
function generateTestCode() {
  const planType = 1; // 试用版
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  const baseCode = planType + randomPart.substring(0, 7);
  
  // 生成校验和
  const hash = crypto.createHmac('sha256', 'nano_banana_activation_secret_2024')
                    .update(baseCode)
                    .digest('hex');
  const checksum = hash.substring(0, 4).toUpperCase();
  
  return `NB-${baseCode.substring(0, 4)}-${baseCode.substring(4, 8)}-${checksum}`;
}

// 运行测试
if (require.main === module) {
  console.log('🔧 如果需要生成新的测试激活码:');
  console.log('测试激活码:', generateTestCode());
  console.log('');
  
  testActivationSecurity().catch(console.error);
}

module.exports = { testActivationSecurity, generateTestCode };