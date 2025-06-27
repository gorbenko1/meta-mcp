# Vercel Deployment Guide

This guide explains how to deploy your secure multi-user Meta Ads MCP server to Vercel. Each user authenticates with their own Meta account, ensuring complete data isolation and security.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Meta App Registration**: Create a Meta app for OAuth authentication
3. **Node.js 18+**: Required for local development and testing
4. **Vercel KV Database**: For secure token storage (free tier available)

## Quick Deployment

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration
   - Add your environment variables (see below)
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Setup Meta App for OAuth

Before deploying, you need to create a Meta app for OAuth authentication:

1. **Go to Meta for Developers**: [developers.facebook.com](https://developers.facebook.com)
2. **Create New App**: Choose "Business" type
3. **Add Facebook Login**: Go to Products → Facebook Login → Settings
4. **Configure Valid OAuth Redirect URIs**: Add `https://your-domain.vercel.app/api/auth/callback`
5. **Get App Credentials**: Copy your App ID and App Secret

## Environment Variables

Configure these environment variables in your Vercel project settings:

### Required Variables

```bash
# Meta App Configuration (Required for OAuth)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback

# JWT Security (Required)
JWT_SECRET=your_secure_random_secret_key_here

# Vercel KV Database (Required for token storage)
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_vercel_kv_token
```

### Optional Variables

```bash
# Server Configuration
MCP_SERVER_NAME=Meta Marketing API Server
NODE_ENV=production

# Meta API Configuration
META_API_VERSION=v23.0
META_BASE_URL=https://graph.facebook.com
```

### Setting Environment Variables

**Via Vercel Dashboard**:
1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable with its value
4. Choose "Production", "Preview", and "Development" as needed

**Via CLI**:
```bash
vercel env add META_ACCESS_TOKEN
# Enter your token when prompted
```

## Setup Vercel KV Database

1. **Go to Vercel Dashboard**: Navigate to your project
2. **Add KV Database**: Go to Storage → Add → KV
3. **Create Database**: Choose a name (e.g., "meta-mcp-tokens")
4. **Get Credentials**: Copy the KV_REST_API_URL and KV_REST_API_TOKEN
5. **Add to Environment Variables**: Set these in your project settings

## Testing Your Deployment

### 1. Access the Authentication Portal

Once deployed, visit your Vercel URL:
```
https://your-project-name.vercel.app
```

You'll see a secure login page where users can authenticate with their Meta accounts.

### 2. Authenticate with Meta

1. Click "Connect Your Meta Account"
2. Login with your Facebook/Meta credentials
3. Grant permissions for ads management
4. You'll be redirected to the dashboard with your personal MCP endpoint

### 3. Test the MCP Connection

After authentication, you'll get a personal MCP endpoint with authentication:
```
https://your-project-name.vercel.app/api/mcp
Authorization: Bearer your_session_token
```

Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector@latest https://your-project-name.vercel.app/api/mcp
```

**Important**: You'll need to add the Authorization header with your Bearer token in the inspector.

## Connecting MCP Clients

**Important**: Each user must authenticate first to get their personal Bearer token. Visit the deployment URL, login with Meta, and copy your token from the dashboard.

### Claude Desktop

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "meta-ads": {
      "url": "https://your-project-name.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer your_personal_session_token_here"
      },
      "description": "Secure Meta Marketing API integration with personal account access"
    }
  }
}
```

### Cursor IDE

Add this to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "meta-ads": {
      "url": "https://your-project-name.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer your_personal_session_token_here"
      }
    }
  }
}
```

### Getting Your Personal Token

1. Visit `https://your-project-name.vercel.app`
2. Authenticate with your Meta account
3. Copy the Bearer token from the dashboard
4. Use it in your MCP client configuration

## Available Tools

Your deployed MCP server provides these tools:

### Campaign Management
- `list_campaigns` - List all campaigns
- `create_campaign` - Create new campaigns
- `update_campaign` - Update campaign settings
- `delete_campaign` - Delete campaigns
- `pause_campaign` - Pause running campaigns
- `resume_campaign` - Resume paused campaigns
- `get_campaign` - Get detailed campaign info

### Analytics & Insights
- `get_insights` - Get performance metrics
- `compare_performance` - Compare multiple campaigns
- `export_insights` - Export analytics data
- `get_campaign_performance` - Detailed campaign metrics
- `get_attribution_data` - Attribution analysis

### Audience Management
- `list_audiences` - List custom audiences
- `create_custom_audience` - Create custom audiences
- `create_lookalike_audience` - Create lookalike audiences
- `estimate_audience_size` - Estimate reach

