# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server built with TypeScript using the `@modelcontextprotocol/sdk`. It currently implements a basic demo server with:
- An addition tool that adds two numbers
- A dynamic greeting resource that generates personalized greetings

## Commands

### Development
- Install dependencies: `pnpm install` or `npm install`
- Run TypeScript directly: `npx tsx index.ts`
- There are no build, lint, or test commands configured yet

## Architecture

The project follows the MCP server pattern:
- `index.ts` - Main server implementation that:
  - Creates an MCP server instance
  - Registers tools (e.g., addition tool)
  - Registers resources (e.g., greeting resource)
  - Connects via stdio transport for communication

The server uses:
- Zod for input schema validation
- Stdio transport for IPC communication
- ResourceTemplate for dynamic resource URIs

## Key Concepts

- **Tools**: Functions that can be called by MCP clients (like the `add` tool)
- **Resources**: Data that can be accessed via URI patterns (like `greeting://{name}`)
- **Transport**: Uses stdio (stdin/stdout) for client-server communication