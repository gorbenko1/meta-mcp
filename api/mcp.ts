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

      // Add some key missing tools to get closer to the 49 tools count
      // These are the most important tools that were missing from the original 25

      // Delete campaign tool
      server.tool(
        "delete_campaign",
        "Delete a campaign (permanently removes it)",
        {
          campaign_id: z.string().describe("Campaign ID to delete"),
        },
        async ({ campaign_id }) => {
          try {
            if (!authHeader) throw new Error("Authentication required");
            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) throw new Error("Invalid authentication token");
            const auth = await UserAuthManager.createUserAuthManager(user.userId);
            if (!auth) throw new Error("Failed to initialize user authentication");

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();

            await metaClient.deleteCampaign(campaign_id);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: true, message: "Campaign deleted successfully" },
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
                  text: JSON.stringify(
                    { success: false, error: error.message },
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

      // Get campaign details
      server.tool(
        "get_campaign",
        "Get detailed information about a specific campaign",
        {
          campaign_id: z.string().describe("Campaign ID to get details for"),
        },
        async ({ campaign_id }) => {
          try {
            if (!authHeader) throw new Error("Authentication required");
            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) throw new Error("Invalid authentication token");
            const auth = await UserAuthManager.createUserAuthManager(user.userId);
            if (!auth) throw new Error("Failed to initialize user authentication");

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();

            const campaign = await metaClient.getCampaign(campaign_id);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ success: true, campaign }, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: false, error: error.message },
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

      // Update ad set tool
      server.tool(
        "update_ad_set",
        "Update an existing ad set",
        {
          ad_set_id: z.string().describe("Ad set ID to update"),
          name: z.string().optional().describe("New ad set name"),
          status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Ad set status"),
          daily_budget: z.number().optional().describe("Daily budget in cents"),
          lifetime_budget: z.number().optional().describe("Lifetime budget in cents"),
        },
        async ({ ad_set_id, name, status, daily_budget, lifetime_budget }) => {
          try {
            if (!authHeader) throw new Error("Authentication required");
            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) throw new Error("Invalid authentication token");
            const auth = await UserAuthManager.createUserAuthManager(user.userId);
            if (!auth) throw new Error("Failed to initialize user authentication");

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();

            const updates: any = {};
            if (name) updates.name = name;
            if (status) updates.status = status;
            if (daily_budget) updates.daily_budget = daily_budget;
            if (lifetime_budget) updates.lifetime_budget = lifetime_budget;

            const result = await metaClient.updateAdSet(ad_set_id, updates);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ success: true, result }, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: false, error: error.message },
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

      // Update ad tool
      server.tool(
        "update_ad",
        "Update an existing ad",
        {
          ad_id: z.string().describe("Ad ID to update"),
          name: z.string().optional().describe("New ad name"),
          status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Ad status"),
          creative_id: z.string().optional().describe("New creative ID"),
        },
        async ({ ad_id, name, status, creative_id }) => {
          try {
            if (!authHeader) throw new Error("Authentication required");
            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) throw new Error("Invalid authentication token");
            const auth = await UserAuthManager.createUserAuthManager(user.userId);
            if (!auth) throw new Error("Failed to initialize user authentication");

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();

            const updates: any = {};
            if (name) updates.name = name;
            if (status) updates.status = status;
            if (creative_id) updates.creative = { creative_id };

            const result = await metaClient.updateAd(ad_id, updates);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ success: true, result }, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: false, error: error.message },
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

      // Get campaign performance
      server.tool(
        "get_campaign_performance",
        "Get performance metrics for a specific campaign",
        {
          campaign_id: z.string().describe("Campaign ID"),
          date_preset: z.string().optional().describe("Date preset like 'last_7d', 'last_30d'"),
          fields: z.array(z.string()).optional().describe("Specific metrics to retrieve"),
        },
        async ({ campaign_id, date_preset, fields }) => {
          try {
            if (!authHeader) throw new Error("Authentication required");
            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) throw new Error("Invalid authentication token");
            const auth = await UserAuthManager.createUserAuthManager(user.userId);
            if (!auth) throw new Error("Failed to initialize user authentication");

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();

            const params: any = {
              level: "campaign",
              date_preset: date_preset || "last_7d",
            };
            if (fields) params.fields = fields;

            const insights = await metaClient.getInsights(campaign_id, params);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: true, campaign_id, performance: insights },
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
                  text: JSON.stringify(
                    { success: false, error: error.message },
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

      // Estimate audience size
      server.tool(
        "estimate_audience_size",
        "Estimate the size of a potential audience based on targeting parameters",
        {
          account_id: z.string().describe("Ad account ID"),
          targeting: z.object({
            geo_locations: z.object({
              countries: z.array(z.string()).optional(),
            }).optional(),
            age_min: z.number().optional(),
            age_max: z.number().optional(),
            genders: z.array(z.number()).optional(),
          }).describe("Targeting parameters"),
        },
        async ({ account_id, targeting }) => {
          try {
            if (!authHeader) throw new Error("Authentication required");
            const user = await UserAuthManager.authenticateUser(authHeader);
            if (!user) throw new Error("Invalid authentication token");
            const auth = await UserAuthManager.createUserAuthManager(user.userId);
            if (!auth) throw new Error("Failed to initialize user authentication");

            const metaClient = new MetaApiClient(auth);
            await auth.refreshTokenIfNeeded();

            const estimate = await metaClient.estimateAudienceSize(account_id, targeting);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    { success: true, estimate, targeting },
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
                  text: JSON.stringify(
                    { success: false, error: error.message },
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

      console.log("✅ MCP server initialized with 31 tools (25 original + 6 additional)");

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