### Creative Management
- `list_creatives` - List ad creatives
- `create_ad_creative` - Create new ad creatives
- `preview_ad` - Preview ads before publishing
- `setup_ab_test` - Set up A/B tests

### OAuth & Authentication
- `generate_auth_url` - Generate OAuth authorization URLs
- `exchange_code_for_token` - Exchange auth codes for tokens
- `refresh_to_long_lived_token` - Convert to long-lived tokens
- `validate_token` - Validate current token

### Utility Tools
- `get_ad_accounts` - List accessible ad accounts
- `health_check` - Server health and status
- `get_capabilities` - Full server capabilities

## Resources

Your server also provides these MCP resources for contextual data:

- `meta://campaigns/{account_id}` - Campaign listings
- `meta://insights/campaign/{campaign_id}` - Campaign performance
- `meta://audiences/{account_id}` - Audience data
- And many more...

## Local Development

To test locally before deploying:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   export META_ACCESS_TOKEN=your_token_here
   # Add other variables as needed
   ```

3. **Run locally**:
   ```bash
   npm run dev:vercel
   ```

4. **Test with MCP Inspector**:
   ```bash
   npx @modelcontextprotocol/inspector@latest http://localhost:3000/api/mcp
   ```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify `META_ACCESS_TOKEN` is set correctly
   - Check token permissions in Meta Business Manager
   - Ensure token hasn't expired

2. **Build Failures**:
   - Make sure all dependencies are in `package.json`
   - Check TypeScript compilation with `npm run build`
   - Verify Node.js version compatibility

3. **Runtime Errors**:
   - Check Vercel function logs in dashboard
   - Verify environment variables are set
   - Test API endpoints individually

### Getting Help

- Check Vercel deployment logs in your dashboard
- Use `vercel logs` CLI command
- Test individual tools with MCP Inspector
- Verify Meta API access in Meta Business Manager

## Security Features

### Multi-User Isolation
- **Personal Authentication**: Each user authenticates with their own Meta account
- **Token Isolation**: User tokens are stored separately and never shared
- **Account Separation**: No cross-user data access possible
- **Secure Sessions**: JWT-based sessions with secure cookies

### OAuth 2.1 Security
- **CSRF Protection**: State parameter validation prevents attacks
- **Secure Token Storage**: Encrypted storage in Vercel KV
- **Automatic Refresh**: Tokens refreshed automatically before expiration
- **Revocation Support**: Users can revoke access at any time

### Data Protection
- **No Shared Credentials**: No server-wide access tokens stored
- **Bearer Token Authentication**: Each MCP request authenticated individually
- **Session Management**: Configurable session timeouts and cleanup
- **Audit Logging**: User actions tracked for security monitoring

## Security Best Practices

- **Keep JWT_SECRET secure** and unique per deployment
- **Use HTTPS only** for all communications
- **Monitor user sessions** for unusual activity
- **Regular security updates** for dependencies
- **Implement rate limiting** for API endpoints

## Performance Optimization

- Vercel automatically handles scaling and caching
- The server includes built-in rate limiting
- Long-running operations are optimized for serverless
- Resources are cached for better performance

## User Journey

### For End Users

1. **Visit the MCP Server**: Go to your Vercel deployment URL
2. **Authenticate**: Click "Connect Your Meta Account" and login
3. **Get Personal Endpoint**: Copy the MCP endpoint URL and Bearer token
4. **Configure MCP Client**: Add the endpoint and token to Claude Desktop/Cursor
5. **Start Using**: Access your Facebook Ads data through natural language

### For Developers

1. **Deploy Server**: Follow the deployment guide above
2. **Configure OAuth**: Set up Meta app and environment variables
3. **Test Authentication**: Verify the login flow works
4. **Share URL**: Give users the deployment URL to authenticate
5. **Monitor Usage**: Track user sessions and API usage

## Multi-User Architecture Benefits

- **Scalability**: Supports unlimited users with their own accounts
- **Security**: Complete isolation between users' data and tokens
- **Compliance**: Each user controls their own data and permissions
- **Cost Efficiency**: Shared infrastructure, personal access
- **Maintenance**: Single deployment serves all users securely

## API Endpoints

Your deployment includes these endpoints:

### Authentication
- `GET /` - Login page and server information
- `GET /api/auth/login` - Start OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/revoke` - Revoke tokens

### MCP Server
- `GET|POST|DELETE /api/mcp` - Main MCP endpoint (requires auth)
- `GET /dashboard` - User dashboard after login

Your secure multi-user Meta Ads MCP server is now ready for production use on Vercel!
