# Testing Guide: Multi-User Meta Ads MCP Server

This guide walks you through testing the secure multi-user authentication system.

## 🔧 Setup for Local Testing

### Step 1: Create a Meta Test App

1. **Go to Meta for Developers**: [developers.facebook.com](https://developers.facebook.com)
2. **Create New App**: 
   - Click "Create App"
   - Choose "Business" type
   - Fill in app details
3. **Add Facebook Login Product**:
   - Go to Products → Add Product → Facebook Login
   - Choose "Web" platform
4. **Configure OAuth Settings**:
   - Go to Facebook Login → Settings
   - Add Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback`
   - Save changes
5. **Get App Credentials**:
   - Go to Settings → Basic
   - Copy your App ID and App Secret

### Step 2: Setup Vercel KV for Local Testing

You need a Vercel KV database even for local testing:

1. **Create Vercel Project**: Deploy to Vercel first (even without env vars)
2. **Add KV Storage**:
   - Go to project dashboard → Storage → Add → KV
   - Create database (name: `meta-mcp-tokens`)
3. **Get KV Credentials**:
   - Copy `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   - These work for both local and production

### Step 3: Configure Local Environment

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values**:
   ```bash
   # .env.local
   META_APP_ID=your_actual_app_id
   META_APP_SECRET=your_actual_app_secret
   META_REDIRECT_URI=http://localhost:3000/api/auth/callback
   JWT_SECRET=some-random-secret-key-for-testing
   KV_REST_API_URL=your_vercel_kv_url
   KV_REST_API_TOKEN=your_vercel_kv_token
   ```

3. **Generate a secure JWT secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## 🚀 Local Testing Steps

### Step 1: Start Development Server

```bash
# Install dependencies (if not done)
npm install

# Start Vercel development server
npm run dev:vercel
```

This starts the server at `http://localhost:3000`

### Step 2: Test Authentication Flow

1. **Visit Login Page**: Open `http://localhost:3000`
   - You should see the Meta Ads MCP Server login page
   - Click "Connect Your Meta Account"

2. **OAuth Flow**:
   - Should redirect to Meta login
   - Login with your Facebook/Meta account
   - Grant permissions for ads management
   - Should redirect back to your dashboard

3. **Dashboard Access**:
   - Should show your user info
   - Display your personal MCP endpoint
   - Show your Bearer token for MCP clients

### Step 3: Test MCP Endpoint

1. **Test Authentication Required**:
   ```bash
   # This should fail with auth error
   curl http://localhost:3000/api/mcp
   ```

2. **Test with Bearer Token**:
   ```bash
   # Replace YOUR_TOKEN with the token from dashboard
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"method":"tools/list"}' \
        http://localhost:3000/api/mcp
   ```

3. **Test Health Check Tool**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
          "method": "tools/call",
          "params": {
            "name": "health_check",
            "arguments": {}
          }
        }' \
        http://localhost:3000/api/mcp
   ```

### Step 4: Test with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Start inspector
npx @modelcontextprotocol/inspector http://localhost:3000/api/mcp
```

1. **Open Inspector**: Go to `http://127.0.0.1:6274`
2. **Configure Connection**:
   - Transport: Streamable HTTP
   - URL: `http://localhost:3000/api/mcp`
   - Headers: Add `Authorization: Bearer YOUR_TOKEN`
3. **Test Tools**:
   - Click "List Tools"
   - Try "health_check" tool
   - Test "get_ad_accounts" if you have Meta Ads access

## 🌐 Production Testing on Vercel

### Step 1: Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod

# Or via GitHub (recommended)
git add .
git commit -m "Add multi-user authentication"
git push origin main
# Then import on Vercel dashboard
```

### Step 2: Configure Environment Variables

In Vercel dashboard → Project → Settings → Environment Variables:

```bash
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URI=https://your-project.vercel.app/api/auth/callback
JWT_SECRET=your_secure_jwt_secret
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

**Important**: Update your Meta app's OAuth redirect URI to use your Vercel domain!

### Step 3: Test Production Deployment

1. **Visit Your Deployment**: `https://your-project.vercel.app`
2. **Test Authentication**: Full OAuth flow
3. **Test MCP Endpoint**: Using production URL and tokens
4. **Test Multiple Users**: Have different people authenticate

## 🧪 Advanced Testing Scenarios

### Test User Isolation

1. **User A Authentication**:
   - User A logs in, gets Token A
   - Test MCP endpoint with Token A
   - Note the accessible ad accounts

2. **User B Authentication**:
   - User B logs in, gets Token B  
   - Test MCP endpoint with Token B
   - Verify different ad accounts (if different Meta accounts)

3. **Cross-User Access Test**:
   - Try User A's token with User B's expected data
   - Should fail or return User A's data only

### Test Token Management

1. **Token Refresh**:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-project.vercel.app/api/auth/refresh
   ```

2. **Token Revocation**:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-project.vercel.app/api/auth/revoke
   ```

3. **Logout Test**:
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-project.vercel.app/api/auth/logout
   ```

### Test Error Scenarios

1. **Invalid Token**: Use random token, should get 401
2. **Expired Session**: Wait for JWT expiry (or manually expire)
3. **Revoked Token**: Test MCP access after revocation
4. **Meta API Errors**: Test with invalid Meta permissions

## 🔍 Debugging Tips

### Check Vercel Logs

```bash
# View real-time logs
vercel logs --follow

# View specific function logs
vercel logs api/mcp.ts
vercel logs api/auth/callback.ts
```

### Common Issues & Solutions

1. **OAuth Redirect Mismatch**:
   - Ensure Meta app redirect URI matches exactly
   - Check for http vs https
   - Verify domain spelling

2. **KV Database Connection**:
   - Verify KV credentials are correct
   - Check KV dashboard for stored sessions
   - Test KV connection independently

3. **JWT Verification Failures**:
   - Ensure JWT_SECRET is consistent
   - Check token format and expiration
   - Verify cookie settings

4. **Meta API Permissions**:
   - Check if user granted all required scopes
   - Verify Meta account has ads access
   - Test with Meta Graph API Explorer

### Debug Mode

Add to your `.env.local` for more verbose logging:

```bash
DEBUG=true
NODE_ENV=development
```

## ✅ Test Checklist

### Basic Functionality
- [ ] Login page loads correctly
- [ ] OAuth flow completes successfully  
- [ ] Dashboard shows user info and token
- [ ] MCP endpoint requires authentication
- [ ] Health check tool works with valid token
- [ ] Unauthenticated requests fail properly

### Security
- [ ] CSRF protection works (state parameter)
- [ ] Tokens are stored securely in KV
- [ ] JWT validation works correctly
- [ ] Users can only access their own data
- [ ] Token revocation works
- [ ] Logout clears all sessions

### Integration
- [ ] MCP Inspector can connect with Bearer token
- [ ] Claude Desktop can use the endpoint
- [ ] All Meta Marketing API tools work
- [ ] Error messages are helpful

### Production
- [ ] HTTPS works correctly
- [ ] Environment variables are set
- [ ] Vercel KV is connected
- [ ] Meta OAuth app is configured
- [ ] Multiple users can authenticate simultaneously

Once you've tested these scenarios, your secure multi-user MCP server is ready for production use! 🎉