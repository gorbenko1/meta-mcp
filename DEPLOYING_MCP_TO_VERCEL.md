# Deploying Node.js MCP Servers to Vercel: A Complete Guide

The Model Context Protocol (MCP) enables AI assistants to interact with external tools and data through a standardized interface. While many MCP servers are designed to run locally, deploying them to cloud platforms like Vercel opens up new possibilities for multi-user access and scalable integrations.

This guide walks through the complete process of adapting and deploying a Node.js MCP server to Vercel, covering authentication, storage, and the key architectural decisions needed for production deployment.

## Understanding the Challenge

Traditional MCP servers use stdio transport for local communication between the AI client and server. However, web deployment requires HTTP transport and introduces several new requirements:

- **User Authentication**: Multiple users need secure access without sharing credentials
- **Session Management**: Stateful user sessions across serverless function calls
- **Token Storage**: Secure storage for user-specific API tokens
- **CORS and Security**: Proper headers and security measures for web access

## Architecture Overview

The deployed architecture transforms a local MCP server into a multi-user web service:

```
AI Client (Claude/Cursor) → HTTPS → Vercel Functions → MCP Tools → External APIs
                                        ↓
                                   User Sessions (Redis/KV)
```

Key components:
- **Authentication Layer**: OAuth 2.1 flow for user login
- **Session Management**: JWT tokens with secure storage
- **MCP Adapter**: Vercel's `@vercel/mcp-adapter` for HTTP transport
- **Storage Backend**: Redis or Vercel KV for user data

## Project Structure

A Vercel-deployed MCP server follows this structure:

```
project/
├── api/                    # Vercel Functions
│   ├── mcp.ts             # Main MCP endpoint
│   ├── auth/              # Authentication endpoints
│   │   ├── login.ts
│   │   ├── callback.ts
│   │   └── profile.ts
│   └── index.ts           # Landing page
├── src/                   # Core MCP logic
│   ├── tools/             # MCP tools
│   ├── resources/         # MCP resources
│   └── utils/             # Authentication & storage
├── public/                # Static files
├── vercel.json           # Vercel configuration
└── package.json
```

## Step 1: Installing Dependencies

Start by installing the required dependencies:

```bash
npm install @vercel/mcp-adapter jose redis zod
npm install --save-dev @types/node typescript
```

Key packages:
- `@vercel/mcp-adapter`: Enables MCP over HTTP
- `jose`: JWT token management
- `redis`: Storage backend (or `@vercel/kv` for Vercel KV)
- `zod`: Schema validation

## Step 2: Vercel Configuration

Create a `vercel.json` file to configure the deployment:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "api/mcp.ts": {
      "maxDuration": 60
    },
    "api/auth/login.ts": {
      "maxDuration": 30
    },
    "api/auth/callback.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/",
      "destination": "/api/index"
    },
    {
      "source": "/mcp",
      "destination": "/api/mcp"
    }
  ]
}
```

Important notes:
- Don't specify runtime versions for Node.js - Vercel handles this automatically
- Set appropriate `maxDuration` values for each function
- Use `rewrites` to create clean URLs

## Step 3: Storage Adapter

Create a flexible storage system that supports multiple backends:

```typescript
// src/utils/storage.ts
interface StorageAdapter {
  set(key: string, value: any, options?: { ex?: number }): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
}

