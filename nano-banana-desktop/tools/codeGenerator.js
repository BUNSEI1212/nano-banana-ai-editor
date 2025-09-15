#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Same secret key as in activationManager.js
const SECRET_KEY = 'NB2024-SECRET-KEY-FOR-ACTIVATION';

// Plans
const PLANS = {
  1: { name: '🍌 尝鲜套餐', credits: 10, price: 13.9, type: 'trial' },
  2: { name: '💎 基础套餐', credits: 100, price: 69.9, type: 'basic' },
  3: { name: '🚀 高阶套餐', credits: 300, price: 199.9, type: 'premium' },
  9: { name: '🎨 自定义套餐', credits: 0, price: 0, type: 'custom' } // 自定义套餐
};

// Generate checksum for activation code
function generateChecksum(baseCode) {
  const hash = crypto.createHmac('sha256', SECRET_KEY)
                    .update(baseCode)
                    .digest('hex');
  return hash.substring(0, 4).toUpperCase();
}

// Generate activation code
function generateCode(planType, serial) {
  const planPrefix = planType.toString();
  const serialHex = serial.toString(16).padStart(3, '0').toUpperCase();
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  // Create base code
  const baseCode = `${planPrefix}${randomHex}${serialHex}`;
  
  // Generate checksum
  const checksum = generateChecksum(baseCode);
  
  // Format: NB-XXXX-YYYY-ZZZZ
  return `NB-${baseCode.substring(0, 4)}-${baseCode.substring(4, 8)}-${checksum}`;
}

// Validate activation code
function validateCode(code) {
  const codeRegex = /^NB-([A-F0-9]{4})-([A-F0-9]{4})-([A-F0-9]{4})$/;
  const match = code.match(codeRegex);
  
  if (!match) {
    return { valid: false, error: '激活码格式错误' };
  }

  const [, part1, part2, checksum] = match;
  const baseCode = part1 + part2;
  
  // Verify checksum
  const expectedChecksum = generateChecksum(baseCode);
  if (checksum !== expectedChecksum) {
    return { valid: false, error: '激活码无效' };
  }

  // Extract plan type
  const planType = parseInt(baseCode.charAt(0));
  if (!PLANS[planType]) {
    return { valid: false, error: '未知的套餐类型' };
  }

  // For custom plans (planType = 9), we need to extract credits from the code
  let plan = PLANS[planType];
  if (planType === 9) {
    // For custom plans, extract credits from the serial number part
    const serial = parseInt(baseCode.substring(5, 8), 16);
    // Use serial as a simple encoding for credits (you can modify this logic)
    const customCredits = Math.max(1, serial % 1000); // Extract credits from serial, minimum 1
    plan = {
      name: '🎨 自定义套餐',
      credits: customCredits,
      price: 0, // Price will be determined by the generator
      type: 'custom'
    };
  }

  return {
    valid: true,
    planType,
    plan,
    serial: parseInt(baseCode.substring(5, 8), 16)
  };
}

// Generate batch codes
function generateBatch(planType, quantity) {
  const codes = [];
  const plan = PLANS[planType];
  
  if (!plan) {
    throw new Error(`无效的套餐类型: ${planType}`);
  }

  console.log(`\n🔄 正在生成 ${quantity} 个 ${plan.name} 激活码...\n`);

  for (let i = 0; i < quantity; i++) {
    const serial = Math.floor(Math.random() * 4096); // Random serial
    const code = generateCode(planType, serial);
    
    codes.push({
      code,
      planType,
      planName: plan.name,
      credits: plan.credits,
      price: plan.price,
      serial,
      generatedAt: new Date().toISOString()
    });
  }

  return codes;
}

// Export codes to CSV
function exportToCSV(codes, filename) {
  const headers = ['激活码', '套餐类型', '套餐名称', '额度', '价格', '序列号', '生成时间'];
  const csvContent = [
    headers.join(','),
    ...codes.map(code => [
      code.code,
      code.planType,
      `"${code.planName}"`,
      code.credits,
      code.price,
      code.serial,
      code.generatedAt
    ].join(','))
  ].join('\n');

  fs.writeFileSync(filename, csvContent, 'utf8');
  console.log(`📄 激活码已导出到: ${filename}`);
}

