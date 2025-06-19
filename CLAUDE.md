# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides comprehensive integration with the Meta Marketing API for managing Facebook and Instagram advertising campaigns. It's written in TypeScript and designed to be used with Claude Desktop.

## Key Commands

### Development
- `npm run dev` - Start the development server with hot reloading
- `npm run build` - Compile TypeScript to JavaScript (output in `build/`)
- `npm test` - Run the Jest test suite
- `npm run lint` - Run ESLint to check code quality

### Testing Individual Features
- To test a specific tool: `npm test -- tools/<tool-name>.test.ts`
- To run tests in watch mode: `npm test -- --watch`

## Architecture Overview

### Core Components

1. **Main Server** (`src/index.ts`)
   - Initializes the MCP server
   - Registers all tools and resources
   - Handles authentication and configuration

2. **Meta Client** (`src/meta-client.ts`)
   - Centralized API client for all Meta Marketing API calls
   - Handles authentication, rate limiting, and error recovery
   - Provides typed methods for all API endpoints

3. **Tools** (`src/tools/`)
   - Each file exports multiple related tools
   - Tools follow a consistent pattern with Zod schema validation
   - Categories: campaigns, analytics, audiences, creatives, oauth

4. **Resources** (`src/resources/`)
   - Provide contextual data for the LLM
   - Implement lazy loading and caching
   - Categories: campaigns, audiences, insights

5. **Utilities** (`src/utils/`)
   - Shared functionality across the codebase
   - Key utilities: authentication, error handling, pagination, rate limiting

### Design Patterns

- **Modular Tool Organization**: Tools are grouped by functionality (campaigns, analytics, etc.)
- **Schema Validation**: All tool inputs are validated using Zod schemas
- **Error Handling**: Comprehensive error handling with typed errors and retry logic
- **Rate Limiting**: Built-in rate limiter to respect Meta API limits
- **Pagination**: Automatic handling of paginated API responses

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

3. **Full OAuth Flow** (Web Applications)
   - Complete OAuth 2.0 authorization code flow
   - User consent and token exchange

4. **System User Tokens** (Enterprise)
   - Non-expiring tokens for server-to-server automation
   - Business Manager integration required

#### OAuth Tools Available

- `generate_auth_url` - Create authorization URLs for user consent
- `exchange_code_for_token` - Exchange authorization code for access token
- `refresh_to_long_lived_token` - Convert short-lived to long-lived tokens
- `generate_system_user_token` - Create system user tokens
- `get_token_info` - Get detailed token information and validation
- `validate_token` - Validate current token status

#### Authentication Flow
1. Initial token provided via environment variable or OAuth flow
2. Automatic validation and refresh on startup
3. Background refresh when tokens near expiration
4. Multi-account support with account switching

### API Version

- Currently using Meta Graph API v23.0 (latest version, released May 2025)
- Supports Outcome-Driven Ad Experience (ODAE) objectives
- Compatible with all latest Meta Marketing API features

### Testing Strategy

- Unit tests for individual tools and utilities
- Integration tests for Meta API interactions
- Mock Meta API responses for consistent testing

## Important Considerations

- Always check Meta API documentation for endpoint changes
- Rate limits vary by endpoint - the rate limiter handles this automatically
- Some operations (like campaign creation) require specific permissions
- The server uses ES2022 modules - ensure Node.js 18+ compatibility