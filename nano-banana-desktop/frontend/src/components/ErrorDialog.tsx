import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { X, AlertTriangle } from 'lucide-react';

export const ErrorDialog: React.FC = () => {
  const { showErrorDialog, errorMessage, hideError } = useAppStore();

  if (!showErrorDialog || !errorMessage) {
    return null;
  }

  const handleClose = () => {
    hideError();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              内容被阻止
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">
            {errorMessage}
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>建议：</strong>请尝试使用更中性的描述词汇，避免可能被认为敏感的内容。
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              例如：使用"红色短裤"而不是"内裤"，使用"战斗服装"而不是敏感词汇。
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
