# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides comprehensive integration with the Meta Marketing API for managing Facebook and Instagram advertising campaigns. It's written in TypeScript and designed to be used with Claude Desktop.

## Key Commands

### Development
- `npm run dev` - Start the development server with hot reloading (uses tsx)
- `npm run dev:vercel` - Start local Vercel development server
- `npm run build` - Compile TypeScript to JavaScript (output in `build/`)
- `npm test` - Run the Jest test suite (Note: No tests currently exist)
- `npm run lint` - Run ESLint to check code quality and enforce standards
- `npm run prepare` - Automatically runs build on npm install
- `npm run vercel-build` - Build command used by Vercel deployment

### Setup & Health Checks
- `npm run setup` - Interactive setup script for MCP configuration
- `npm run health-check` - Test server health and authentication status
- `npm run check` - Alias for health-check

### Testing Individual Features
When tests are added:
- To test a specific tool: `npm test -- tools/<tool-name>.test.ts`
- To run tests in watch mode: `npm test -- --watch`
- To run with coverage: `npm test -- --coverage`

## Architecture Overview

### Core Components

1. **Main Server** (`src/index.ts`)
   - Initializes the MCP server with StdioServerTransport
   - Registers all tools and resources
   - Handles authentication and configuration
   - Sets up error handling and graceful shutdown

2. **Meta Client** (`src/meta-client.ts`)
   - Centralized API client for all Meta Marketing API calls
   - Handles authentication, rate limiting, and error recovery
   - Provides typed methods for all API endpoints
   - Implements automatic retry with exponential backoff
   - Manages token validation and refresh

3. **Tools** (`src/tools/`)
   - Each file exports tools via the server.tool() method
   - Tools follow a consistent pattern with Zod schema validation
   - Categories: campaigns, analytics, audiences, creatives, oauth
   - All tools return structured responses with success/error states

4. **Resources** (`src/resources/`)
   - Provide contextual data for the LLM
   - Implement lazy loading and caching
   - Categories: campaigns, audiences, insights
   - Resources auto-refresh to maintain currency

5. **Utilities** (`src/utils/`)
   - Shared functionality across the codebase
   - Key utilities: authentication, error handling, pagination, rate limiting
   - TypeScript type guards and validation helpers

### Design Patterns

- **Modular Tool Organization**: Tools are grouped by functionality with consistent naming (e.g., `campaign_create`, `audience_list`)
- **Schema Validation**: All tool inputs are validated using Zod schemas with detailed error messages
- **Error Handling**: Comprehensive error handling with typed errors, retry logic, and user-friendly messages
- **Rate Limiting**: Built-in rate limiter with configurable tiers (Development: 60/5min, Standard: 9000/5min)
- **Pagination**: Automatic handling of paginated API responses with cursor-based navigation
- **Response Consistency**: All tools return standardized response objects with data/error fields

### Authentication & OAuth Implementation

The server provides comprehensive OAuth 2.0 support for Meta Marketing API authentication:

#### Environment Variables
```bash
# Required
META_ACCESS_TOKEN=your_access_token

# OAuth Configuration (for token refresh and full OAuth flow)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URI=your_redirect_uri

# Optional
META_AUTO_REFRESH=true               # Enable automatic token refresh
META_REFRESH_TOKEN=your_refresh_token
META_BUSINESS_ID=your_business_id
```

#### Authentication Methods Supported

1. **Static Access Token** (Basic)
   - Provide `META_ACCESS_TOKEN` only
   - Manual token management required

2. **Long-Lived Token with Auto-Refresh** (Recommended)
   - Set `META_APP_ID`, `META_APP_SECRET`, `META_AUTO_REFRESH=true`
   - Automatic refresh ~60 days before expiration
   - Background refresh process with error recovery

3. **Full OAuth Flow** (Web Applications)
   - Complete OAuth 2.0 authorization code flow
   - User consent and token exchange
   - PKCE support for enhanced security

4. **System User Tokens** (Enterprise)
   - Non-expiring tokens for server-to-server automation
   - Business Manager integration required
   - Supports multiple system users per business

#### OAuth Tools Available

