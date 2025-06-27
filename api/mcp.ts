import { createMcpHandler } from "@vercel/mcp-adapter";

const handler = createMcpHandler(
  (server) => {
    console.log("🚀 Minimal MCP server starting");

    // Simple ping tool
    server.tool("ping", "Simple ping test", {}, async () => {
      console.log("📍 Ping called");
      return {
        content: [
          {
            type: "text",
            text: "pong",
          },
        ],
      };
    });

    console.log("✅ Minimal MCP server initialized");
  },
  {
    // Server options
  },
  {
    // Vercel adapter configuration
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  }
);

export { handler as GET, handler as POST };
