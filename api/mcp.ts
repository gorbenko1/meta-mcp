import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { MetaApiClient } from "../src/meta-client.js";
import { UserAuthManager } from "../src/utils/user-auth.js";

// Create a wrapper to handle authentication at the request level
const handler = async (req: Request) => {
  console.log("🌐 Incoming request to MCP handler");
  
  // Extract auth header from the actual request
  const authHeader = req.headers.get("authorization");
  console.log("🔑 Auth header present:", !!authHeader);
  
  return createMcpHandler(
  (server) => {
    console.log("🚀 MCP server starting");

    // Simple ping tool (no auth required)
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
                    version: "1.1.0",
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
                      error instanceof Error ? error.message : "Unknown error",
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

          const auth = await UserAuthManager.createUserAuthManager(user.userId);
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

    // Get campaigns tool
    server.tool(
      "get_campaigns",
      "Get campaigns for an ad account",
      {
        account_id: z.string().describe("The ad account ID"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of campaigns to return (default: 25)"),
        status: z
          .array(z.string())
          .optional()
          .describe("Filter by campaign status (ACTIVE, PAUSED, etc.)"),
      },
      async ({ account_id, limit, status }, context) => {
        try {
          console.log("📋 Get campaigns starting for account:", account_id);
          if (!authHeader) {
            throw new Error(
              "Authentication required: Missing Authorization header"
            );
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

          const result = await metaClient.getCampaigns(account_id, {
            limit: limit || 25,
            status,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    campaigns: result.data.map((campaign) => ({
                      id: campaign.id,
                      name: campaign.name,
                      objective: campaign.objective,
                      status: campaign.status,
                      effective_status: campaign.effective_status,
                      created_time: campaign.created_time,
                      daily_budget: campaign.daily_budget,
                      lifetime_budget: campaign.lifetime_budget,
                    })),
                    total: result.data.length,
                    account_id,
                    message: "Campaigns retrieved successfully",
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

    // Get insights tool for performance analytics
    server.tool(
      "get_insights",
      "Get performance insights for campaigns, ad sets, or ads",
      {
        object_id: z.string().describe("The ID of the campaign, ad set, or ad"),
        level: z.enum(["account", "campaign", "adset", "ad"]).describe("The level of insights to retrieve"),
        date_preset: z.string().optional().describe("Date preset like 'last_7d', 'last_30d'"),
        fields: z.array(z.string()).optional().describe("Specific metrics to retrieve"),
        limit: z.number().optional().describe("Number of results to return")
      },
      async ({ object_id, level, date_preset, fields, limit }, context) => {
        try {
          console.log("📊 Getting insights for:", object_id);
          
          if (!authHeader) {
            throw new Error("Authentication required");
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

          const params: Record<string, any> = {
            level,
            limit: limit || 25,
            date_preset: date_preset || "last_7d"
          };

          if (fields && fields.length > 0) {
            params.fields = fields;
          }

          const insights = await metaClient.getInsights(object_id, params);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    insights: insights,
                    object_id,
                    level,
                    date_preset: params.date_preset,
                    message: "Insights retrieved successfully"
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          console.error("❌ Get insights failed:", error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                    object_id,
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

    console.log("✅ MCP server initialized with tools");
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
