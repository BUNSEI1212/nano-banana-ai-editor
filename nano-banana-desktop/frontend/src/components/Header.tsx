import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { CreditsDisplay } from './CreditsDisplay';
import { SettingsModal } from './SettingsModal';
import { Button } from './ui/Button';

export const Header: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🍌</div>
            <h1 className="text-xl font-semibold text-gray-100 hidden md:block">
              Nano Banana AI 图像编辑器
            </h1>
            <h1 className="text-xl font-semibold text-gray-100 md:hidden">
              NB 编辑器
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <CreditsDisplay />
          <Button
            onClick={() => setIsSettingsOpen(true)}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-700"
            title="设置"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
