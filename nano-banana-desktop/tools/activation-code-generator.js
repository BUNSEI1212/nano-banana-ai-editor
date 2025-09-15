// 激活码生成器 JavaScript (浏览器版本)

// 密钥和套餐配置
const SECRET_KEY = 'NB2024-SECRET-KEY-FOR-ACTIVATION';
const PLANS = {
    1: { name: '🍌 尝鲜套餐', credits: 10, price: 13.9, type: 'trial' },
    2: { name: '💎 基础套餐', credits: 100, price: 69.9, type: 'basic' },
    3: { name: '🚀 高阶套餐', credits: 300, price: 199.9, type: 'premium' },
    9: { name: '🎨 自定义套餐', credits: 0, price: 0, type: 'custom' } // 自定义套餐
};

let selectedPlan = null;
let generatedCodes = [];

// 浏览器版本的HMAC-SHA256实现
async function generateChecksum(baseCode) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const messageData = encoder.encode(baseCode);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex.substring(0, 4).toUpperCase();
}

// 生成随机十六进制字符串
function generateRandomHex(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// 生成激活码 (异步版本)
async function generateCode(planType, serial, customCredits = null) {
    const planPrefix = planType.toString();

    // For custom plans (planType = 9), encode credits in the serial
    let actualSerial = serial;
    if (planType === 9 && customCredits) {
        // Encode credits in the serial (limit to 999 to fit in 3 hex digits)
        actualSerial = Math.min(customCredits, 999);
    }

    const serialHex = actualSerial.toString(16).padStart(3, '0').toUpperCase();
    const randomHex = generateRandomHex(2);

    const baseCode = `${planPrefix}${randomHex}${serialHex}`;
    const checksum = await generateChecksum(baseCode);

    return `NB-${baseCode.substring(0, 4)}-${baseCode.substring(4, 8)}-${checksum}`;
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    initializePlanButtons();
    initializeGenerateButton();
    initializeExportButton();
});

// 初始化套餐按钮
function initializePlanButtons() {
    const planButtons = document.querySelectorAll('.plan-btn');
    const customPlan = document.getElementById('customPlan');
    
    planButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有活动状态
            planButtons.forEach(b => b.classList.remove('active'));
            
            // 添加活动状态
            this.classList.add('active');
            
            const planType = this.dataset.plan;
            
            if (planType === 'custom') {
                customPlan.style.display = 'block';
                selectedPlan = 'custom';
            } else {
                customPlan.style.display = 'none';
                selectedPlan = parseInt(planType);
            }
        });
    });
}

// 初始化生成按钮
function initializeGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    
    generateBtn.addEventListener('click', async function() {
        if (!selectedPlan) {
            alert('请先选择套餐类型！');
            return;
        }

        const quantity = parseInt(document.getElementById('quantity').value);
        if (!quantity || quantity <= 0) {
            alert('请输入有效的生成数量！');
            return;
        }

        if (quantity > 1000) {
            alert('单次生成数量不能超过1000个！');
            return;
        }

        await generateActivationCodes(quantity);
    });
}

// 生成激活码 (异步版本)
async function generateActivationCodes(quantity) {
    const generateBtn = document.getElementById('generateBtn');
    const results = document.getElementById('results');
    const codesList = document.getElementById('codesList');

    // 显示加载状态
    generateBtn.disabled = true;
    generateBtn.textContent = '🔄 生成中...';

    // 获取套餐信息
    let planInfo;
    if (selectedPlan === 'custom') {
        const credits = parseInt(document.getElementById('customCredits').value);

        if (!credits || credits <= 0) {
            alert('请输入有效的使用次数！');
            resetGenerateButton();
            return;
        }

        if (credits > 999) {
            alert('使用次数不能超过999次！');
            resetGenerateButton();
            return;
        }

        planInfo = {
            name: `自定义套餐 (${credits}次)`,
            credits,
            price: 0, // 价格由您自由定价
            type: 'custom'
        };
    } else {
        planInfo = PLANS[selectedPlan];
    }

    // 生成激活码
    generatedCodes = [];

    try {
        for (let i = 0; i < quantity; i++) {
            const serial = Math.floor(Math.random() * 4096);
            const planTypeToUse = selectedPlan === 'custom' ? 9 : selectedPlan;

            // For custom plans, pass the credits to encode in the activation code
            const code = await generateCode(
                planTypeToUse,
                serial,
                selectedPlan === 'custom' ? planInfo.credits : null
            );

            generatedCodes.push({
                code,
                planName: planInfo.name,
                credits: planInfo.credits,
                price: planInfo.price,
                serial,
                generatedAt: new Date().toISOString()
            });

            // 更新进度
            generateBtn.textContent = `🔄 生成中... (${i + 1}/${quantity})`;
        }

        displayResults();
        resetGenerateButton();

    } catch (error) {
        alert('生成激活码时出错：' + error.message);
        resetGenerateButton();
    }
}

// 显示结果
function displayResults() {
    const results = document.getElementById('results');
    const codesList = document.getElementById('codesList');
    
    codesList.innerHTML = '';
    
    generatedCodes.forEach((codeInfo, index) => {
        const codeItem = document.createElement('div');
        codeItem.className = 'code-item';
        
        codeItem.innerHTML = `
            <div>
                <div class="code-text">${codeInfo.code}</div>
                <small>${codeInfo.planName} - ${codeInfo.credits}次使用额度</small>
            </div>
            <button class="copy-btn" onclick="copyCode('${codeInfo.code}')">
                📋 复制
            </button>
        `;
        
        codesList.appendChild(codeItem);
    });
    
    results.style.display = 'block';
    results.scrollIntoView({ behavior: 'smooth' });
}

// 复制激活码
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        // 临时显示复制成功
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ 已复制';
        btn.style.background = '#10B981';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#FDE047';
        }, 1000);
    }).catch(() => {
        alert('复制失败，请手动复制激活码');
    });
}

// 重置生成按钮
function resetGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = false;
    generateBtn.textContent = '🎯 生成激活码';
}

// 初始化导出按钮
function initializeExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    
    exportBtn.addEventListener('click', function() {
        if (generatedCodes.length === 0) {
            alert('没有可导出的激活码！');
            return;
        }
        
        exportToCSV();
    });
}

// 导出为CSV
function exportToCSV() {
    const headers = ['激活码', '套餐名称', '使用次数', '序列号', '生成时间'];
    const csvContent = [
        headers.join(','),
        ...generatedCodes.map(code => [
            code.code,
            `"${code.planName}"`,
            code.credits,
            code.serial,
            code.generatedAt
        ].join(','))
    ].join('\n');
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `activation-codes-${generatedCodes.length}-${timestamp}.csv`;
        link.setAttribute('download', filename);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 显示成功消息
        const exportBtn = document.getElementById('exportBtn');
        const originalText = exportBtn.textContent;
        exportBtn.textContent = '✅ 导出成功';
        exportBtn.style.background = '#10B981';
        
        setTimeout(() => {
            exportBtn.textContent = originalText;
            exportBtn.style.background = '#10B981';
        }, 2000);
    }
}
