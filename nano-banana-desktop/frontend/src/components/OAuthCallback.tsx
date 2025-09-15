import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter');
        }

        setMessage('Exchanging authorization code...');
        const success = await authService.handleCallback(code, state);

        if (success) {
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          throw new Error('Failed to complete login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Login failed');
        
        // Redirect to home page after error display
        setTimeout(() => {
          window.location.href = '/';
        }, 5000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Signing you in...
              </h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Welcome back!
              </h2>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Sign in failed
              </h2>
            </>
          )}
          
          <p className="text-gray-400 text-sm">
            {message}
          </p>
          
          {status === 'error' && (
            <p className="text-gray-500 text-xs mt-4">
              You will be redirected to the home page shortly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
