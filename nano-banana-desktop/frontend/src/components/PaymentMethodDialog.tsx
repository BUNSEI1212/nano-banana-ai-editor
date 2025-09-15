import React, { useState } from 'react';
import { X, Smartphone, CreditCard } from 'lucide-react';

interface PaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'alipay') => void;
  planName: string;
  planPrice: string;
  loading?: boolean;
}

export const PaymentMethodDialog: React.FC<PaymentMethodDialogProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
  planName,
  planPrice,
  loading = false
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectMethod('alipay');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            选择支付方式
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">{planName}</span>
            <span className="text-lg font-bold text-blue-600">{planPrice}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <div className="flex items-center p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
            <div className="flex items-center flex-1">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">支付宝</div>
                <div className="text-sm text-gray-500">安全便捷的在线支付</div>
              </div>
            </div>
            <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : '确认支付'}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            🔒 您的支付信息将通过安全加密传输，我们不会存储您的支付信息。
          </p>
        </div>
      </div>
    </div>
  );
};
