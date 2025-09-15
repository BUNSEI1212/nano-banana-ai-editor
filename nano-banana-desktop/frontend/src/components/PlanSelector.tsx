import React from 'react';
import { Button } from './ui/Button';
import { Check, Star, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Plan } from '../services/subscriptionService';

interface PlanSelectorProps {
  plans: Plan[];
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  plans,
  currentPlan,
  onSelectPlan,
  loading = false
}) => {
  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return '免费';
    return `¥${price}`;
  };

  const formatInterval = (interval: string) => {
    switch (interval) {
      case 'month':
        return '/月';
      case 'one-time':
        return '一次性';
      default:
        return '';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlan === plan.id;
        const isFree = plan.price === 0;
        const isPopular = plan.popular;

        return (
          <div
            key={plan.id}
            className={cn(
              "relative rounded-xl border-2 p-6 transition-all duration-200",
              isCurrentPlan
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600",
              isPopular && !isCurrentPlan && "border-blue-500 bg-blue-500/10"
            )}
          >
            {/* Popular badge */}
            {isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  <Star className="w-3 h-3" />
                  推荐
                </div>
              </div>
            )}

            {/* Current plan badge */}
            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <div className="flex items-center gap-1 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                  <Check className="w-3 h-3" />
                  当前套餐
                </div>
              </div>
            )}

            <div className="text-center">
              {/* Plan name */}
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-100">
                  {formatPrice(plan.price, plan.currency)}
                </span>
                <span className="text-gray-400 ml-1">
                  {formatInterval(plan.interval)}
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-6 min-h-[2.5rem]">
                {plan.description}
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">生成次数</span>
                  <span className="text-gray-100 font-medium flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    {plan.features.monthlyCredits}次
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">并发数</span>
                  <span className="text-gray-100 font-medium">
                    {plan.features.maxConcurrency}个
                  </span>
                </div>
              </div>

              {/* Action button */}
              <Button
                onClick={() => onSelectPlan(plan.id)}
                disabled={loading || isCurrentPlan}
                variant={isCurrentPlan ? "secondary" : isPopular ? "default" : "outline"}
                className="w-full"
              >
                {loading ? (
                  "处理中..."
                ) : isCurrentPlan ? (
                  "当前套餐"
                ) : isFree ? (
                  "免费使用"
                ) : (
                  "立即购买"
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
