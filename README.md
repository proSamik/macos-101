# OIDC Authentication Integration - Code Changes

This document outlines the code changes made to integrate OIDC (OpenID Connect) authentication into the Electron application and Next.js YouTube Todo App, including fixes for OAuth parameter persistence during the authentication flow.

## Files Modified

### 1. App.tsx (`src/renderer/App.tsx`)

**Purpose**: Added authentication UI and state management to the main React component.

**Key Changes**:

```tsx
// Added authentication state management
const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
const [userInfo, setUserInfo] = useState<any>(null);
const [authLoading, setAuthLoading] = useState<boolean>(false);
const [authError, setAuthError] = useState<string>('');

// Setup OIDC authentication event listeners
useEffect(() => {
    const handleAuthSuccess = async (tokens: TokenResponse) => {
        setAuthLoading(false);
        setAuthError('');
        localStorage.setItem('oidc_tokens', JSON.stringify(tokens));
        setIsAuthenticated(true);
        
        // Fetch user info from the OIDC provider
        try {
            const response = await fetch('http://localhost:3000/api/auth/oauth2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`
                }
            });
            
            if (response.ok) {
                const userData = await response.json();
                setUserInfo(userData);
            }
        } catch (error) {
            // Error handling
        }
    };

    // Check for existing tokens on app start
    const storedTokens = localStorage.getItem('oidc_tokens');
    if (storedTokens) {
        try {
            const tokens = JSON.parse(storedTokens);
            handleAuthSuccess(tokens);
        } catch (error) {
            localStorage.removeItem('oidc_tokens');
        }
    }

    // Set up event listeners
    window.electronAPI.onAuthSuccess(handleAuthSuccess);
    window.electronAPI.onAuthError(handleAuthError);
}, []);
```

**What it does**:
- Manages authentication state (logged in/out, user info, loading states)
- Handles authentication success/error events from the main process
- Persists tokens in localStorage for session management
- Fetches user profile information after successful authentication
- Provides login/logout UI in the header

---

### 2. Sign-in Page (`nextjs-web/app/sign-in/page.tsx`)

**Purpose**: Added localStorage-based OAuth parameter persistence to handle parameter loss during Google OAuth redirects.

**Key Changes**:

```tsx
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();

  // Store OAuth parameters before Google OAuth
  useEffect(() => {
    // Store OAuth parameters in localStorage before Google OAuth flow
    const oauthParams = {
      response_type: searchParams.get('response_type'),
      client_id: searchParams.get('client_id'),
      redirect_uri: searchParams.get('redirect_uri'),
      scope: searchParams.get('scope'),
      code_challenge_method: searchParams.get('code_challenge_method'),
      code_challenge: searchParams.get('code_challenge'),
      state: searchParams.get('state'),
      timestamp: Date.now() // For expiration
    };

    // Only store if we have the main OAuth parameters
    if (oauthParams.client_id && oauthParams.redirect_uri && oauthParams.state) {
      localStorage.setItem('oauth_params', JSON.stringify(oauthParams));
      
      // Set expiration for 5 minutes
      setTimeout(() => {
        try {
          localStorage.removeItem('oauth_params');
        } catch (e) {
          // Silent fail if localStorage is not available
        }
      }, 5 * 60 * 1000);
    }
  }, [searchParams]);

  // ... rest of component
}
```

**What it does**:
- Captures OAuth parameters from the URL when the sign-in page loads
- Stores them in localStorage with a 5-minute expiration timer
- Ensures parameters survive the Google OAuth redirect process
- Automatically cleans up expired parameters for security

---

### 3. Consent Page (`nextjs-web/app/consent/page.tsx`)

**Purpose**: Enhanced consent handling with localStorage parameter recovery and proper better-auth API integration.

**Key Changes**:

```tsx
function ConsentContent() {
  const [oauthParams, setOauthParams] = useState<any>(null);
  const searchParams = useSearchParams();

  // Retrieve stored OAuth parameters
  useEffect(() => {
    try {
      const storedParams = localStorage.getItem('oauth_params');
      if (storedParams) {
        const params = JSON.parse(storedParams);
        
        // Check if parameters are not expired (5 minutes)
        const isExpired = Date.now() - params.timestamp > 5 * 60 * 1000;
        
        if (!isExpired && params.client_id === client_id) {
          setOauthParams(params);
        } else {
          localStorage.removeItem('oauth_params');
        }
      }
    } catch (e) {
      console.error('Error parsing stored OAuth params:', e);
      localStorage.removeItem('oauth_params');
    }
  }, [client_id]);

  const handleConsent = async (granted: boolean) => {
    try {
      if (consent_code) {
        // Use correct better-auth API format
        const response = await fetch(`/api/auth/oauth2/consent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accept: granted, // boolean, not string
            consent_code: consent_code
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Clean up stored parameters
          localStorage.removeItem('oauth_params');
          
          // Handle proper redirect with redirectURI (camelCase)
          if (data.redirect_uri || data.redirectURI) {
            const redirectUrl = data.redirect_uri || data.redirectURI;
            window.location.href = redirectUrl; // Contains code & state
          }
        }
      }
    } catch (error) {
      // Error handling with detailed logging
    }
  };
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConsentContent />
    </Suspense>
  );
}
```

**What it does**:
- Retrieves stored OAuth parameters from localStorage after Google OAuth redirect
- Validates parameter expiration and client_id matching for security
- Uses correct better-auth API format (`accept: boolean`, not `consent: string`)
- Handles both `redirect_uri` and `redirectURI` response formats from better-auth
- Automatically includes authorization code and state in the redirect URL
- Cleans up localStorage after successful consent
- Provides Suspense boundary for proper SSR handling

---

### 4. auth.ts (`nextjs-web/lib/auth.ts`)

**Purpose**: Enabled OIDC provider functionality in the Better Auth configuration.

**Key Changes**:

```typescript
import { mcp, oidcProvider } from "better-auth/plugins";

export const auth = betterAuth({
  // ... existing configuration
  plugins: [
    // ... existing plugins
    mcp({
      loginPage: "/sign-in" 
    }),
    oidcProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      allowDynamicClientRegistration: true
    })
  ]
});
```

**What it does**:
- Adds the `oidcProvider` plugin to Better Auth
- Configures the login page route for OIDC flows
- Sets up the consent page for OAuth2 authorization
- Enables dynamic client registration for OIDC clients (like the Electron app)

---

### 5. main.ts (`src/main/main.ts`)

**Purpose**: Implemented complete OIDC authentication flow in the Electron main process.

**Key Changes**:

```typescript
// OIDC Configuration
const SERVER_URL = "http://localhost:3000";
const REDIRECT_URI = "subclipstarter://auth/callback";
const protocolName = "subclipstarter";

// Protocol registration and single instance handling
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.removeAsDefaultProtocolClient(protocolName);
  
  setTimeout(() => {
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(protocolName, process.execPath, [path.resolve(process.argv[1])]);
      }
    } else {
      app.setAsDefaultProtocolClient(protocolName);
    }
  }, 100);
}

// Handle protocol callbacks
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleAuthCallback(url);
});

// OIDC Authentication IPC handlers
ipcMain.handle('start-oidc-auth', async () => {
  try {
    const crypto = await import('crypto');
    
    // PKCE (Proof Key for Code Exchange) implementation
    const codeVerifier = base64URLEncode(crypto.randomBytes(32));
    const codeChallenge = base64URLEncode(crypto.createHash('sha256').update(codeVerifier).digest());
    
    // Dynamic client registration
    const registrationResponse = await fetch(`${SERVER_URL}/api/auth/oauth2/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "SubclipStarter Electron App",
        redirect_uris: [REDIRECT_URI],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        application_type: "native",
        client_type: "public"
      })
    });
    
    const clientData = await registrationResponse.json();
    
    // Build authorization URL
    const authUrl = new URL(`${SERVER_URL}/api/auth/oauth2/authorize`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientData.client_id);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", "openid profile email");
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("code_challenge", codeChallenge);
    
    await shell.openExternal(authUrl.toString());
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});
```

**What it does**:
- Registers custom protocol (`subclipstarter://`) for OAuth2 redirects
- Implements PKCE (Proof Key for Code Exchange) for secure authorization
- Performs dynamic client registration with the OIDC provider
- Opens system browser for user authentication
- Handles authorization callbacks and exchanges authorization codes for tokens
- Sends authentication results to the renderer process

