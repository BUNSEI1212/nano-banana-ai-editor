import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { PlanSelector } from './PlanSelector';
import { PaymentMethodDialog } from './PaymentMethodDialog';
import { X, CreditCard, User, Calendar, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { subscriptionService, type Plan, type Subscription } from '../services/subscriptionService';
import { authService, type User as AuthUser } from '../services/authService';

interface SubscriptionPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({
  isOpen,
  onClose
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Payment method dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const [plansData, subscriptionData, userData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription(),
        authService.fetchUserInfo()
      ]);

      setPlans(plansData.plans);
      setSubscription(subscriptionData);
      setUser(userData);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      let errorMessage = '加载数据失败';

      if (err instanceof Error) {
        if (err.message.includes('认证失败')) {
          errorMessage = '登录已过期，请重新登录';
        } else if (err.message.includes('网络连接失败')) {
          errorMessage = '网络连接失败，请检查网络连接后重试';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) return;

    // If it's the free plan, no payment needed
    if (planId === 'free') {
      return;
    }

    // Find the selected plan
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // For development/testing: directly activate subscription
    if (import.meta.env.DEV) {
      try {
        setPurchasing(true);
        setError(null);

        const result = await subscriptionService.activateSubscription(planId);
        if (result.success) {
          // Reload data to show updated subscription
          await loadData();
          setError(null);
          setSuccess(`成功激活 ${plan.name} 套餐！`);

          // Auto-hide success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError('激活订阅失败');
        }
      } catch (err) {
        console.error('Failed to activate subscription:', err);
        setError('激活订阅失败');
      } finally {
        setPurchasing(false);
      }
    } else {
      // For production: show payment method selection dialog
      setSelectedPlan(plan);
      setShowPaymentDialog(true);
    }

  };

  const handlePaymentMethodSelect = async (paymentMethod: 'alipay') => {
    if (!selectedPlan) return;

    try {
      setPurchasing(true);
      setError(null);
      setShowPaymentDialog(false);

      // Create payment with Alipay
      const result = await subscriptionService.createPaymentWithAlipay(selectedPlan.id);

      if (result.paymentUrl) {
        // Open payment page in new tab
        window.open(result.paymentUrl, '_blank');
        setSuccess('已跳转到支付宝支付页面，请完成支付后刷新页面查看订阅状态。');

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError('创建支付订单失败');
      }

    } catch (err) {
      console.error('Failed to create payment:', err);
      let errorMessage = '支付失败';

      if (err instanceof Error) {
        if (err.message.includes('认证失败')) {
          errorMessage = '登录已过期，请重新登录';
        } else if (err.message.includes('网络连接失败')) {
          errorMessage = '网络连接失败，请检查网络连接后重试';
        } else if (err.message.includes('服务器错误')) {
          errorMessage = '服务器暂时不可用，请稍后重试';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setPurchasing(false);
      setSelectedPlan(null);
    }
  };

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedPlan(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '无限期';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-gray-100">订阅管理</h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                <div className="text-gray-400">加载中...</div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
                  <p className="text-red-400">{error}</p>
                  <Button
                    onClick={loadData}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    重试
                  </Button>
                </div>
              )}

              {success && (
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
                  <p className="text-green-400">{success}</p>
                </div>
              )}
              {/* Current subscription info */}
              {user && (
                <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    当前订阅状态
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-100 font-medium">{user.email}</p>
                        <p className="text-gray-400 text-sm capitalize">{user.plan} Plan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-gray-100 font-medium">剩余额度</p>
                        <p className="text-gray-400 text-sm">{user.usage.creditsRemaining} 次</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-gray-100 font-medium">订阅状态</p>
                        <p className="text-gray-400 text-sm">
                          {subscription?.status === 'active' ? '有效' : '无效'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan selector */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-6">选择套餐</h3>
                <PlanSelector
                  plans={plans}
                  currentPlan={user?.plan}
                  onSelectPlan={handleSelectPlan}
                  loading={purchasing}
                />
              </div>

              {/* Help text */}
              <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <p className="text-blue-300 text-sm">
                  💡 <strong>提示：</strong>
                  {import.meta.env.DEV ? (
                    '开发环境下，点击"立即购买"将直接激活订阅用于测试。'
                  ) : (
                    '点击"立即购买"将跳转到安全的支付页面。支付完成后，您的额度将自动更新。'
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Method Dialog */}
      <PaymentMethodDialog
        isOpen={showPaymentDialog}
        onClose={handleClosePaymentDialog}
        onSelectMethod={handlePaymentMethodSelect}
        planName={selectedPlan?.name || ''}
        planPrice={selectedPlan ? `¥${selectedPlan.price}` : ''}
        loading={purchasing}
      />
    </div>
  );
};
