'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';

export default function ConsentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const client_id = searchParams.get('client_id');
  const scope = searchParams.get('scope');
  const redirect_uri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const response_type = searchParams.get('response_type');

  const scopes = scope?.split(' ') || [];
  const scopeDescriptions: Record<string, string> = {
    openid: 'Access your basic profile information',
    profile: 'Access your profile details (name, picture)',
    email: 'Access your email address',
  };

  const handleConsent = async (granted: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        client_id: client_id || '',
        scope: scope || '',
        redirect_uri: redirect_uri || '',
        state: state || '',
        response_type: response_type || '',
        consent: granted ? 'allow' : 'deny',
      });

      const response = await fetch(`/api/auth/oauth2/consent?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.redirect_uri) {
          window.location.href = data.redirect_uri;
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error_description || 'An error occurred');
      }
    } catch (err) {
      setError('Failed to process consent');
      console.error('Consent error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!client_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Request</CardTitle>
            <CardDescription>Missing required parameters</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authorize Application</CardTitle>
          <CardDescription>
            An application is requesting access to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Application Details:</h3>
            <p className="text-sm text-gray-600">Client ID: {client_id}</p>
            <p className="text-sm text-gray-600">Redirect URI: {redirect_uri}</p>
          </div>

          {scopes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Requested Permissions:</h3>
              <ul className="space-y-1">
                {scopes.map((scopeItem) => (
                  <li key={scopeItem} className="text-sm">
                    <strong>{scopeItem}:</strong>{' '}
                    {scopeDescriptions[scopeItem] || 'Access to this scope'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={() => handleConsent(false)}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              Deny
            </Button>
            <Button
              onClick={() => handleConsent(true)}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Allow'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}