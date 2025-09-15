import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { authService, User } from '../services/authService';
import { LoginModal } from './LoginModal';
import { useAppStore } from '../store/useAppStore';
import {
  User as UserIcon,
  LogOut,
  CreditCard,
  Settings,
  ChevronDown,
  Zap
} from 'lucide-react';

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setShowSubscriptionPage } = useAppStore();

  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        const userData = await authService.fetchUserInfo();
        setUser(userData);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsMenuOpen(false);
  };

  const openSubscriptionPage = () => {
    setShowSubscriptionPage(true);
    setIsMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Button 
          onClick={handleLogin}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <UserIcon className="w-4 h-4 mr-2" />
          Sign In
        </Button>
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
        />
      </>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 text-gray-300 hover:bg-gray-700"
      >
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:inline text-sm">{user.email}</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {user.plan} Plan
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              {/* Usage Info */}
              <div className="px-3 py-2 mb-2 bg-gray-900 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Credits Remaining</span>
                  <span className="text-xs font-medium text-green-400">
                    {user.usage.creditsRemaining}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, (user.usage.creditsRemaining / (user.usage.creditsRemaining + user.usage.genCount + user.usage.editCount)) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Generated: {user.usage.genCount}</span>
                  <span>Edited: {user.usage.editCount}</span>
                </div>
              </div>

              {/* Menu Items */}
              <button
                onClick={openSubscriptionPage}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
              >
                <Zap className="w-4 h-4" />
                升级套餐
              </button>

              <button
                onClick={openSubscriptionPage}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
              >
                <CreditCard className="w-4 h-4" />
                订阅管理
              </button>

              <button
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded"
                disabled
              >
                <Settings className="w-4 h-4" />
                Settings
                <span className="ml-auto text-xs text-gray-500">Soon</span>
              </button>

              <div className="border-t border-gray-700 my-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
