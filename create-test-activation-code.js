const crypto = require('crypto');

// Same secret key as in the activation system
const ACTIVATION_SECRET_KEY = 'NB2024-SECRET-KEY-FOR-ACTIVATION';

// Plans configuration
const PLANS = {
  1: { name: '🍌 尝鲜套餐', credits: 10, price: 13.9 },
  2: { name: '💎 基础套餐', credits: 100, price: 69.9 },
  3: { name: '🚀 高阶套餐', credits: 300, price: 199.9 }
};

function generateChecksum(baseCode) {
  const hash = crypto.createHmac('sha256', ACTIVATION_SECRET_KEY)
                    .update(baseCode)
                    .digest('hex');
  return hash.substring(0, 4).toUpperCase();
}

function generateActivationCode(planType, serial) {
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

// Generate test activation codes for each plan
console.log('🎫 Generating Test Activation Codes\n');

for (let planType = 1; planType <= 3; planType++) {
  const plan = PLANS[planType];
  const code = generateActivationCode(planType, Math.floor(Math.random() * 1000));
  
  console.log(`${plan.name}:`);
  console.log(`  Code: ${code}`);
  console.log(`  Credits: ${plan.credits}`);
  console.log(`  Price: ¥${plan.price}`);
  console.log();
}

// Generate a specific test code for our test script
const testCode = generateActivationCode(2, 123); // Basic plan, serial 123
console.log(`🧪 Test Code for Scripts: ${testCode}`);
console.log('   (Basic plan, 100 credits, ¥69.9)');

console.log('\n📝 To use these codes:');
console.log('1. Update test-activation-system.js with one of these codes');
console.log('2. Or manually insert them into the database');
console.log('3. The codes are cryptographically valid and will pass format validation');
