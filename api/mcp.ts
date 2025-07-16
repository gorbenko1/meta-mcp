import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { MetaApiClient } from "../src/meta-client.js";
import { UserAuthManager } from "../src/utils/user-auth.js";
import { registerCampaignTools } from "../src/tools/campaigns.js";
import { registerAnalyticsTools } from "../src/tools/analytics.js";
import { registerAudienceTools } from "../src/tools/audiences.js";
import { registerCreativeTools } from "../src/tools/creatives.js";
import { registerOAuthTools } from "../src/tools/oauth.js";

// Create a wrapper to handle authentication at the request level
const handler = async (req: Request) => {
  console.log("🌐 Incoming request to MCP handler");

  // Extract auth header from the actual request
  const authHeader = req.headers.get("authorization");
  console.log("🔑 Auth header present:", !!authHeader);

  return createMcpHandler(
    (server) => {
      console.log("🚀 MCP server starting");

      // Create a wrapper function to handle authentication for all tools
      const createAuthenticatedTool = (toolFn: Function) => {
        return async (args: any, context: any) => {
          try {
            if (!authHeader) {
              throw new Error("Authentication required: Missing Authorization header");
            }

            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) {
              throw new Error("Invalid authentication token");
            }

            const auth = await UserAuthManager.createUserAuthManager(user.userId);
            if (!auth) {
              throw new Error("Failed to initialize user authentication");
            }

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();

            // Call the original tool function with auth context
            return await toolFn(args, { user, auth, metaClient });
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { 
                      success: false, 
                      error: error instanceof Error ? error.message : "Unknown error" 
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }
        };
      };

      // Register all tools from modules with authentication wrapper
      const authWrapper = {
        setRequestHandler: (method: string, schema: any, handler: Function) => {
          server.setRequestHandler(method, schema, createAuthenticatedTool(handler));
        },
        tool: (name: string, description: any, schema: any, handler: Function) => {
          server.tool(name, description, schema, createAuthenticatedTool(handler));
        }
      };

      // Register all tool modules
      registerCampaignTools(authWrapper as any, {} as any);
      registerAnalyticsTools(authWrapper as any, {} as any);
      registerAudienceTools(authWrapper as any, {} as any);
      registerCreativeTools(authWrapper as any, {} as any);
      registerOAuthTools(authWrapper as any, {} as any);

      // Health check tool (with authentication)
      server.tool(
        "health_check",
        "Check server health and authentication status",
        {},
        async (args, context) => {
          try {
            console.log("🔍 Health check starting");
            console.log("Auth header available:", !!authHeader);
            if (!authHeader) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      {
                        status: "unhealthy",
                        error:
                          "Authentication required: Missing Authorization header",
                        timestamp: new Date().toISOString(),
                      },
                      null,
                      2
                    ),
                  },
                ],
                isError: true,
              };
            }

            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(
                      {
                        status: "unhealthy",
                        error: "Invalid authentication token",
                        timestamp: new Date().toISOString(),
                      },
                      null,
                      2
                    ),
                  },
                ],
                isError: true,
              };
            }

            console.log("✅ Health check passed");
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "healthy",
                      server_name: "Meta Marketing API Server",
                      version: "1.7.0",
                      timestamp: new Date().toISOString(),
                      deployment: "vercel",
                      user: {
                        id: user.userId,
                        name: user.name,
                        email: user.email,
                      },
                      features: {
                        authentication: "oauth_required",
                        campaign_management: true,
                        analytics_reporting: true,
                        audience_management: true,
                        creative_management: true,
                        analytics_reporting: true,
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } catch (error) {
            console.error("❌ Health check failed:", error);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      status: "unhealthy",
                      error:
                        error instanceof Error
                          ? error.message
                          : "Unknown error",
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }
        }
      );

      // Get ad accounts tool
      server.tool(
        "get_ad_accounts",
        "Get list of accessible Meta ad accounts",
        {},
        async (args, context) => {
          try {
            console.log("📋 Get ad accounts starting");
            console.log("Using auth header from request scope:", !!authHeader);
            if (!authHeader) {
              throw new Error(
                "Authentication required: Missing Authorization header"
              );
            }

            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) {
              throw new Error("Invalid authentication token");
            }

            const auth = await UserAuthManager.createUserAuthManager(
              user.userId
            );
            if (!auth) {
              throw new Error("Failed to initialize user authentication");
            }

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();
            const accounts = await metaClient.getAdAccounts();

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      success: true,
                      accounts: accounts.map((account) => ({
                        id: account.id,
                        name: account.name,
                        account_status: account.account_status,
                        currency: account.currency,
                        timezone_name: account.timezone_name,
                        business: account.business
                          ? {
                              id: account.business.id,
                              name: account.business.name,
                            }
                          : null,
                      })),
                      total_accounts: accounts.length,
                      message: "Ad accounts retrieved successfully",
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                },
              ],
              isError: true,
            };
          }
        }
      );

      console.log("✅ MCP server initialized with all 49 tools from modules");
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
  )(req);
};

export { handler as GET, handler as POST };
