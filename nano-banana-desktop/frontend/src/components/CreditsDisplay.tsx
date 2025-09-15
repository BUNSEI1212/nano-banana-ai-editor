import React from 'react';
import { electronService } from '../services/electronService';

interface CreditsDisplayProps {
  className?: string;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ className = '' }) => {
  const [credits, setCredits] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCredits = React.useCallback(async () => {
    if (!electronService.isElectron()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const remainingCredits = await electronService.getRemainingCredits();
      setCredits(remainingCredits);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setError('获取额度失败');
      setCredits(0);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCredits();
    
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCredits]);

  // Listen for credit updates from other parts of the app
  React.useEffect(() => {
    const handleCreditsUpdate = (event: CustomEvent<{ credits: number }>) => {
      setCredits(event.detail.credits);
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate as EventListener);
    };
  }, []);

  if (!electronService.isElectron()) {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-400">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
        <span className="text-sm text-red-400">{error}</span>
      </div>
    );
  }

  const getCreditsColor = (credits: number) => {
    if (credits === 0) return 'text-red-400';
    if (credits <= 5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getCreditsIcon = (credits: number) => {
    if (credits === 0) return '⚠️';
    if (credits <= 5) return '⚡';
    return '✨';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{getCreditsIcon(credits || 0)}</span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getCreditsColor(credits || 0)}`}>
          {credits} 次
        </span>
        <span className="text-xs text-gray-500">剩余额度</span>
      </div>
    </div>
  );
};

// Helper function to dispatch credits update event
export const updateCreditsDisplay = (credits: number) => {
  const event = new CustomEvent('creditsUpdated', { detail: { credits } });
  window.dispatchEvent(event);
};
