'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, authClient, signOut } from '@/lib/auth-client';
import { Sidebar } from '@/components/ui/sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pricing } from '@/components/ui/pricing';
import { LogOut } from 'lucide-react';

// Type definition for customer state
interface CustomerState {
  activeSubscriptions?: Array<{
    productId: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/sign-in';
        },
      },
    });
  };

  const fetchCustomerState = useCallback(async () => {
    try {
      if (session) {
        const { data } = await authClient.customer.state();
        console.log('Fetched Customer State:', data);
        console.log('Active Subscriptions Count:', data?.activeSubscriptions?.length || 0);
        setCustomerState(data);
      }
    } catch (error) {
      console.error('Error fetching customer state:', error);
      // Set empty customer state to avoid indefinite loading
      setCustomerState({});
    } finally {
      setLoadingSubscription(false);
    }
  }, [session]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchCustomerState();
    }
  }, [session, fetchCustomerState]);

  if (isPending || loadingSubscription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Check for active subscriptions using Polar's activeSubscriptions array
  const hasActiveSubscription = (customerState?.activeSubscriptions?.length ?? 0) > 0;
  
  console.log('=== SUBSCRIPTION CHECK ===');
  console.log('Loading Subscription:', loadingSubscription);
  console.log('Customer State exists:', !!customerState);
  console.log('Has Active Subscription:', hasActiveSubscription);
  console.log('Active Subscriptions:', customerState?.activeSubscriptions);
  console.log('========================');

  // Only show pricing modal if we have finished loading AND have customer state AND no active subscriptions
  const shouldShowPricingModal = !loadingSubscription && customerState !== null && !hasActiveSubscription;

  if (shouldShowPricingModal) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {/* Blurred content */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <Dialog open={true}>
                <DialogContent className="max-w-5xl bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-bold text-slate-800 mb-2 text-center">
                      Premium Access Required
                    </DialogTitle>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSignOut}
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </DialogHeader>
                  <div className="text-center mb-6">
                    <p className="text-slate-600">
                      Upgrade to Premium to access advanced todo management features
                    </p>
                    {session && (
                      <p className="text-sm text-slate-500 mt-2">
                        Signed in as {session.user.name} ({session.user.email})
                      </p>
                    )}
                  </div>
                  <Pricing />
                </DialogContent>
              </Dialog>
            </div>
            <div className="blur-sm pointer-events-none">
              {children}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}