// Command line interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🍌 Nano Banana 激活码生成器

用法:
  node codeGenerator.js generate <套餐类型> [数量]     # 生成激活码
  node codeGenerator.js validate <激活码>             # 验证激活码
  node codeGenerator.js batch <套餐类型> <数量>       # 批量生成并导出CSV
  node codeGenerator.js demo                          # 生成演示激活码

套餐类型:
  1 - 🍌 尝鲜套餐 (10次, ¥13.9)
  2 - 💎 基础套餐 (100次, ¥69.9)
  3 - 🚀 高阶套餐 (300次, ¥199.9)

示例:
  node codeGenerator.js generate 1        # 生成1个尝鲜套餐激活码
  node codeGenerator.js generate 2 5      # 生成5个基础套餐激活码
  node codeGenerator.js batch 1 100       # 批量生成100个尝鲜套餐激活码并导出CSV
  node codeGenerator.js validate NB-1234-5678-9ABC
    `);
    return;
  }

  const command = args[0];

  switch (command) {
    case 'generate': {
      const planType = parseInt(args[1]);
      const quantity = parseInt(args[2]) || 1;
      
      if (!PLANS[planType]) {
        console.error('❌ 无效的套餐类型');
        return;
      }

      const codes = generateBatch(planType, quantity);
      
      codes.forEach((codeInfo, index) => {
        console.log(`${index + 1}. ${codeInfo.code} (${codeInfo.planName})`);
      });
      
      console.log(`\n✅ 成功生成 ${quantity} 个激活码`);
      break;
    }

    case 'validate': {
      const code = args[1];
      if (!code) {
        console.error('❌ 请提供要验证的激活码');
        return;
      }

      const result = validateCode(code);
      if (result.valid) {
        console.log(`✅ 激活码有效`);
        console.log(`   套餐: ${result.plan.name}`);
        console.log(`   额度: ${result.plan.credits}次`);
        console.log(`   价格: ¥${result.plan.price}`);
        console.log(`   序列号: ${result.serial}`);
      } else {
        console.log(`❌ 激活码无效: ${result.error}`);
      }
      break;
    }

    case 'batch': {
      const planType = parseInt(args[1]);
      const quantity = parseInt(args[2]);
      
      if (!PLANS[planType]) {
        console.error('❌ 无效的套餐类型');
        return;
      }
      
      if (!quantity || quantity <= 0) {
        console.error('❌ 请提供有效的数量');
        return;
      }

      const codes = generateBatch(planType, quantity);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `activation-codes-${PLANS[planType].type}-${quantity}-${timestamp}.csv`;
      
      exportToCSV(codes, filename);
      console.log(`\n✅ 成功生成并导出 ${quantity} 个 ${PLANS[planType].name} 激活码`);
      break;
    }

    case 'demo': {
      console.log('\n🍌 Nano Banana 演示激活码\n');
      
      // Generate one code for each plan
      for (let planType = 1; planType <= 3; planType++) {
        const plan = PLANS[planType];
        const serial = Math.floor(Math.random() * 4096);
        const code = generateCode(planType, serial);
        
        console.log(`${plan.name}:`);
        console.log(`  激活码: ${code}`);
        console.log(`  价格: ¥${plan.price}`);
        console.log(`  额度: ${plan.credits}次`);
        console.log('');
      }
      
      console.log('💡 使用说明：');
      console.log('1. 复制上面的激活码');
      console.log('2. 启动Nano Banana桌面应用');
      console.log('3. 点击右上角设置按钮');
      console.log('4. 在"激活码"标签页输入激活码');
      console.log('5. 点击"激活套餐"按钮');
      console.log('');
      console.log('⚠️  注意：这些是演示激活码，仅用于开发测试！');
      break;
    }

    default:
      console.error('❌ 未知命令，使用 node codeGenerator.js 查看帮助');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateCode,
  validateCode,
  generateBatch,
  exportToCSV,
  PLANS
};
