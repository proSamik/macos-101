'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { CheckCircle, Crown, Zap, Star, Target, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingPlan {
  name: string;
  slug: string;
  price: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

const plans: PricingPlan[] = [
  {
    name: 'Pro',
    slug: 'pro',
    price: {
      monthly: 9,
      yearly: 99
    },
    description: 'Perfect for individuals and small teams',
    features: [
      'Unlimited todos',
      'Priority support',
      'Advanced analytics',
      'Task scheduling',
      'Export functionality'
    ],
    icon: Target,
    gradient: 'from-slate-600 to-slate-800'
  },
  {
    name: 'Plus',
    slug: 'plus',
    price: {
      monthly: 19,
      yearly: 199
    },
    description: 'Everything in Pro plus premium features',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom integrations',
      'Advanced security',
      'Priority customer success',
      'Custom branding'
    ],
    popular: true,
    icon: Crown,
    gradient: 'from-blue-600 to-purple-600'
  }
];

interface PricingProps {
  onPlanSelect?: (slug: string, isYearly: boolean) => void;
  currentPlan?: string;
  showCurrentBadge?: boolean;
}

export function Pricing({ onPlanSelect, currentPlan, showCurrentBadge = false }: PricingProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PricingPlan) => {
    try {
      setLoadingPlan(plan.slug);
      
      const slug = isYearly ? `yearly-${plan.slug}` : `monthly-${plan.slug}`;
      
      if (onPlanSelect) {
        onPlanSelect(slug, isYearly);
      } else {
        await authClient.checkout({
          slug,
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getSavingsPercent = (plan: PricingPlan) => {
    const monthlyTotal = plan.price.monthly * 12;
    const savings = ((monthlyTotal - plan.price.yearly) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Unlock the full potential of your productivity with our premium features
        </p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setIsYearly(false)}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all duration-200",
              !isYearly
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsYearly(true)}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all duration-200 relative",
              isYearly
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            )}
          >
            Yearly
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = isYearly ? plan.price.yearly : plan.price.monthly;
          const isCurrentPlan = currentPlan?.includes(plan.slug);
          const isLoading = loadingPlan === plan.slug;
          
          return (
            <Card
              key={plan.slug}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                plan.popular
                  ? "border-2 border-blue-500 shadow-lg"
                  : "border-slate-200 bg-white"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-b-lg font-semibold text-sm">
                    Most Popular
                  </div>
                </div>
              )}
              
              {showCurrentBadge && isCurrentPlan && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full font-semibold text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Current
                  </div>
                </div>
              )}

              <CardHeader className={cn(
                "text-center pb-8",
                plan.popular ? "pt-12" : "pt-8"
              )}>
                <div className={cn(
                  "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-r",
                  plan.gradient
                )}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-6">
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold text-slate-800">
                      ${price}
                    </span>
                    <span className="text-slate-600 ml-2">
                      / {isYearly ? 'year' : 'month'}
                    </span>
                  </div>
                  {isYearly && (
                    <div className="text-sm text-green-600 font-medium mt-2">
                      Save {getSavingsPercent(plan)}% annually
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading || (showCurrentBadge && isCurrentPlan)}
                  className={cn(
                    "w-full py-3 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      : "bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white",
                    showCurrentBadge && isCurrentPlan && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                      Processing...
                    </div>
                  ) : showCurrentBadge && isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Get Started
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ/Benefits */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-8">
          Why Choose Premium?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">
              Secure & Reliable
            </h4>
            <p className="text-slate-600">
              Enterprise-grade security with 99.9% uptime guarantee
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">
              Lightning Fast
            </h4>
            <p className="text-slate-600">
              Optimized performance with real-time sync across devices
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">
              Premium Support
            </h4>
            <p className="text-slate-600">
              Priority customer support with dedicated success team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;