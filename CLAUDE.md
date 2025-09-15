# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 提供使用此代码库代码的指导。

## 项目概述

Nano Banana 是一个由人工智能驱动的图像生成和编辑平台，采用桌面 Electron 应用程序和云代理服务架构。该项目实施了激活码许可系统以实现盈利。

## 关键命令

### 开发命令
```bash
# 桌面应用开发
cd nano-banana-desktop && npm run dev # 使用热加载启动 Electron 应用
cd nano-banana-desktop && npm start # 生产环境启动（自动检测后端）

# 仅限前端 (React/Vite)
cd nano-banana-desktop/frontend && npm run dev # 在 5174 端口启动前端开发服务器
cd nano-banana-desktop/frontend && npm run build # 构建前端
cd nano-banana-desktop/frontend && npm run lint # Lint 前端代码

# 后端服务
cd nano-banana-desktop/backend && npm start # 启动本地后端
cd gemini-proxy && npm start # 启动代理服务
cd gemini-proxy && npm run dev # 代理服务使用 nodemon

# 云部署
cd cloud-deploy && npm run deploy # 部署到云服务器
cd cloud-deploy && npm run start # 使用 PM2 启动
cd cloud-deploy && npm run logs # 查看 PM2 日志

# 测试
cd gemini-proxy && npm test # 运行 Jest 测试
```

### 构建和分发
```bash
cd nano-banana-desktop && npm run build # 构建 Electron 应用
cd nano-banana-desktop && npm run dist # 创建可分发包
```

## 架构概览

### 多服务架构
该项目由几个相互关联的组件组成：

1. **nano-banana-desktop/** - 主 Electron 桌面应用程序
- **main.js** - 带有激活系统的 Electron 主进程
- **frontend/** - React/TypeScript UI（端口 5174）开发)
- **backend/** - Express.js 本地 API 服务器（端口 3001）
- **activation/** - 本地激活码验证系统

2. **gemini-proxy/** - 用于 API 调用的云代理服务
- Express.js 服务器，代理 Gemini API 请求
- 处理身份验证、配额管理和速率限制
- 部署到云服务器（默认：43.142.153.33:3001）

3. **NanoBananaEditor/** - 独立网页版（旧版）
- React/TypeScript Vite 应用程序
- 直接集成 Gemini API

4. **cloud-deploy/** - 部署自动化工具
- PM2 配置和部署脚本

### 激活系统
桌面应用使用复杂的激活码系统：
- **activationManager.js** - 核心激活逻辑和设备指纹识别
- **deviceFingerprint.js** - 基于硬件的设备识别
- 本地 SQLite 数据库激活存储
- 三层定价模式（试用/基础/高级）

### API 架构
```
桌面应用 → 本地后端 (3001) → 云代理 (43.142.153.33:3001) → Gemini API
```

该应用会智能检测 3001 端口是否被占用，并在本地/远程后端之间切换。

## 关键文件和模式

### 前端 (React/TypeScript)
- **src/App.tsx** - 带路由的主应用组件
- **src/store/useAppStore.ts** - 全局状态管理
- **src/components/** - 使用 Radix UI + Tailwind 的 React 组件
- **src/services/** - API 服务层
- 使用 Konva.js 进行画布操作和图片编辑

### 后端服务
- **server.js** 文件是 Express 服务的主要入口点
- **middleware/auth.js** - JWT 身份验证中间件
- **middleware/quota.js** - 使用配额执行
- **services/gemini.js** - Gemini API 集成层
- **services/database.js** - SQLite 数据库操作

### 环境配置
- **.env** 文件用于环境特定设置
- **GEMINI_API_KEY** - API 访问必需
- **PROXY_ENDPOINT** - 云代理服务 URL
- **JWT_SECRET** - 身份验证密钥

## 测试策略

### 测试结构
- 使用 **Jest** 在 gemini-proxy 服务中进行单元测试
- 根目录中的手动测试工具（test-*.js 文件）
- 激活系统有专用的测试实用程序

### 可用的测试命令
```bash
# API 测试
node test-gemini-proxy.js # 测试代理服务
node test-activation-system.js # 测试激活码
node test-payment.js # 测试支付集成

# 前端测试
cd nano-banana-desktop/frontend && npm run lint # ESLint 验证
```

## 重要开发说明

### 端口管理
- 桌面应用在启动本地后端之前检查 3001 端口的可用性
- 前端开发服务器在 5174 端口上运行（在 package.json 中配置）
- 生产版本使用 3001 端口进行 API 测试通信

### 激活码系统
激活码系统是商业模式的核心：
- 激活码格式：NB-XXXX-YYYY-ZZZZ
- 设备指纹识别，防止代码共享
- 本地 SQLite 存储，用于离线验证
- 基于积分的使用情况跟踪

### 部署架构
- 本地开发使用直接 Gemini API