class RedisAdapter implements StorageAdapter {
  private client: any;

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    const { createClient } = await import('redis');
    this.client = createClient({
      url: process.env.REDIS_URL
    });
    await this.client.connect();
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    const serialized = JSON.stringify(value);
    if (options?.ex) {
      await this.client.setEx(key, options.ex, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

function createStorageAdapter(): StorageAdapter {
  if (process.env.REDIS_URL) {
    return new RedisAdapter();
  }
  // Add other adapters (Vercel KV, etc.)
  throw new Error('No storage configuration found');
}
```

## Step 4: User Authentication

Implement OAuth 2.1 authentication with JWT session management:

```typescript
// src/utils/auth.ts
import { SignJWT, jwtVerify } from 'jose';

export class UserAuthManager {
  private static JWT_SECRET = process.env.JWT_SECRET || '';
  private static storage = createStorageAdapter();

  static async createSessionToken(userId: string): Promise<string> {
    const secret = new TextEncoder().encode(this.JWT_SECRET);
    
    return await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
  }

  static async verifySessionToken(token: string): Promise<{ userId: string } | null> {
    try {
      const secret = new TextEncoder().encode(this.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      if (typeof payload.userId === 'string') {
        return { userId: payload.userId };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  static async storeUserSession(session: UserSession): Promise<void> {
    const key = `user_session:${session.userId}`;
    await this.storage.set(key, session, { ex: 7 * 24 * 60 * 60 });
  }

  static async authenticateUser(authHeader: string | null): Promise<UserSession | null> {
    const token = this.extractBearerToken(authHeader);
    if (!token) return null;

    const decoded = await this.verifySessionToken(token);
    if (!decoded) return null;

    return await this.getUserSession(decoded.userId);
  }

  private static extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
```

## Step 5: OAuth Endpoints

Create authentication endpoints for the OAuth flow:

```typescript
// api/auth/login.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const state = await UserAuthManager.generateOAuthState();
    
    res.setHeader('Set-Cookie', [
      `oauth_state=${state}; HttpOnly; Secure; SameSite=Strict; Max-Age=600; Path=/`,
    ]);

    const authUrl = UserAuthManager.generateMetaOAuthUrl(state);

    res.status(200).json({
      success: true,
      authUrl: authUrl,
      message: 'Redirect user to this URL to begin OAuth flow'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
}
```

```typescript
// api/auth/callback.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;

  // Validate state parameter (CSRF protection)
  // Exchange code for access token
  // Create user session
  // Return success with user info and MCP endpoint
}
```

## Step 6: MCP Server Adaptation

Adapt your existing MCP server to work with Vercel's HTTP transport:

```typescript
// api/mcp.ts
import { createMcpHandler } from '@vercel/mcp-adapter';
import { UserAuthManager } from '../src/utils/auth.js';

const handler = createMcpHandler(
  async (server, { request }) => {
    // Authenticate user from request headers
    const authHeader = request?.headers?.get?.('authorization');
    const user = await UserAuthManager.authenticateUser(authHeader);
    
    if (!user) {
      throw new Error("Authentication required: Please login with your account");
    }

    // Create user-specific API client
    const apiClient = await createUserApiClient(user.userId);

    // Register your existing MCP tools
    server.tool("example_tool", {
      input: z.object({
        param: z.string()
      })
    }, async ({ input }) => {
      const result = await apiClient.callExternalAPI(input.param);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    });

    // Add health check
    server.tool("health_check", {}, async () => {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "healthy",
            user: user.name,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    });
  },
  {
    serverName: "Your MCP Server",
    serverVersion: "1.0.0",
  },
  { basePath: '/api' }
);

export { handler as GET, handler as POST, handler as DELETE };
```

## Step 7: Environment Variables

Configure the required environment variables in Vercel:

```bash
# OAuth Configuration
META_APP_ID=your_oauth_app_id
META_APP_SECRET=your_oauth_app_secret
META_REDIRECT_URI=https://your-project.vercel.app/api/auth/callback

# JWT Security
JWT_SECRET=your_secure_32_byte_random_key

# Storage (choose one)
REDIS_URL=redis://user:pass@host:port
# OR
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token

# API Configuration
API_BASE_URL=https://api.example.com
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 8: User Interface

Create a simple landing page for user authentication:

```typescript
// api/index.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>MCP Server</title>
    <style>
        body { font-family: system-ui; max-width: 600px; margin: 0 auto; padding: 2rem; }
        .button { background: #0070f3; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>MCP Server</h1>
    <p>Authenticate with your account to get started.</p>
    <button class="button" onclick="startLogin()">Connect Account</button>
    
    <script>
        async function startLogin() {
            const response = await fetch('/api/auth/login');
            const data = await response.json();
            if (data.success) {
                window.location.href = data.authUrl;
            }
        }
    </script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
```

## Deployment and Testing

Deploy to Vercel:

```bash
# Via CLI
vercel --prod

# Or connect GitHub repository in Vercel dashboard
```

Test the deployment:

1. **Visit your deployment URL** - should show the login page
2. **Complete OAuth flow** - authenticate with your service
3. **Test MCP endpoint** with Bearer token:

```bash
curl -H "Authorization: Bearer your_session_token" \
     -H "Content-Type: application/json" \
     -d '{"method":"tools/list"}' \
     https://your-project.vercel.app/api/mcp
```

4. **Configure MCP client** (Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "your-server": {
      "url": "https://your-project.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer your_personal_session_token"
      }
    }
  }
}
```

## Security Considerations

- **User Isolation**: Each user's tokens and data are completely isolated
- **Token Security**: JWT tokens are signed and validated on every request
- **CSRF Protection**: OAuth state parameters prevent cross-site request forgery
- **Secure Storage**: User tokens are encrypted in transit and at rest
- **Session Management**: Configurable token expiration and refresh

## Common Issues and Solutions

**Build Errors**:
- Ensure all dependencies are in `package.json`
- Don't specify Node.js runtime versions in `vercel.json`
- Add a `public/index.html` file if Vercel expects static assets

**Authentication Failures**:
- Verify OAuth redirect URIs match exactly
- Check that environment variables are set correctly
- Ensure OAuth app is in "Live" mode or user is added as tester

**Storage Connection Issues**:
- Test Redis/KV connectivity independently
- Check that connection strings are formatted correctly
- Verify network access and authentication

## Conclusion

Deploying MCP servers to Vercel enables powerful multi-user integrations while maintaining security and scalability. The key architectural changes involve:

1. Replacing stdio transport with HTTP via `@vercel/mcp-adapter`
2. Implementing user authentication with OAuth 2.1 and JWT
3. Adding secure storage for user sessions and tokens
4. Adapting the server logic for serverless execution

This approach transforms local MCP tools into production-ready web services that can serve multiple users securely and efficiently.