# 🍌 Nano Banana 激活码生成工具

这个工具用于生成和管理 Nano Banana 桌面应用的激活码。

## 📁 文件说明

- `codeGenerator.js` - 核心激活码生成器
- `generate-codes.bat` - Windows 批处理脚本（图形界面）
- `generateTestCodes.js` - 原始测试代码生成器（已存在）

## 🚀 快速开始

### 方法1：使用批处理脚本（推荐）

双击运行 `generate-codes.bat`，按照菜单提示操作：

```
🍌 Nano Banana 激活码生成器
================================

请选择操作：
1. 生成演示激活码（每种套餐1个）
2. 生成尝鲜套餐激活码
3. 生成基础套餐激活码  
4. 生成高阶套餐激活码
5. 批量生成激活码（导出CSV）
6. 验证激活码
0. 退出
```

### 方法2：使用命令行

```bash
# 进入工具目录
cd nano-banana-desktop/tools

# 生成演示激活码（每种套餐1个）
node codeGenerator.js demo

# 生成单个激活码
node codeGenerator.js generate 1        # 尝鲜套餐
node codeGenerator.js generate 2        # 基础套餐
node codeGenerator.js generate 3        # 高阶套餐

# 生成多个激活码
node codeGenerator.js generate 1 5      # 生成5个尝鲜套餐激活码

# 批量生成并导出CSV
node codeGenerator.js batch 1 100       # 生成100个尝鲜套餐激活码

# 验证激活码
node codeGenerator.js validate NB-1234-5678-9ABC
```

## 📋 套餐类型

| 类型 | 名称 | 额度 | 价格 | 说明 |
|------|------|------|------|------|
| 1 | 🍌 尝鲜套餐 | 10次 | ¥13.9 | 体验用户 |
| 2 | 💎 基础套餐 | 100次 | ¥69.9 | 普通用户 |
| 3 | 🚀 高阶套餐 | 300次 | ¥199.9 | 重度用户 |

## 🔐 激活码格式

```
格式：NB-XXXX-YYYY-ZZZZ
示例：NB-1A2B-3C4D-5E6F

结构解析：
- NB: 产品标识 (Nano Banana)
- XXXX: 套餐类型 + 随机码
  - 1XXX: 尝鲜套餐
  - 2XXX: 基础套餐  
  - 3XXX: 高阶套餐
- YYYY: 序列号 + 随机码
- ZZZZ: HMAC-SHA256 校验码（防伪造）
```

## 📊 批量生成

使用批量生成功能会创建CSV文件，包含以下信息：

- 激活码
- 套餐类型
- 套餐名称
- 额度
- 价格
- 序列号
- 生成时间

文件命名格式：`activation-codes-{套餐类型}-{数量}-{时间戳}.csv`

## 🔍 验证功能

验证激活码会检查：

1. ✅ 格式是否正确
2. ✅ 校验码是否有效
3. ✅ 套餐类型是否存在
4. ✅ 显示套餐详细信息

## 🛡️ 安全机制

- **HMAC-SHA256校验**：防止激活码伪造
- **唯一序列号**：防止重复生成
- **格式验证**：确保激活码格式正确
- **套餐验证**：确保套餐类型有效

## 💡 使用建议

### 开发测试
```bash
# 生成演示激活码用于测试
node codeGenerator.js demo
```

### 小批量销售
```bash
# 生成10个尝鲜套餐激活码
node codeGenerator.js generate 1 10
```

### 大批量销售
```bash
# 批量生成100个基础套餐激活码并导出CSV
node codeGenerator.js batch 2 100
```

### 客服验证
```bash
# 验证客户提供的激活码
node codeGenerator.js validate NB-2A3B-4C5D-6E7F
```

## 🔧 技术细节

### 密钥管理
- 密钥存储在 `activationManager.js` 中
- 生产环境应使用环境变量或安全存储
- 密钥：`NB2024-SECRET-KEY-FOR-ACTIVATION`

### 校验算法
```javascript
function generateChecksum(baseCode) {
  const hash = crypto.createHmac('sha256', SECRET_KEY)
                    .update(baseCode)
                    .digest('hex');
  return hash.substring(0, 4).toUpperCase();
}
```

### 序列号生成
- 使用随机数生成序列号
- 范围：0-4095 (0x000-0xFFF)
- 16进制格式，3位补零

## 📝 注意事项

1. **密钥安全**：生产环境请更换默认密钥
2. **激活码管理**：建议建立激活码数据库管理系统
3. **防重复使用**：应用会自动检查激活码是否已使用
4. **备份重要**：请备份生成的激活码文件
5. **版本兼容**：确保生成器版本与应用版本兼容

## 🆘 常见问题

**Q: 激活码格式错误？**
A: 确保格式为 `NB-XXXX-XXXX-XXXX`，所有字母大写

**Q: 激活码无效？**
A: 检查是否使用正确的密钥生成，或激活码是否被篡改

**Q: 如何批量导入激活码？**
A: 可以使用CSV文件批量导入到销售系统或数据库

**Q: 如何更换密钥？**
A: 修改 `activationManager.js` 和 `codeGenerator.js` 中的 `SECRET_KEY`

## 📞 技术支持

如有问题，请联系开发团队或查看应用日志文件。
