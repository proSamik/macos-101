'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession, signOut, authClient } from '@/lib/auth-client';
import { 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  Shield, 
  LogOut,
  Settings,
  Badge,
  CheckCircle,
  CreditCard,
  ExternalLink
} from 'lucide-react';

// Type definition for customer state
interface CustomerState {
  activeSubscriptions?: Array<{
    productId: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handlePortal = async () => {
    try {
      await authClient.customer.portal();
    } catch (error) {
      console.error('Portal error:', error);
    }
  };

  const fetchCustomerState = useCallback(async () => {
    try {
      if (session) {
        const { data } = await authClient.customer.state();
        setCustomerState(data);
      }
    } catch (error) {
      console.error('Error fetching customer state:', error);
    } finally {
      setLoading(false);
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

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const hasActiveSubscription = (customerState?.activeSubscriptions?.length ?? 0) > 0;
  const currentSubscription = customerState?.activeSubscriptions?.[0]; // Get the first active subscription
  
  // Get product name - we'll need to match productId with our known products
  const getProductName = (productId: string) => {
    const productMap: Record<string, string> = {
      [process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRO_PRODUCT_ID!]: 'Monthly Pro',
      [process.env.NEXT_PUBLIC_POLAR_MONTHLY_PLUS_PRODUCT_ID!]: 'Monthly Plus', 
      [process.env.NEXT_PUBLIC_POLAR_YEARLY_PRO_PRODUCT_ID!]: 'Yearly Pro',
      [process.env.NEXT_PUBLIC_POLAR_YEARLY_PLUS_PRODUCT_ID!]: 'Yearly Plus'
    };
    return productMap[productId] || 'Unknown Plan';
  };
  
  const planName = currentSubscription ? getProductName(currentSubscription.productId) : 'No subscription';
  
  console.log('Profile - Has Active Subscription:', hasActiveSubscription);
  console.log('Profile - Current Subscription:', currentSubscription);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Profile Settings</h1>
          <p className="text-slate-600 mt-2">
            Manage your account information and preferences
          </p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader className="text-center pb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-600 to-slate-800 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {session.user.name?.charAt(0) || 'U'}
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center">
              <Crown className="w-6 h-6 mr-2 text-yellow-500" />
              Premium Member
            </CardTitle>
            <CardDescription className="text-slate-600 text-lg">
              You have full access to all premium features
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 text-slate-500 mr-2" />
                    <span className="text-sm font-medium text-slate-600">Full Name</span>
                  </div>
                  <p className="text-slate-800 font-semibold">
                    {session.user.name || 'Not provided'}
                  </p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center mb-2">
                    <Mail className="w-4 h-4 text-slate-500 mr-2" />
                    <span className="text-sm font-medium text-slate-600">Email Address</span>
                  </div>
                  <p className="text-slate-800 font-semibold">
                    {session.user.email || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Account Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-green-700">Email Verified</span>
                  </div>
                  <p className="text-green-800 font-semibold">
                    {session.user.emailVerified ? 'Verified' : 'Not verified'}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Badge className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-blue-700">Account Type</span>
                  </div>
                  <p className="text-blue-800 font-semibold flex items-center">
                    <Crown className="w-4 h-4 mr-1 text-yellow-500" />
                    Premium
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Actions */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <Card className={`border-0 shadow-lg ${
            hasActiveSubscription 
              ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white" 
              : "bg-gradient-to-r from-slate-600 to-slate-800 text-white"
          }`}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                {hasActiveSubscription ? 'Premium Subscription' : 'Subscription'}
              </CardTitle>
              <CardDescription className={hasActiveSubscription ? "text-green-100" : "text-slate-200"}>
                {hasActiveSubscription ? 'Active subscription status' : 'No active subscription'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={hasActiveSubscription ? "text-green-100" : "text-slate-200"}>Status</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    hasActiveSubscription 
                      ? "bg-green-500 text-white" 
                      : "bg-red-500 text-white"
                  }`}>
                    {hasActiveSubscription ? 'Active' : 'No Subscription'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={hasActiveSubscription ? "text-green-100" : "text-slate-200"}>Plan</span>
                  <span className="text-white font-semibold">{planName}</span>
                </div>
                {hasActiveSubscription && currentSubscription && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-100">Renewal</span>
                    <span className="text-white font-semibold">
                      {currentSubscription.recurringInterval === 'month' ? 'Monthly' : 'Yearly'}
                    </span>
                  </div>
                )}
              </div>
              
              {hasActiveSubscription && (
                <Button
                  onClick={handlePortal}
                  variant="outline"
                  className="w-full mt-4 bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscription
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Features */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Premium Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-slate-700">Unlimited Tasks</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-slate-700">Advanced Analytics</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-slate-700">Priority Support</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-slate-700">Cloud Synchronization</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-slate-700">Custom Categories</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800">Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Privacy Settings
              </Button>
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:border-red-300 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Information */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account creation and session details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-600">User ID:</span>
              <p className="font-mono text-slate-800 break-all">{session.user.id}</p>
            </div>
            <div>
              <span className="text-slate-600">Account Created:</span>
              <p className="text-slate-800">
                {session.user.createdAt 
                  ? new Date(session.user.createdAt).toLocaleDateString() 
                  : 'Not available'
                }
              </p>
            </div>
            <div>
              <span className="text-slate-600">Last Updated:</span>
              <p className="text-slate-800">
                {session.user.updatedAt 
                  ? new Date(session.user.updatedAt).toLocaleDateString() 
                  : 'Not available'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}