'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';

function ConsentContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthParams, setOauthParams] = useState<{
    client_id: string;
    redirect_uri: string;
    state: string;
    response_type: string;
    scope: string;
    code_challenge_method: string;
    code_challenge: string;
    timestamp: number;
  } | null>(null);
  const searchParams = useSearchParams();

  // Get parameters from URL - these might be null after OAuth redirect
  const client_id = searchParams.get('client_id');
  const scope = searchParams.get('scope');
  const consent_code = searchParams.get('consent_code');
  
  // These parameters are often lost during OAuth flow
  const redirect_uri = searchParams.get('redirect_uri');

  // Retrieve stored OAuth parameters
  useEffect(() => {
    // Retrieve stored OAuth parameters from localStorage
    try {
      const storedParams = localStorage.getItem('oauth_params');
      if (storedParams) {
        const params = JSON.parse(storedParams);
        
        // Check if parameters are not expired (5 minutes)
        const isExpired = Date.now() - params.timestamp > 5 * 60 * 1000;
        
        if (!isExpired && params.client_id === client_id) {
          setOauthParams(params);
        } else {
          // Clean up expired parameters
          localStorage.removeItem('oauth_params');
        }
      }
    } catch (e) {
      console.error('Error parsing stored OAuth params:', e);
      try {
        localStorage.removeItem('oauth_params');
      } catch {
        // Silent fail if localStorage is not available
      }
    }
  }, [client_id]);

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
      // If we have a consent_code, use the consent endpoint with just that
      if (consent_code) {
        console.log('Submitting consent:', { consent_code, accept: granted, client_id, scope });
        
        // Try JSON approach with boolean accept value
        const response = await fetch(`/api/auth/oauth2/consent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accept: granted, // boolean, not string
            consent_code: consent_code
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Consent successful, response data:', data);
          
          // Clean up stored parameters after successful consent
          try {
            localStorage.removeItem('oauth_params');
          } catch {
            // Silent fail
          }
          
          if (data.redirect_uri || data.redirectURI) {
            const redirectUrl = data.redirect_uri || data.redirectURI;
            console.log('Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
          } else {
            // Build the redirect URL manually with authorization code and state
            const redirectUri = oauthParams?.redirect_uri || 'subclipstarter://auth/callback';
            const state = oauthParams?.state;
            
            // The authorization code should be in the response data
            const authCode = data.code || data.authorization_code;
            
            if (authCode && state) {
              const redirectUrl = `${redirectUri}?code=${authCode}&state=${state}`;
              console.log('Building redirect URL manually:', redirectUrl);
              window.location.href = redirectUrl;
            } else if (redirectUri) {
              // Fallback to stored redirect_uri without parameters (might fail)
              console.log('Using stored redirect_uri without auth params:', redirectUri);
              window.location.href = redirectUri;
            } else {
              console.log('No redirect_uri found, going to root');
              window.location.href = '/';
            }
          }
        } else {
          const responseText = await response.text();
          console.error('Consent API raw response:', responseText, 'Status:', response.status);
          
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText || 'Unknown error' };
          }
          
          console.error('Consent API error:', errorData, 'Status:', response.status);
          
          // Try fallback without consent_code (cookie-based approach)
          console.log('Trying cookie-based consent approach...');
          
          const fallbackResponse = await fetch(`/api/auth/oauth2/consent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accept: granted // only accept parameter
            }),
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log('Fallback consent successful, response data:', fallbackData);
            
            // Clean up stored parameters after successful consent
            try {
              localStorage.removeItem('oauth_params');
            } catch {
              // Silent fail
            }
            
            if (fallbackData.redirect_uri || fallbackData.redirectURI) {
              const redirectUrl = fallbackData.redirect_uri || fallbackData.redirectURI;
              console.log('Fallback redirecting to:', redirectUrl);
              window.location.href = redirectUrl;
            } else {
              // Build the redirect URL manually with authorization code and state
              const redirectUri = oauthParams?.redirect_uri || 'subclipstarter://auth/callback';
              const state = oauthParams?.state;
              
              // The authorization code should be in the response data
              const authCode = fallbackData.code || fallbackData.authorization_code;
              
              if (authCode && state) {
                const redirectUrl = `${redirectUri}?code=${authCode}&state=${state}`;
                console.log('Fallback building redirect URL manually:', redirectUrl);
                window.location.href = redirectUrl;
              } else if (redirectUri) {
                console.log('Fallback using stored redirect_uri without auth params:', redirectUri);
                window.location.href = redirectUri;
              } else {
                console.log('Fallback no redirect_uri found, going to root');
                window.location.href = '/';
              }
            }
            return; // Exit early on success
          }
          
          setError(errorData.error_description || errorData.error || `HTTP ${response.status}: An error occurred`);
        }
      } else if (oauthParams) {
        // Fallback to full OAuth flow with stored parameters
        const params = new URLSearchParams();
        
        params.append('client_id', oauthParams.client_id);
        params.append('scope', scope || oauthParams.scope);
        params.append('redirect_uri', oauthParams.redirect_uri);
        params.append('state', oauthParams.state);
        params.append('response_type', oauthParams.response_type);
        params.append('accept', granted ? 'true' : 'false');

        const response = await fetch(`/api/auth/oauth2/consent?${params.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Clean up stored parameters
          try {
            localStorage.removeItem('oauth_params');
          } catch {
            // Silent fail
          }
          
          if (data.redirect_uri) {
            window.location.href = data.redirect_uri;
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Consent API error (fallback):', errorData, 'Status:', response.status);
          setError(errorData.error_description || errorData.error || `HTTP ${response.status}: An error occurred`);
        }
      } else {
        setError('Missing OAuth parameters. Please try signing in again.');
      }
    } catch (err) {
      setError('Failed to process consent');
      console.error('Consent error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!client_id && !consent_code) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Request</CardTitle>
            <CardDescription>Missing required parameters (client_id or consent_code)</CardDescription>
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
            {(redirect_uri || oauthParams?.redirect_uri) && (
              <p className="text-sm text-gray-600">
                Redirect URI: {redirect_uri || oauthParams?.redirect_uri}
              </p>
            )}
            {consent_code && (
              <p className="text-sm text-gray-600">Consent Code: {consent_code}</p>
            )}
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

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Please wait while we load the consent form</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConsentContent />
    </Suspense>
  );
}