---

### 6. preload.ts (`src/preload/preload.ts`)

**Purpose**: Exposed OIDC authentication APIs to the renderer process.

**Key Changes**:

```typescript
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
}

export interface ElectronAPI {
  // ... existing methods
  // OIDC Authentication methods
  startOidcAuth: () => Promise<{ success: boolean; error?: string }>;
  onAuthSuccess: (callback: (data: TokenResponse) => void) => void;
  onAuthError: (callback: (error: string) => void) => void;
}

const electronAPI: ElectronAPI = {
  // ... existing implementations
  // OIDC Authentication implementations
  startOidcAuth: () => ipcRenderer.invoke('start-oidc-auth'),
  onAuthSuccess: (callback: (data: TokenResponse) => void) => {
    ipcRenderer.on('auth-success', (_, data) => callback(data));
  },
  onAuthError: (callback: (error: string) => void) => {
    ipcRenderer.on('auth-error', (_, error) => callback(error));
  },
};
```

**What it does**:
- Defines TypeScript interfaces for token responses
- Exposes OIDC authentication methods to the renderer process
- Provides event listeners for authentication success/error events
- Acts as a secure bridge between main and renderer processes

## OAuth Parameter Persistence Solution

A critical issue in the OAuth2 flow was the loss of authorization parameters during Google OAuth redirects. The solution implements a localStorage-based persistence mechanism:

