# Quick Setup Guide - Meta Marketing API MCP Server

## 🎯 Choose Your Setup

### Option A: Remote Server (Recommended) 🌐
- ✅ **Multi-user OAuth authentication**
- ✅ **Hosted on Vercel** (always available)
- ✅ **No local installation needed**
- ✅ **Automatic updates**

### Option B: Local Server 💻
- ✅ **Simple token-based auth**
- ✅ **Local control**
- ✅ **No network dependency**

---

## 🌐 Remote Server Setup (5 minutes)

### 1. Authenticate with Your Meta Account
Visit: `https://mcp.offerarc.com/api/auth/login`

### 2. Get Your Session Token
After authentication, you'll receive a response like:
```json
{
  "sessionToken": "eyJhbGciOiJIUzI1NiJ9...",
  "mcpEndpoint": "https://mcp.offerarc.com/api/mcp"
}
```

### 3. Configure Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "meta-ads-remote": {
      "url": "https://mcp.offerarc.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_SESSION_TOKEN_HERE"
      }
    }
  }
}
```

### 4. Restart Claude Desktop & Test
Ask: `"Check the health of the Meta Marketing API server"`

---

## 💻 Local Server Setup

### 1. Get Your Meta Access Token
1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add "Marketing API" product
4. Generate access token with `ads_read` and `ads_management` permissions
5. Copy the token

### 2. Run Automated Setup
```bash
# Clone repository
git clone https://github.com/your-org/meta-ads-mcp.git
cd meta-ads-mcp

# Run setup script
npm run setup
```

The script will ask you for:
- ✅ Meta access token (required)
- ✅ App ID, App Secret, Business ID (optional for OAuth)
- ✅ Installation method (global or local)

### 3. Restart Claude Desktop
- Completely quit Claude Desktop
- Reopen the application

### 4. Test Connection
In Claude Desktop, ask:
```
Check the health of the Meta Marketing API server
```

## 🔧 Manual Setup (Alternative)

### Configuration File Location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Basic Configuration:
```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "npx",
      "args": ["-y", "meta-ads-mcp"],
      "env": {
        "META_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

## 🔍 Troubleshooting

### Quick Checks:
```bash
# Check if setup is correct
npm run health-check

# Test server manually
npx -y meta-ads-mcp

# Check logs (macOS)
tail -f ~/Library/Logs/Claude/mcp*.log

# Check logs (Windows)
type "%APPDATA%\Claude\logs\mcp*.log"
```

### Common Issues:

#### "Command not found" errors
```bash
# Install Node.js first
# macOS: brew install node
# Windows: Download from nodejs.org

# Verify installation
node --version
npm --version
```

#### "Permission denied" errors
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

#### Meta API connection issues
```bash
# Test your token manually
curl -G \
  -d "access_token=YOUR_ACCESS_TOKEN" \
  "https://graph.facebook.com/v23.0/me"
```

## ✅ Verification

### Test Commands in Claude:
1. `Check the health of the Meta Marketing API server`
2. `List my ad accounts`
3. `Show me my campaign performance for the last 7 days`

### Expected Response:
- ✅ Server reports "healthy" status
- ✅ Shows your connected ad accounts
- ✅ Returns campaign data (if you have campaigns)

### If Not Working:
1. Check Claude Desktop logs for errors
2. Run `npm run health-check` for detailed diagnostics
3. Verify your Meta access token is valid
4. Make sure Claude Desktop was fully restarted
5. Try the manual test: `npx -y meta-ads-mcp`

## 📚 Next Steps

Once working, try these commands:
- `Create a new campaign for website traffic`
- `Show me performance insights for my top campaigns`
- `Create a custom audience from my website visitors`
- `Generate ad creative suggestions for my summer sale`

## 🆘 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review the [troubleshooting section](README.md#-troubleshooting)
- Run `npm run health-check` for automated diagnostics
