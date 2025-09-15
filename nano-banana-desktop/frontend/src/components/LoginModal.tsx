import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { authService } from '../services/authService';
import { LogIn, User, CreditCard } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const handleLogin = () => {
    authService.login();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Sign In Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-300">
            <p className="mb-3">
              To use Nano Banana Editor, you need to sign in with your account.
            </p>
            
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-200">What you get:</h4>
              <ul className="text-xs space-y-1 text-gray-400">
                <li>• Secure AI image generation and editing</li>
                <li>• Usage tracking and quota management</li>
                <li>• Save and sync your projects</li>
                <li>• Access to premium features</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In with Casdoor
            </Button>
            
            <div className="text-xs text-center text-gray-400">
              <p>
                New user? You'll be able to create an account after clicking above.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Free tier available</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open(authService.getPricingUrl(), '_blank')}
                className="text-blue-400 hover:text-blue-300"
              >
                <CreditCard className="w-3 h-3 mr-1" />
                View Plans
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
