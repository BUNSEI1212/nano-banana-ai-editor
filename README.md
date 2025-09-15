# 🍌 Nano Banana AI Editor

AI-powered image generation and editing platform with Electron desktop app and cloud proxy service.

## 🚀 Quick Start

### Desktop Application
```bash
cd nano-banana-desktop && npm start
```

### Cloud Proxy Service
```bash
cd gemini-proxy && npm start
```

## 📁 Project Structure

- **nano-banana-desktop/** - Electron desktop application
- **gemini-proxy/** - Cloud proxy service (main backend)
- **cloud-deploy/** - Deployment automation tools
- **NanoBananaEditor/** - Standalone web version

## 🔧 Architecture

```
Desktop App (Electron) → Cloud Server (gemini-proxy:3001) → Relay API → Gemini
```

## 📖 Documentation

- [CLAUDE.md](CLAUDE.md) - Development guide for Claude Code
- [启动方式.md](启动方式.md) - Startup methods (Chinese)
- [DEPLOYMENT-PLAN.md](DEPLOYMENT-PLAN.md) - Deployment strategy

## 🛠️ Development

See [CLAUDE.md](CLAUDE.md) for detailed development instructions.

## 📄 License

MIT License