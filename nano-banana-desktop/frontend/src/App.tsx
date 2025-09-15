import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cn } from './utils/cn';
import { Header } from './components/Header';
import { PromptComposer } from './components/PromptComposer';
import { ImageCanvas } from './components/ImageCanvas';
import { HistoryPanel } from './components/HistoryPanel';
import { OAuthCallback } from './components/OAuthCallback';
import { SubscriptionPage } from './components/SubscriptionPage';
import { ErrorDialog } from './components/ErrorDialog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppStore } from './store/useAppStore';
import { electronService } from './services/electronService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

function AppContent() {
  useKeyboardShortcuts();

  const { showPromptPanel, setShowPromptPanel, showHistory, setShowHistory, showSubscriptionPage, setShowSubscriptionPage } = useAppStore();
  const [isElectron, setIsElectron] = React.useState(false);
  const [appInfo, setAppInfo] = React.useState<{ version: string; name: string; isActivated: boolean } | null>(null);

  // Check if this is the OAuth callback route
  const isCallbackRoute = window.location.pathname === '/oauth/callback';

  // Initialize Electron environment
  React.useEffect(() => {
    const initElectron = async () => {
      const electronEnv = electronService.isElectron();
      setIsElectron(electronEnv);

      if (electronEnv) {
        try {
          const info = await electronService.getAppInfo();
          setAppInfo(info);
        } catch (error) {
          console.error('Failed to get app info:', error);
        }
      }
    };

    initElectron();
  }, []);

  // Set mobile defaults on mount
  React.useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setShowPromptPanel(false);
        setShowHistory(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setShowPromptPanel, setShowHistory]);

  // Render OAuth callback component if on callback route
  if (isCallbackRoute) {
    return <OAuthCallback />;
  }

  return (
    <div className="h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <div className={cn("flex-shrink-0 transition-all duration-300", !showPromptPanel && "w-8")}>
          <PromptComposer />
        </div>
        <div className="flex-1 min-w-0">
          <ImageCanvas />
        </div>
        <div className="flex-shrink-0">
          <HistoryPanel />
        </div>
      </div>

      {/* Subscription Page Modal */}
      <SubscriptionPage
        isOpen={showSubscriptionPage}
        onClose={() => setShowSubscriptionPage(false)}
      />

      {/* Error Dialog */}
      <ErrorDialog />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
