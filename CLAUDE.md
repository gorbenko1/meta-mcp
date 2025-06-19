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
   - Categories: campaigns, analytics, audiences, creatives

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

### Authentication Flow

The server supports OAuth 2.0 authentication with Meta:
1. Initial token provided via environment variable or config
2. Automatic token refresh when needed
3. Multi-account support with account switching

### Testing Strategy

- Unit tests for individual tools and utilities
- Integration tests for Meta API interactions
- Mock Meta API responses for consistent testing

## Important Considerations

- Always check Meta API documentation for endpoint changes
- Rate limits vary by endpoint - the rate limiter handles this automatically
- Some operations (like campaign creation) require specific permissions
- The server uses ES2022 modules - ensure Node.js 18+ compatibility