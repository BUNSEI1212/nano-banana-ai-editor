import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ExternalLink, Lightbulb, Download } from 'lucide-react';
import { Button } from './ui/Button';

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-4xl z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-gray-100">
              关于 Nano Banana AI
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-gray-300">
              <p>
                开发者：{' '}
                <a
                  href="https://markfulton.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold"
                >
                  Mark Fulton
                  <ExternalLink className="h-3 w-3 inline ml-1" />
                </a>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-lg border border-purple-500/30">
                  <div className="flex items-center mb-3">
                    <Lightbulb className="h-5 w-5 text-purple-400 mr-2" />
                    <h4 className="text-sm font-semibold text-purple-300">
                      学习构建 AI 应用和更多解决方案
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    学习像这样的应用开发，掌握 AI 自动化，构建智能代理，创造推动真实业务成果的前沿解决方案。
                  </p>
                  <a
                    href="https://www.reinventing.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all duration-200 font-medium"
                  >
                    加入 AI 加速器项目
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center mb-3">
                    <Download className="h-5 w-5 text-yellow-400 mr-2" />
                    <h4 className="text-sm font-semibold text-yellow-300">
                      获取此应用副本
                    </h4>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    通过加入 Vibe Coding is Life Skool 社区获取此应用的副本。实时构建会话、应用项目、资源等，网络上最好的编程社区。
                  </p>
                  <a
                    href="https://www.skool.com/vibe-coding-is-life/about?ref=456537abaf37491cbcc6976f3c26af41"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg transition-all duration-200 font-medium"
                  >
                    加入 Vibe Coding is Life 社区
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};