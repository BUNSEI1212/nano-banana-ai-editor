# 🍌 Nano Banana Editor - 二次开发指南

## 📋 项目状态
✅ 项目已成功克隆到本地  
✅ 依赖已安装完成  
✅ 开发服务器已启动  
✅ 环境配置已完成  

## 🚀 快速开始

### 当前项目结构
```
NanoBananaEditor/
├── src/
│   ├── components/     # React组件
│   ├── services/       # API服务
│   ├── store/         # 状态管理
│   ├── hooks/         # 自定义钩子
│   ├── types/         # TypeScript类型
│   └── utils/         # 工具函数
├── .env               # 环境变量 (需要配置)
└── package.json       # 项目配置
```

### 🔧 环境配置

**重要：配置Gemini API Key**
1. 编辑 `.env` 文件
2. 将 `your_gemini_api_key_here` 替换为您的实际API Key
3. 获取API Key: https://aistudio.google.com/

```bash
# .env 文件内容
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### 📱 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

### 🌐 访问应用
- 开发服务器: http://localhost:5173/
- 当前状态: ✅ 正在运行

## 🎯 二次开发重点

### 核心组件分析
1. **PromptComposer.tsx** - 提示词输入和工具选择
2. **ImageCanvas.tsx** - 图像显示和编辑画布
3. **HistoryPanel.tsx** - 生成历史管理
4. **geminiService.ts** - AI服务集成

### 技术栈
- **前端**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI
- **状态**: Zustand + React Query
- **画布**: Konva.js + React-Konva
- **AI**: Google Gemini 2.5 Flash Image

### 🔄 开发工作流
1. 修改代码 → 自动热重载
2. 测试功能 → 浏览器实时预览
3. 构建部署 → `npm run build`

## ⚖️ 许可证注意事项

**AGPL-3.0 许可证要求：**
- ✅ 可以商业使用
- ⚠️ 必须开源您的修改
- ⚠️ 网络服务必须提供源代码
- ⚠️ 保留原始版权信息

## 🛠️ 常见开发任务

### 添加新功能
1. 在 `src/components/` 创建新组件
2. 在 `src/services/` 添加API服务
3. 在 `src/store/` 更新状态管理
4. 在 `src/types/` 定义TypeScript类型

### 自定义样式
- 编辑 `tailwind.config.js`
- 修改 `src/index.css`
- 使用Tailwind CSS类

### API集成
- 查看 `src/services/geminiService.ts`
- 添加新的AI服务提供商
- 实现后端代理（生产环境推荐）

## 🚨 开发注意事项

1. **API安全**: 生产环境应使用后端代理
2. **类型安全**: 严格使用TypeScript
3. **组件大小**: 保持组件在200行以内
4. **性能优化**: 使用React.memo和useMemo
5. **移动端**: 确保响应式设计

## 📝 下一步建议

1. **配置API Key** - 获取Gemini API密钥
2. **熟悉代码** - 阅读核心组件源码
3. **功能测试** - 测试图像生成和编辑
4. **自定义开发** - 根据需求修改功能
5. **部署准备** - 考虑生产环境配置

---
**开发环境已就绪！🎉 可以开始您的二次开发之旅了！**