### The Problem
When users clicked "Continue with Google" on the sign-in page, the OAuth2 parameters (`client_id`, `redirect_uri`, `state`, etc.) were lost during the Google OAuth redirect, causing the consent page to fail with "Invalid authorization response".

### The Solution
1. **Parameter Capture**: The sign-in page captures all OAuth parameters from the URL and stores them in localStorage before initiating Google OAuth
2. **Parameter Recovery**: The consent page retrieves the stored parameters after the Google OAuth redirect
3. **Security**: Parameters are stored with a 5-minute expiration timer and validated against the current client_id
4. **API Compatibility**: Updated to use the correct better-auth API format (`accept: boolean` instead of `consent: string`)
5. **Response Handling**: Fixed to handle both `redirect_uri` and `redirectURI` response formats from better-auth

### Flow Diagram
```
1. Electron App → Next.js Sign-in Page (with OAuth params)
2. Sign-in Page → Store params in localStorage → Google OAuth
3. Google OAuth → Redirect back to Next.js Consent Page
4. Consent Page → Retrieve params from localStorage → Process consent
5. Consent Success → Build redirect URL with code & state → Electron App
```

## Architecture Overview

The implementation follows the OAuth2/OIDC authorization code flow with PKCE:

1. **Electron App** initiates authentication by registering as a dynamic client
2. **System Browser** opens for user authentication on the OIDC provider
3. **OIDC Provider** (Next.js app) handles user login and consent with parameter persistence
4. **Custom Protocol** captures the authorization callback with proper code and state
5. **Token Exchange** converts authorization code to access/refresh tokens
6. **User Info** is fetched and stored for the authenticated session

This approach provides secure authentication while maintaining a good user experience across both the Electron desktop app and the web-based OIDC provider, with robust handling of OAuth parameter persistence through the authentication flow.