- `generate_auth_url` - Create authorization URLs for user consent
- `exchange_code_for_token` - Exchange authorization code for access token
- `refresh_to_long_lived_token` - Convert short-lived to long-lived tokens
- `generate_system_user_token` - Create system user tokens
- `get_token_info` - Get detailed token information and validation
- `validate_token` - Validate current token status

### API Version

- Currently using Meta Graph API v23.0 (latest version, released May 2025)
- Supports Outcome-Driven Ad Experience (ODAE) objectives
- Compatible with all latest Meta Marketing API features
- Automatic version migration warnings

### Testing Strategy

- Jest is configured but no tests currently exist
- When adding tests:
  - Unit tests for individual tools and utilities
  - Integration tests for Meta API interactions
  - Mock Meta API responses for consistent testing
  - Test fixtures in `__tests__/fixtures/` for realistic data
  - Error scenario testing with edge cases

### TypeScript Configuration

- Strict mode enabled for type safety
- ES2022 target with ES module resolution
- Source maps enabled for debugging
- Declaration files generated for type exports
- No implicit any or unused variables
- Modern ES modules (type: "module" in package.json)
- ESLint configured with TypeScript rules (@typescript-eslint/recommended)
- Unused variables must be prefixed with underscore (_) to avoid errors

### Tool Registration Pattern

Tools are registered using the MCP SDK pattern:
```typescript
server.tool("tool_name", zodSchema.shape, async (params) => {
  try {
    const result = await client.someMethod(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Resource Implementation Pattern

Resources follow a server.resource() pattern:
```typescript
server.resource({
  path: "/campaigns",
  get: async () => {
    const data = await client.getCampaigns();
    return {
      mimeType: "application/json",
      data: JSON.stringify(data, null, 2)
    };
  }
});
```

## Deployment

### Vercel Deployment

The project is configured for comprehensive deployment to Vercel with full web interface:

1. **Files Added for Vercel**:
   - `api/mcp.ts` - Vercel API route that wraps the MCP server
   - `api/index.ts` - Main landing page
   - `api/dashboard.ts` - Web dashboard interface
   - `api/auth/` - Complete OAuth authentication flow (login, callback, profile, logout, refresh, revoke)
   - `api/test-auth.ts` - Authentication testing endpoint
   - `api/debug.ts` - Debug information endpoint
   - `vercel.json` - Vercel configuration with runtime settings and URL rewrites
   - `public/index.html` - Static web interface

2. **Environment Variables for Vercel**:
   ```bash
   META_ACCESS_TOKEN=required
   META_APP_ID=optional
   META_APP_SECRET=optional
   META_AUTO_REFRESH=true/false
   # See VERCEL_DEPLOYMENT.md for complete list
   ```

3. **Deployment Commands**:
   - `npm run vercel-build` - Build for Vercel
   - `npm run dev:vercel` - Local Vercel development

4. **MCP Client Configuration**:
   ```json
   {
     "mcpServers": {
       "meta-ads": {
         "url": "https://your-project.vercel.app/api/mcp"
       }
     }
   }
   ```

### Dual Deployment Model

This project supports both CLI and web deployment:

**CLI MCP Server** (Original):
- `npm run dev` - Run as CLI MCP server with stdio transport
- Built binary available at `build/index.js`
- Direct integration with Claude Desktop via `npx` command

**Web Application** (Vercel):
- Complete OAuth authentication flow
- Web dashboard for campaign management
- RESTful API endpoints
- Static web interface with debugging tools

## Important Considerations

- Always check Meta API documentation for endpoint changes
- Rate limits vary by endpoint - the rate limiter handles this automatically
- Some operations (like campaign creation) require specific permissions
- The server uses ES2022 modules - ensure Node.js 18+ compatibility
- All monetary values should be in cents (lowest denomination)
- Date ranges should use ISO 8601 format
- Targeting parameters require specific formatting per Meta's requirements
- The project currently lacks test coverage - consider adding tests for critical paths
- For Vercel deployment, ensure all environment variables are properly configured
- When working with the codebase, always run `npm run lint` after making changes to ensure code quality
- The project is configured as a CLI tool (`meta-ads-mcp`) available after build

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.