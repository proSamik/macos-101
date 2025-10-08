# OIDC Authentication Integration - Code Changes

This document outlines the code changes made to integrate OIDC (OpenID Connect) authentication into the Electron application and Next.js YouTube Todo App.

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

### 2. page.tsx (`youtube-todo-app/app/consent/page.tsx`)

**Purpose**: Fixed React 18+ hydration issues by wrapping useSearchParams in Suspense.

**Key Changes**:

```tsx
function ConsentContent() {
  const searchParams = useSearchParams();
  // ... existing consent logic
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
```

**What it does**:
- Separates the component that uses `useSearchParams` into its own component
- Wraps it with React's Suspense boundary to handle SSR/hydration properly
- Provides a loading fallback while the search params are being resolved
- Prevents hydration mismatches in Next.js 13+ App Router

---

### 3. auth.ts (`youtube-todo-app/lib/auth.ts`)

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

### 4. main.ts (`src/main/main.ts`)

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

### 5. preload.ts (`src/preload/preload.ts`)

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

## Architecture Overview

The implementation follows the OAuth2/OIDC authorization code flow with PKCE:

1. **Electron App** initiates authentication by registering as a dynamic client
2. **System Browser** opens for user authentication on the OIDC provider
3. **OIDC Provider** (Next.js app) handles user login and consent
4. **Custom Protocol** captures the authorization callback
5. **Token Exchange** converts authorization code to access/refresh tokens
6. **User Info** is fetched and stored for the authenticated session

This approach provides secure authentication while maintaining a good user experience across both the Electron desktop app and the web-based OIDC provider.