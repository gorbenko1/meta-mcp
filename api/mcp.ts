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

    // Campaign Management Tools
    server.tool(
      "create_campaign",
      "Create a new advertising campaign",
      {
        account_id: z.string().describe("The ad account ID"),
        name: z.string().describe("Campaign name"),
        objective: z.string().describe("Campaign objective (OUTCOME_TRAFFIC, OUTCOME_LEADS, etc.)"),
        status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Campaign status"),
        budget_optimization: z.boolean().optional().describe("Enable campaign budget optimization"),
        daily_budget: z.number().optional().describe("Daily budget in cents"),
        lifetime_budget: z.number().optional().describe("Lifetime budget in cents")
      },
      async ({ account_id, name, objective, status, budget_optimization, daily_budget, lifetime_budget }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const campaignData: any = {
            name,
            objective,
            status: status || "PAUSED",
            special_ad_categories: []  // Empty array for no special categories
          };
          
          if (daily_budget) campaignData.daily_budget = daily_budget;
          if (lifetime_budget) campaignData.lifetime_budget = lifetime_budget;
          if (budget_optimization) campaignData.budget_optimization = budget_optimization;
          
          const campaign = await metaClient.createCampaign(account_id, campaignData);
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, campaign }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "update_campaign",
      "Update an existing campaign",
      {
        campaign_id: z.string().describe("Campaign ID to update"),
        name: z.string().optional().describe("New campaign name"),
        status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Campaign status"),
        daily_budget: z.number().optional().describe("Daily budget in cents"),
        lifetime_budget: z.number().optional().describe("Lifetime budget in cents")
      },
      async ({ campaign_id, name, status, daily_budget, lifetime_budget }) => {
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
          
          const result = await metaClient.updateCampaign(campaign_id, updates);
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, result }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "pause_campaign",
      "Pause a campaign",
      {
        campaign_id: z.string().describe("Campaign ID to pause")
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
          
          await metaClient.updateCampaign(campaign_id, { status: "PAUSED" });
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, message: "Campaign paused successfully" }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "resume_campaign",
      "Resume/activate a paused campaign",
      {
        campaign_id: z.string().describe("Campaign ID to resume")
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
          
          await metaClient.updateCampaign(campaign_id, { status: "ACTIVE" });
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, message: "Campaign resumed successfully" }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    // Ad Set Management Tools
    server.tool(
      "create_ad_set",
      "Create a new ad set within a campaign",
      {
        campaign_id: z.string().describe("The campaign ID to create the ad set in"),
        name: z.string().describe("Ad set name"),
        targeting: z.object({
          geo_locations: z.object({ countries: z.array(z.string()) }).optional(),
          age_min: z.number().optional(),
          age_max: z.number().optional(),
          genders: z.array(z.number()).optional(),
          interests: z.array(z.object({ id: z.string(), name: z.string().optional() })).optional(),
          behaviors: z.array(z.object({ id: z.string(), name: z.string().optional() })).optional(),
          custom_audiences: z.array(z.string()).optional(),
          excluded_custom_audiences: z.array(z.string()).optional()
        }).describe("Targeting specification"),
        daily_budget: z.number().optional().describe("Daily budget in cents"),
        lifetime_budget: z.number().optional().describe("Lifetime budget in cents"),
        bid_strategy: z.enum(["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP"]).optional(),
        optimization_goal: z.string().describe("Optimization goal (REACH, IMPRESSIONS, CLICKS, etc.)"),
        billing_event: z.string().optional().describe("Billing event (IMPRESSIONS, CLICKS, etc.)"),
        status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Ad set status")
      },
      async ({ campaign_id, name, targeting, daily_budget, lifetime_budget, bid_strategy, optimization_goal, billing_event, status }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const adSetData: any = {
            name,
            campaign_id,
            targeting,
            optimization_goal,
            status: status || "PAUSED"
          };
          
          if (daily_budget) adSetData.daily_budget = daily_budget;
          if (lifetime_budget) adSetData.lifetime_budget = lifetime_budget;
          if (bid_strategy) adSetData.bid_strategy = bid_strategy;
          if (billing_event) adSetData.billing_event = billing_event;
          
          const adSet = await metaClient.createAdSet(campaign_id, adSetData);
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, ad_set: adSet }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "list_ad_sets",
      "List ad sets for a campaign",
      {
        campaign_id: z.string().describe("The campaign ID"),
        limit: z.number().optional().describe("Number of ad sets to return"),
        status: z.array(z.string()).optional().describe("Filter by status")
      },
      async ({ campaign_id, limit, status }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const params: any = { limit: limit || 25 };
          if (status) params.status = status;
          
          const adSets = await metaClient.getAdSets(campaign_id, params);
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, ad_sets: adSets }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    // Ad Management Tools
    server.tool(
      "create_ad",
      "Create a new ad within an ad set",
      {
        ad_set_id: z.string().describe("The ad set ID to create the ad in"),
        name: z.string().describe("Ad name"),
        creative_id: z.string().describe("The ad creative ID to use"),
        status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Ad status")
      },
      async ({ ad_set_id, name, creative_id, status }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const adData = {
            name,
            adset_id: ad_set_id,
            creative: { creative_id },
            status: status || "PAUSED"
          };
          
          const ad = await metaClient.createAd(ad_set_id, adData);
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, ad }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "list_ads",
      "List ads for an ad set or campaign",
      {
        ad_set_id: z.string().optional().describe("The ad set ID"),
        campaign_id: z.string().optional().describe("The campaign ID"), 
        account_id: z.string().optional().describe("The account ID"),
        limit: z.number().optional().describe("Number of ads to return"),
        status: z.array(z.string()).optional().describe("Filter by status")
      },
      async ({ ad_set_id, campaign_id, account_id, limit, status }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const params: any = { limit: limit || 25 };
          if (status) params.status = status;
          
          let ads;
          if (ad_set_id) {
            ads = await metaClient.getAds(ad_set_id, params);
          } else if (campaign_id) {
            ads = await metaClient.getAdsByCampaign(campaign_id, params);
          } else if (account_id) {
            ads = await metaClient.getAdsByAccount(account_id, params);
          } else {
            throw new Error("Must provide ad_set_id, campaign_id, or account_id");
          }
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, ads }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    // Additional Analytics Tools
    server.tool(
      "compare_performance",
      "Compare performance between multiple campaigns, ad sets, or ads",
      {
        object_ids: z.array(z.string()).describe("Array of campaign/ad set/ad IDs to compare"),
        level: z.enum(["campaign", "adset", "ad"]).describe("The level of comparison"),
        date_preset: z.string().optional().describe("Date preset like 'last_7d', 'last_30d'"),
        fields: z.array(z.string()).optional().describe("Specific metrics to compare")
      },
      async ({ object_ids, level, date_preset, fields }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const results: any[] = [];
          for (const object_id of object_ids) {
            const params: Record<string, any> = {
              level,
              date_preset: date_preset || "last_7d"
            };
            if (fields && fields.length > 0) {
              params.fields = fields;
            }
            
            const insights = await metaClient.getInsights(object_id, params);
            results.push({ object_id, insights });
          }
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, comparison: results }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "export_insights",
      "Export performance insights in various formats",
      {
        object_id: z.string().describe("Campaign/ad set/ad ID"),
        level: z.enum(["campaign", "adset", "ad"]).describe("The level of insights"),
        date_preset: z.string().optional().describe("Date preset"),
        format: z.enum(["json", "csv"]).optional().describe("Export format"),
        fields: z.array(z.string()).optional().describe("Specific metrics to export")
      },
      async ({ object_id, level, date_preset, format, fields }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const params: Record<string, any> = {
            level,
            date_preset: date_preset || "last_7d"
          };
          if (fields && fields.length > 0) {
            params.fields = fields;
          }
          
          const insights = await metaClient.getInsights(object_id, params);
          
          let exportData: string;
          if (format === "csv" && insights.data && insights.data.length > 0) {
            // Convert to CSV format
            const headers = Object.keys(insights.data[0] || {});
            const csvRows = [headers.join(',')];
            insights.data.forEach((row: any) => {
              csvRows.push(headers.map(header => row[header] || '').join(','));
            });
            exportData = csvRows.join('\n');
          } else {
            exportData = JSON.stringify(insights, null, 2);
          }
          
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              success: true, 
              format: format || "json",
              data: exportData,
              object_id,
              level
            }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    // Audience Management Tools
    server.tool(
      "list_audiences",
      "List custom audiences for an ad account",
      {
        account_id: z.string().describe("The ad account ID"),
        limit: z.number().optional().describe("Number of audiences to return")
      },
      async ({ account_id, limit }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const audiences = await metaClient.getCustomAudiences(account_id, { limit: limit || 25 });
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, audiences }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "create_custom_audience",
      "Create a custom audience",
      {
        account_id: z.string().describe("The ad account ID"),
        name: z.string().describe("Audience name"),
        description: z.string().optional().describe("Audience description"),
        subtype: z.enum(["CUSTOM", "WEBSITE", "APP", "OFFLINE_CONVERSION", "CLAIM", "PARTNER", "MANAGED", "VIDEO", "LOOKALIKE", "ENGAGEMENT", "DATA_SET", "BAG_OF_ACCOUNTS", "STUDY_RULE_AUDIENCE", "FOX"]).describe("Audience subtype")
      },
      async ({ account_id, name, description, subtype }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const audience = await metaClient.createCustomAudience(account_id, {
            name,
            description,
            subtype
          });
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, audience }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "create_lookalike_audience",
      "Create a lookalike audience based on a source audience",
      {
        account_id: z.string().describe("The ad account ID"),
        name: z.string().describe("Lookalike audience name"),
        origin_audience_id: z.string().describe("Source audience ID"),
        country: z.string().describe("Target country code (e.g., 'US')"),
        ratio: z.number().describe("Percentage of population to target (1-10)"),
        description: z.string().optional().describe("Audience description")
      },
      async ({ account_id, name, origin_audience_id, country, ratio, description }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const audience = await metaClient.createLookalikeAudience(account_id, {
            name,
            origin_audience_id,
            country,
            ratio,
            description
          });
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, audience }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "get_audience_info",
      "Get information about a custom audience",
      {
        audience_id: z.string().describe("The custom audience ID")
      },
      async ({ audience_id }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const audience = await metaClient.getCustomAudience(audience_id);
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, audience }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    // Creative Management Tools
    server.tool(
      "list_ad_creatives",
      "List ad creatives for an account",
      {
        account_id: z.string().describe("The ad account ID"),
        limit: z.number().optional().describe("Number of creatives to return")
      },
      async ({ account_id, limit }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const creatives = await metaClient.getAdCreatives(account_id, { limit: limit || 25 });
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, creatives }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    server.tool(
      "create_ad_creative",
      "Create a new ad creative",
      {
        account_id: z.string().describe("The ad account ID"),
        name: z.string().describe("Creative name"),
        object_story_spec: z.object({}).describe("Ad creative specification"),
        degrees_of_freedom_spec: z.object({}).optional().describe("Degrees of freedom specification")
      },
      async ({ account_id, name, object_story_spec, degrees_of_freedom_spec }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          const creative = await metaClient.createAdCreative(account_id, {
            name,
            object_story_spec,
            degrees_of_freedom_spec
          });
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, creative }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
          };
        }
      }
    );

    // OAuth Tools
    server.tool(
      "get_token_info",
      "Get information about the current access token",
      {},
      async () => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const tokenInfo = await auth.getTokenInfo();
          
          return {
            content: [{ type: "text", text: JSON.stringify({ success: true, token_info: tokenInfo }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ success: false, error: error.message }, null, 2) }],
            isError: true
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
