#!/usr/bin/env node

/**
 * 实时监控API Key使用情况
 * 监控后端日志中的API Key选择和图像生成结果
 */

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🔍 开始实时监控API Key使用情况...');
console.log('⏰ 监控时间：60秒');
console.log('📝 请在另一个窗口中生成图像，我会实时显示API Key使用情况\n');

let requestCount = 0;
let successCount = 0;
let failureCount = 0;
const keyUsage = new Map();

// 监控开始时间
const startTime = Date.now();
const monitorDuration = 60 * 1000; // 60秒

// 创建一个定时器，60秒后停止监控
const timer = setTimeout(() => {
  console.log('\n⏰ 监控时间结束！');
  console.log('\n📊 监控总结:');
  console.log(`   总请求数: ${requestCount}`);
  console.log(`   成功数: ${successCount}`);
  console.log(`   失败数: ${failureCount}`);
  console.log(`   成功率: ${requestCount > 0 ? ((successCount / requestCount) * 100).toFixed(1) : 0}%`);
  
  if (keyUsage.size > 0) {
    console.log('\n🔑 API Key使用统计:');
    for (const [key, count] of keyUsage.entries()) {
      console.log(`   ${key}: ${count}次`);
    }
  }
  
  process.exit(0);
}, monitorDuration);

// 解析日志行
function parseLogLine(line) {
  try {
    // 查找JSON格式的日志
    const jsonMatch = line.match(/\{.*\}/);
    if (jsonMatch) {
      const logData = JSON.parse(jsonMatch[0]);
      return logData;
    }
  } catch (error) {
    // 忽略解析错误
  }
  return null;
}

// 处理API Key选择日志
function handleApiKeySelection(logData) {
  if (logData.message && logData.message.includes('🔑 API Key Selection')) {
    requestCount++;
    const keyInfo = logData.data?.selectedKey || 'Unknown';
    const usage = logData.data?.currentUsage || 0;
    const priority = logData.data?.priority || 0;
    
    // 提取Key标识
    const keyId = keyInfo.split('(')[0].trim();
    keyUsage.set(keyId, (keyUsage.get(keyId) || 0) + 1);
    
    console.log(`🔑 [${new Date().toLocaleTimeString()}] 请求 #${requestCount}`);
    console.log(`   使用Key: ${keyInfo}`);
    console.log(`   优先级: ${priority}, 当前使用次数: ${usage}`);
  }
}

// 处理图像生成结果
function handleGenerationResult(logData) {
  if (logData.message && logData.message.includes('Image generation completed')) {
    const match = logData.message.match(/generated (\d+) images/);
    if (match) {
      const imageCount = parseInt(match[1]);
      if (imageCount > 0) {
        successCount++;
        console.log(`   ✅ 成功生成 ${imageCount} 张图像`);
      } else {
        failureCount++;
        console.log(`   ❌ 生成失败 (返回0张图像)`);
      }
    }
  } else if (logData.message && logData.message.includes('Image generation failed')) {
    failureCount++;
    console.log(`   ❌ 生成失败 (API错误)`);
  }
}

// 处理错误日志
function handleError(logData) {
  if (logData.level === 'ERROR' && logData.message.includes('Generate error')) {
    console.log(`   ⚠️ 生成错误: ${logData.message}`);
  }
}

// 监控进程输出
function monitorProcess() {
  // 读取当前运行的进程输出
  const ps = spawn('powershell', [
    '-Command', 
    'Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.MainWindowTitle -like "*nano-banana*"} | Select-Object Id'
  ]);
  
  let processFound = false;
  
  ps.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('🔍 正在监控后端进程日志...\n');
    processFound = true;
    
    // 开始监控日志输出
    startLogMonitoring();
  });
  
  ps.on('close', () => {
    if (!processFound) {
      console.log('⚠️ 未找到运行中的nano-banana进程');
      console.log('💡 请确保后端服务正在运行 (npm start)');
      process.exit(1);
    }
  });
}

// 开始日志监控
function startLogMonitoring() {
  console.log('📡 开始监控日志输出...');
  console.log('🎯 等待图像生成请求...\n');
  
  // 创建readline接口来处理实时输入
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // 模拟日志监控 - 实际应该连接到真实的日志流
  console.log('💡 提示: 请在应用中生成图像，我会显示API Key使用情况');
  console.log('⏱️ 监控剩余时间: 60秒\n');
  
  // 显示倒计时
  let remainingTime = 60;
  const countdown = setInterval(() => {
    remainingTime--;
    if (remainingTime % 10 === 0 || remainingTime <= 5) {
      console.log(`⏱️ 剩余时间: ${remainingTime}秒`);
    }
  }, 1000);
  
  // 清理定时器
  timer.addEventListener?.('timeout', () => {
    clearInterval(countdown);
  });
}

// 启动监控
monitorProcess();

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n\n👋 监控已停止');
  process.exit(0);
});
