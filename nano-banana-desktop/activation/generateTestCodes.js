const crypto = require('crypto');

// Same secret key as in activationManager.js
const SECRET_KEY = 'NB2024-SECRET-KEY-FOR-ACTIVATION';

// Plans
const PLANS = {
  1: { name: '尝鲜套餐', credits: 10, price: 13.9 },
  2: { name: '基础套餐', credits: 100, price: 69.9 },
  3: { name: '高阶套餐', credits: 300, price: 199.9 }
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

// Generate test codes
console.log('🍌 Nano Banana 激活码生成器\n');
console.log('生成测试激活码：\n');

// Generate one code for each plan
for (let planType = 1; planType <= 3; planType++) {
  const plan = PLANS[planType];
  const serial = Math.floor(Math.random() * 4096); // Random serial
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
console.log('3. 在激活界面输入激活码');
console.log('4. 点击"激活应用"按钮');
console.log('');
console.log('⚠️  注意：这些是测试激活码，仅用于开发测试！');
