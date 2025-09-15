import React, { useState, useEffect } from 'react';
import { X, Settings, CreditCard, History, Plus, Key } from 'lucide-react';
import { Button } from './ui/Button';
import { electronService } from '../services/electronService';
import { ApiKeyManager } from './ApiKeyManager';

interface ActivationRecord {
  code: string;
  planType: string;
  credits: number;
  activatedAt: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activate' | 'history'>('overview');
  const [credits, setCredits] = useState(0);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [activationCode, setActivationCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationHistory, setActivationHistory] = useState<ActivationRecord[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [creditsData, appData, historyData] = await Promise.all([
        electronService.getRemainingCredits(),
        electronService.getAppInfo(),
        electronService.getActivationHistory()
      ]);
      
      setCredits(creditsData);
      setAppInfo(appData);
      setActivationHistory(historyData || []);
    } catch (error) {
      console.error('Failed to load settings data:', error);
    }
  };

  const handleActivate = async () => {
    if (!activationCode.trim()) {
      setMessage({ type: 'error', text: '请输入激活码' });
      return;
    }

    if (!/^NB-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(activationCode)) {
      setMessage({ type: 'error', text: '激活码格式错误，请检查输入' });
      return;
    }

    setIsActivating(true);
    setMessage(null);

    try {
      const result = await electronService.activateCode(activationCode);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `激活成功！获得 ${result.data.credits} 次额度` 
        });
        setActivationCode('');
        await loadData(); // Reload data
      } else {
        setMessage({ type: 'error', text: result.error || '激活失败，请检查激活码' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '激活过程中发生错误，请重试' });
      console.error('Activation error:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getPlanTypeDisplay = (planType: string) => {
    const plans = {
      'trial': '🍌 尝鲜套餐',
      'basic': '💎 基础套餐', 
      'premium': '🚀 高阶套餐'
    };
    return plans[planType as keyof typeof plans] || planType;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">应用设置</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            概览
          </button>
          <button
            onClick={() => setActiveTab('activate')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'activate'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            激活码
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            历史记录
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Credits Display */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">当前额度</h3>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  ✨ {credits} 次
                </div>
                <p className="text-gray-400 text-sm mt-1">剩余图像生成次数</p>
              </div>

              {/* App Info */}
              {appInfo && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">应用信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">版本：</span>
                      <span className="text-white">{appInfo.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">激活状态：</span>
                      <span className={appInfo.isActivated ? 'text-green-400' : 'text-red-400'}>
                        {appInfo.isActivated ? '已激活' : '未激活'}
                      </span>
                    </div>
                    {appInfo.currentPlan && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">当前套餐：</span>
                        <span className="text-white">{getPlanTypeDisplay(appInfo.currentPlan)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activate' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">激活新套餐</h3>
                <p className="text-gray-400 text-sm mb-4">
                  输入新购买的激活码来增加额度。如果当前还有剩余额度，新额度将累加到现有额度上。
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    激活码
                  </label>
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                    placeholder="NB-XXXX-XXXX-XXXX"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    maxLength={17}
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded-md text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-900 text-green-300 border border-green-700' 
                      : 'bg-red-900 text-red-300 border border-red-700'
                  }`}>
                    {message.text}
                  </div>
                )}

                <Button
                  onClick={handleActivate}
                  disabled={isActivating || !activationCode.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isActivating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      激活中...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      激活套餐
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-white">激活历史</h3>
              </div>

              {activationHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无激活记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activationHistory.map((record, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">
                          {getPlanTypeDisplay(record.planType)}
                        </span>
                        <span className="text-green-400 font-medium">
                          +{record.credits} 次
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        <div>激活码: {record.code}</div>
                        <div>激活时间: {formatDate(record.activatedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
