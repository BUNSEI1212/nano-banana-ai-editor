import React, { useState } from 'react';
import { X, Search, Sparkles, Image, User, Palette, Camera, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { creativePrompts, CreativePrompt } from '../data/creativePrompts';
import { useAppStore } from '../store/useAppStore';

interface CreativeWorkshopProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  '手办模型': Sparkles,
  '地图转换': Camera,
  'AR增强': Zap,
  '建筑设计': Image,
  '风格转换': Palette,
  '图像增强': Image,
  '姿态控制': User,
  '视角转换': Camera,
  '贴纸设计': Palette,
  'Cosplay': User,
  '角色设计': User,
  '上色技巧': Palette,
  '发型设计': User,
  '雕塑艺术': Sparkles,
  '美食制作': Sparkles,
  '照片修复': Image,
  '服装设计': Palette,
  '多视图': Camera,
  '玩具设计': Sparkles,
  '模型设计': Sparkles,
  '证件照': Camera,
  '珠宝设计': Sparkles,
  '周边设计': Palette,
  '复合场景': Camera,
  '信息图表': Image,
  '教育标注': Image,
  '教育辅助': Image,
  '时尚搭配': Palette,
  '故事创作': Sparkles,
  '姿态调整': User,
  '线稿转换': Palette,
  '水印处理': Image,
  '知识图表': Image,
  '图片分析': Search,
  '广告设计': Sparkles,
  '漫画创作': Sparkles,
  '人偶设计': Sparkles,
  '等距设计': Image,
  '表情设计': User,
  '绘画教程': Palette,
  '美妆试用': User,
  '美妆分析': Search,
  '奇幻场景': Sparkles,
  '字体设计': Palette,
  'Q版设计': User,
  '光影设计': Zap,
  '技术图解': Image,
  '营养标注': Image,
  '图像提取': Image,
  '图像修复': Image,
  '历史重现': Camera,
  '时尚设计': Palette,
  '产品摄影': Camera,
  '现实融合': Sparkles,
  '汽车设计': Sparkles,
  '全息效果': Zap,
  '游戏风格': Sparkles,
  '材质渲染': Sparkles,
  '建筑渲染': Image,
  '摄影参数': Camera,
  '卡片设计': Palette,
  '棋类设计': Sparkles,
  '时代对比': Camera,
  '滤镜效果': Palette,
  '包装设计': Palette,
};

export function CreativeWorkshop({ isOpen, onClose }: CreativeWorkshopProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { setCurrentPrompt } = useAppStore();

  const categories = ['全部', ...Array.from(new Set(creativePrompts.map(p => p.category)))];

  const filteredPrompts = creativePrompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === '全部' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGetPrompt = async (prompt: CreativePrompt) => {
    setIsLoading(prompt.id);
    
    // 模拟加载过程
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 设置提示词到输入框
    setCurrentPrompt(prompt.prompt);
    
    setIsLoading(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              🍌
            </div>
            <h2 className="text-2xl font-bold text-white">创意工坊</h2>
            <span className="text-sm text-gray-400">精选提示词库</span>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索提示词、标签或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>没有找到匹配的提示词</p>
              <p className="text-sm mt-1">尝试调整搜索条件或选择不同的分类</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrompts.map((prompt) => {
                const IconComponent = categoryIcons[prompt.category as keyof typeof categoryIcons] || Sparkles;
                const loading = isLoading === prompt.id;
                
                return (
                  <div
                    key={prompt.id}
                    className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors border border-gray-600 hover:border-gray-500"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5 text-blue-400" />
                        <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded-full">
                          {prompt.category}
                        </span>
                      </div>
                      {prompt.requiresImage && (
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <Image className="w-3 h-3" />
                          <span>需要图片</span>
                        </div>
                      )}
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-lg font-semibold text-white mb-2">{prompt.title}</h3>
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{prompt.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {prompt.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                      {prompt.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded">
                          +{prompt.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Author and Action */}
                    <div className="flex items-center justify-between">
                      {prompt.author && (
                        <span className="text-xs text-gray-400">by {prompt.author}</span>
                      )}
                      <Button
                        onClick={() => handleGetPrompt(prompt)}
                        disabled={loading}
                        size="sm"
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-medium"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                            加载中...
                          </div>
                        ) : (
                          'Get it!'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-750">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>共 {creativePrompts.length} 个精选提示词</span>
            <span>数据来源：Awesome-Nano-Banana-images</span>
          </div>
        </div>
      </div>
    </div>
  );
}
