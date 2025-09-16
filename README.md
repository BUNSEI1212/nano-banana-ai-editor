# 🍌 Nano Banana AI Editor

一个基于Electron的AI图像生成和编辑桌面应用程序，集成了Gemini AI API和完整的激活系统。

## ✨ 功能特性

- 🎨 **AI图像生成** - 基于Gemini 2.5 Flash模型的高质量图像生成
- ✏️ **图像编辑** - 支持遮罩编辑和图像修改
- 🔐 **激活系统** - 完整的许可证管理和设备指纹识别
- 🌊 **流式响应** - 23.7%性能提升的实时响应
- 🔄 **多密钥轮询** - 智能负载均衡和故障转移
- 🖥️ **跨平台** - 支持Windows、macOS和Linux

## 🚀 快速开始

### 下载安装包

- **Windows**: [下载 .exe 安装包](https://github.com/BUNSEI1212/nano-banana-ai-editor/releases)
- **macOS**: [下载 .dmg 安装包](https://github.com/BUNSEI1212/nano-banana-ai-editor/releases)
- **Linux**: [下载 .AppImage 文件](https://github.com/BUNSEI1212/nano-banana-ai-editor/releases)

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/BUNSEI1212/nano-banana-ai-editor.git
cd nano-banana-ai-editor

# 安装依赖
cd nano-banana-desktop
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 启动开发环境
npm run dev
```

## 🏗️ 构建

### 本地构建

```bash
# 构建当前平台
cd nano-banana-desktop
npm run build

# 多平台构建脚本
./build-all-platforms.sh
```

### GitHub Actions自动构建

推送代码到GitHub后，Actions会自动构建所有平台的安装包：

- 推送到main分支：触发构建
- 创建tag（如v2.0.0）：触发构建并创建Release

## 🏛️ 架构

```
桌面应用 → 云服务器 (43.142.153.33:3001) → 中转API → Gemini API
```

### 组件说明

- **nano-banana-desktop/** - Electron桌面应用
- **gemini-proxy/** - 云代理服务
- **cloud-deploy/** - 部署自动化工具

## 📱 激活系统

应用使用三层定价模式：
- **试用版** - 基础功能体验
- **基础版** - 完整功能访问
- **高级版** - 无限制使用

## 🔧 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + SQLite
- **桌面**: Electron
- **AI**: Gemini 2.5 Flash API
- **部署**: PM2 + 云服务器

## 📄 许可证

AGPL-3.0 License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**Nano Banana Team** 🍌