import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { History, Download, Image as ImageIcon, Layers } from 'lucide-react';
import { cn } from '../utils/cn';
import { ImagePreviewModal } from './ImagePreviewModal';

export const HistoryPanel: React.FC = () => {
  const {
    currentProject,
    canvasImage,
    selectedGenerationId,
    selectedEditId,
    selectGeneration,
    selectEdit,
    showHistory,
    setShowHistory,
    setCanvasImage,
    selectedTool
  } = useAppStore();

  const [previewModal, setPreviewModal] = React.useState<{
    open: boolean;
    imageUrl: string;
    title: string;
    description?: string;
  }>({
    open: false,
    imageUrl: '',
    title: '',
    description: ''
  });

  const generations = currentProject?.generations || [];
  const edits = currentProject?.edits || [];

  // Get current image dimensions
  const [imageDimensions, setImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  
  React.useEffect(() => {
    if (canvasImage) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = canvasImage;
    } else {
      setImageDimensions(null);
    }
  }, [canvasImage]);

  if (!showHistory) {
    return (
      <div className="w-8 bg-gray-950 border-l border-gray-800 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowHistory(true)}
          className="w-6 h-16 bg-gray-800 hover:bg-gray-700 rounded-l-lg border border-r-0 border-gray-700 flex items-center justify-center transition-colors group"
          title="显示历史面板"
        >
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-950 border-l border-gray-800 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">历史记录</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHistory(!showHistory)}
          className="h-6 w-6"
          title="隐藏历史面板"
        >
          ×
        </Button>
      </div>

      {/* Variants Grid */}
      <div className="mb-6 flex-shrink-0">
        {generations.length === 0 && edits.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm text-gray-500">暂无生成记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Show generations */}
            {generations.slice(-2).map((generation, index) => (
              <div
                key={generation.id}
                className={cn(
                  'relative aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden',
                  selectedGenerationId === generation.id
                    ? 'border-yellow-400'
                    : 'border-gray-700 hover:border-gray-600'
                )}
                onClick={() => {
                  selectGeneration(generation.id);
                  if (generation.outputAssets[0]) {
                    setCanvasImage(generation.outputAssets[0].url);
                  }
                }}
              >
                {generation.outputAssets[0] ? (
                  <>
                    <img
                      src={generation.outputAssets[0].url}
                      alt="生成的变体"
                      className="w-full h-full object-cover"
                    />
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" />
                  </div>
                )}
                
                {/* Variant Number */}
                <div className="absolute top-2 left-2 bg-gray-900/80 text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
            
            {/* Show edits */}
            {edits.slice(-2).map((edit, index) => (
              <div
                key={edit.id}
                className={cn(
                  'relative aspect-square rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden',
                  selectedEditId === edit.id
                    ? 'border-yellow-400'
                    : 'border-gray-700 hover:border-gray-600'
                )}
                onClick={() => {
                  if (edit.outputAssets[0]) {
                    setCanvasImage(edit.outputAssets[0].url);
                    selectEdit(edit.id);
                    selectGeneration(null);
                  }
                }}
              >
                {edit.outputAssets[0] ? (
                  <img
                    src={edit.outputAssets[0].url}
                    alt="编辑的变体"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" />
                  </div>
                )}
                
                {/* Edit Label */}
                <div className="absolute top-2 left-2 bg-purple-900/80 text-xs px-2 py-1 rounded">
                  编辑 #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Image Info */}
      {(canvasImage || imageDimensions) && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <h4 className="text-xs font-medium text-gray-400 mb-2">当前图像</h4>
          <div className="space-y-1 text-xs text-gray-500">
            {imageDimensions && (
              <div className="flex justify-between">
                <span>尺寸：</span>
                <span className="text-gray-300">{imageDimensions.width} × {imageDimensions.height}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>模式：</span>
              <span className="text-gray-300 capitalize">{selectedTool === 'generate' ? '生成' : selectedTool === 'edit' ? '编辑' : '选择'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Generation Details */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700 flex-1 overflow-y-auto min-h-0">
        <h4 className="text-xs font-medium text-gray-400 mb-2">生成详情</h4>
        {(() => {
          const gen = generations.find(g => g.id === selectedGenerationId);
          const selectedEdit = edits.find(e => e.id === selectedEditId);
          
          if (gen) {
            return (
              <div className="space-y-3">
                <div className="space-y-2 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">提示词：</span>
                    <p className="text-gray-300 mt-1">{gen.prompt}</p>
                  </div>
                  <div className="flex justify-between">
                    <span>模型：</span>
                    <span>{gen.modelVersion}</span>
                  </div>
                  {gen.parameters.seed && (
                    <div className="flex justify-between">
                      <span>种子值：</span>
                      <span>{gen.parameters.seed}</span>
                    </div>
                  )}
                </div>
                
                {/* Reference Images */}
                {gen.sourceAssets.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-400 mb-2">参考图像</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {gen.sourceAssets.map((asset, index) => (
                        <button
                          key={asset.id}
                          onClick={() => setPreviewModal({
                            open: true,
                            imageUrl: asset.url,
                            title: `参考图像 ${index + 1}`,
                            description: '此参考图像用于指导生成'
                          })}
                          className="relative aspect-square rounded border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden group"
                        >
                          <img
                            src={asset.url}
                            alt={`参考 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-1 left-1 bg-gray-900/80 text-xs px-1 py-0.5 rounded text-gray-300">
                            参考 {index + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          } else if (selectedEdit) {
            const parentGen = generations.find(g => g.id === selectedEdit.parentGenerationId);
            return (
              <div className="space-y-3">
                <div className="space-y-2 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400">编辑指令：</span>
                    <p className="text-gray-300 mt-1">{selectedEdit.instruction}</p>
                  </div>
                  <div className="flex justify-between">
                    <span>类型：</span>
                    <span>图像编辑</span>
                  </div>
                  <div className="flex justify-between">
                    <span>创建时间：</span>
                    <span>{new Date(selectedEdit.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {selectedEdit.maskAssetId && (
                    <div className="flex justify-between">
                      <span>蒙版：</span>
                      <span className="text-purple-400">已应用</span>
                    </div>
                  )}
                </div>
                
                {/* Parent Generation Reference */}
                {parentGen && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-400 mb-2">原始图像</h5>
                    <button
                      onClick={() => setPreviewModal({
                        open: true,
                        imageUrl: parentGen.outputAssets[0]?.url || '',
                        title: '原始图像',
                        description: '被编辑的基础图像'
                      })}
                      className="relative aspect-square w-16 rounded border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden group"
                    >
                      <img
                        src={parentGen.outputAssets[0]?.url}
                        alt="原始"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>
                )}
                
                {/* Mask Visualization */}
                {selectedEdit.maskReferenceAsset && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-400 mb-2">蒙版参考</h5>
                    <button
                      onClick={() => setPreviewModal({
                        open: true,
                        imageUrl: selectedEdit.maskReferenceAsset!.url,
                        title: '蒙版参考图像',
                        description: '这张带有蒙版覆盖的图像被发送给AI模型以指导编辑'
                      })}
                      className="relative aspect-square w-16 rounded border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden group"
                    >
                      <img
                        src={selectedEdit.maskReferenceAsset.url}
                        alt="蒙版参考"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ImageIcon className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-1 left-1 bg-purple-900/80 text-xs px-1 py-0.5 rounded text-purple-300">
                        蒙版
                      </div>
                    </button>
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div className="space-y-2 text-xs text-gray-500">
                <p className="text-gray-400">选择一个生成或编辑以查看详情</p>
              </div>
            );
          }
        })()}
      </div>

      {/* Actions */}
      <div className="space-y-3 flex-shrink-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => {
            // Find the currently displayed image (either generation or edit)
            let imageUrl: string | null = null;
            
            if (selectedGenerationId) {
              const gen = generations.find(g => g.id === selectedGenerationId);
              imageUrl = gen?.outputAssets[0]?.url || null;
            } else {
              // If no generation selected, try to get the current canvas image
              const { canvasImage } = useAppStore.getState();
              imageUrl = canvasImage;
            }
            
            if (imageUrl) {
              // Handle both data URLs and regular URLs
              if (imageUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `nano-banana-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                // For external URLs, we need to fetch and convert to blob
                fetch(imageUrl)
                  .then(response => response.blob())
                  .then(blob => {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `nano-banana-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  });
              }
            }
          }}
          disabled={!selectedGenerationId && !useAppStore.getState().canvasImage}
        >
          <Download className="h-4 w-4 mr-2" />
          下载
        </Button>
      </div>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={previewModal.open}
        onOpenChange={(open) => setPreviewModal(prev => ({ ...prev, open }))}
        imageUrl={previewModal.imageUrl}
        title={previewModal.title}
        description={previewModal.description}
      />
    </div>
  );
};