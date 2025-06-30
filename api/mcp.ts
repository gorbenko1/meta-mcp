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
        optimization_goal: z.enum([
          "REACH", "IMPRESSIONS", "CLICKS", "UNIQUE_CLICKS", "APP_INSTALLS", 
          "OFFSITE_CONVERSIONS", "CONVERSIONS", "LINK_CLICKS", "POST_ENGAGEMENT",
          "PAGE_LIKES", "EVENT_RESPONSES", "MESSAGES", "APP_DOWNLOADS", "LANDING_PAGE_VIEWS"
        ]).describe("Optimization goal"),
        billing_event: z.enum([
          "IMPRESSIONS", "CLICKS", "APP_INSTALLS", "OFFSITE_CONVERSIONS", 
          "CONVERSIONS", "LINK_CLICKS", "NONE"
        ]).describe("What you pay for"),
        daily_budget: z.number().optional().describe("Daily budget in cents (minimum 100 = $1)"),
        lifetime_budget: z.number().optional().describe("Lifetime budget in cents"),
        bid_strategy: z.enum(["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP"]).optional(),
        status: z.enum(["ACTIVE", "PAUSED"]).optional().describe("Ad set status"),
        // Simplified targeting - start basic
        countries: z.array(z.string()).optional().describe("Country codes (e.g., ['US', 'CA'])"),
        age_min: z.number().min(13).max(65).optional().describe("Minimum age (13-65)"),
        age_max: z.number().min(13).max(65).optional().describe("Maximum age (13-65)"),
        genders: z.array(z.enum(["1", "2"])).optional().describe("1=Male, 2=Female"),
        // Advanced targeting (optional)
        interests: z.array(z.string()).optional().describe("Interest targeting IDs"),
        behaviors: z.array(z.string()).optional().describe("Behavior targeting IDs"),
        custom_audiences: z.array(z.string()).optional().describe("Custom audience IDs")
      },
      async ({ 
        campaign_id, name, optimization_goal, billing_event, daily_budget, lifetime_budget, 
        bid_strategy, status, countries, age_min, age_max, genders, interests, behaviors, custom_audiences 
      }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          // Build targeting object carefully
          const targeting: any = {};
          
          // Geographic targeting
          if (countries && countries.length > 0) {
            targeting.geo_locations = { countries };
          } else {
            // Default to US if no countries specified
            targeting.geo_locations = { countries: ["US"] };
          }
          
          // Age targeting
          if (age_min) targeting.age_min = age_min;
          if (age_max) targeting.age_max = age_max;
          
          // Gender targeting
          if (genders && genders.length > 0) {
            targeting.genders = genders.map(g => parseInt(g));
          }
          
          // Interest targeting
          if (interests && interests.length > 0) {
            targeting.interests = interests.map(id => ({ id }));
          }
          
          // Behavior targeting  
          if (behaviors && behaviors.length > 0) {
            targeting.behaviors = behaviors.map(id => ({ id }));
          }
          
          // Custom audience targeting
          if (custom_audiences && custom_audiences.length > 0) {
            targeting.custom_audiences = custom_audiences.map(id => ({ id }));
          }
          
          // Build ad set data with required fields
          const adSetData: any = {
            name,
            campaign_id,
            targeting,
            optimization_goal,
            billing_event,
            status: status || "PAUSED"
          };
          
          // Budget (must have either daily or lifetime)
          // Meta API expects budget in account currency cents, not USD
          if (daily_budget) {
            adSetData.daily_budget = Math.max(daily_budget, 100); // Minimum based on currency
          } else if (lifetime_budget) {
            adSetData.lifetime_budget = Math.max(lifetime_budget, 100);
          } else {
            // Default to higher budget to avoid currency conversion issues
            adSetData.daily_budget = 1000; // $10 equivalent, adjusts for currency
          }
          
          // Bid strategy
          if (bid_strategy) {
            adSetData.bid_strategy = bid_strategy;
          }
          
          console.log("📊 Creating ad set with data:", JSON.stringify(adSetData, null, 2));
          
          const adSet = await metaClient.createAdSet(campaign_id, adSetData);
          
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              success: true, 
              ad_set: adSet,
              message: "Ad set created successfully",
              targeting_used: targeting
            }, null, 2) }]
          };
        } catch (error) {
          console.error("❌ Ad set creation failed:", error);
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              success: false, 
              error: error.message,
              troubleshooting: {
                common_fixes: [
                  "Ensure campaign is fully initialized (wait 1-2 minutes after creation)",
                  "Verify account has payment method configured",
                  "Check if Facebook Pixel is required for conversion campaigns",
                  "Try simpler targeting first (just countries and age)",
                  "Ensure minimum budget requirements are met ($1+ daily)"
                ]
              }
            }, null, 2) }],
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

    server.tool(
      "check_account_setup",
      "Check if ad account has all required setup for ad set creation",
      {
        account_id: z.string().describe("The ad account ID to check")
      },
      async ({ account_id }) => {
        try {
          if (!authHeader) throw new Error("Authentication required");
          const user = await UserAuthManager.authenticateUser(authHeader);
          if (!user) throw new Error("Invalid authentication token");
          const auth = await UserAuthManager.createUserAuthManager(user.userId);
          if (!auth) throw new Error("Failed to initialize user authentication");
          
          const metaClient = new MetaApiClient(auth);
          await auth.refreshTokenIfNeeded();
          
          // Get detailed account information
          const account = await metaClient.getAdAccount(account_id);
          
          const setupCheck = {
            account_id,
            account_status: account.account_status,
            currency: account.currency,
            timezone_name: account.timezone_name,
            has_payment_method: false,
            business_info: {},
            required_fixes: [],
            success_likelihood: "unknown"
          };
          
          // Check payment methods
          try {
            const fundingSources = await metaClient.getFundingSources(account_id);
            setupCheck.has_payment_method = fundingSources && fundingSources.length > 0;
          } catch (error) {
            setupCheck.required_fixes.push("Unable to check payment methods - may need account admin access");
          }
          
          // Check business info
          try {
            const businessInfo = await metaClient.getAccountBusiness(account_id);
            setupCheck.business_info = businessInfo;
          } catch (error) {
            setupCheck.required_fixes.push("Unable to access business information");
          }
          
          // Analyze issues
          if (account.account_status !== "ACTIVE") {
            setupCheck.required_fixes.push(`Account status is ${account.account_status}, must be ACTIVE`);
          }
          
          if (!setupCheck.has_payment_method) {
            setupCheck.required_fixes.push("Add a valid payment method to the ad account");
          }
          
          // Budget recommendations based on currency
          const budgetRecommendations = {
            USD: "Minimum $1 (100 cents), recommended $10+ (1000+ cents)",
            EUR: "Minimum €1 (100 cents), recommended €10+ (1000+ cents)", 
            GBP: "Minimum £1 (100 pence), recommended £10+ (1000+ pence)",
            INR: "Minimum ₹84 (8400 paisa), recommended ₹500+ (50000+ paisa)",
            default: `Minimum 100 ${account.currency} cents, recommended 1000+ ${account.currency} cents`
          };
          
          setupCheck.budget_guidance = budgetRecommendations[account.currency] || budgetRecommendations.default;
          
          // Success likelihood
          if (setupCheck.required_fixes.length === 0) {
            setupCheck.success_likelihood = "high";
          } else if (setupCheck.required_fixes.length <= 2) {
            setupCheck.success_likelihood = "medium";
          } else {
            setupCheck.success_likelihood = "low";
          }
          
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              success: true,
              setup_check: setupCheck,
              next_steps: setupCheck.required_fixes.length > 0 ? 
                "Fix the issues listed above, then try ad set creation again" :
                "Account appears ready for ad set creation"
            }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              success: false, 
              error: error.message,
              account_id
            }, null, 2) }],
            isError: true
          };
        }
      }
    );

    // Diagnostic Tools
    server.tool(
      "diagnose_campaign_readiness",
      "Check if a campaign is ready for ad set creation and identify potential issues",
      {
        campaign_id: z.string().describe("The campaign ID to diagnose")
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
          
          // Get campaign details
          const campaign = await metaClient.getCampaign(campaign_id);
          
          // Get account details
          const accountId = campaign.account_id;
          const account = await metaClient.getAdAccount(accountId);
          
          // Check for common issues
          const diagnostics = {
            campaign_status: campaign.status,
            campaign_objective: campaign.objective,
            account_status: account.account_status,
            account_currency: account.currency,
            has_payment_method: account.funding_source_details?.length > 0,
            pixel_setup: "Unknown - check manually in Ads Manager",
            recommendations: []
          };
          
          // Add recommendations based on findings
          if (campaign.status !== "ACTIVE" && campaign.status !== "PAUSED") {
            diagnostics.recommendations.push("Campaign status should be ACTIVE or PAUSED for ad set creation");
          }
          
          if (campaign.objective === "OUTCOME_SALES" || campaign.objective === "CONVERSIONS") {
            diagnostics.recommendations.push("Sales/conversion campaigns may require Facebook Pixel setup");
            diagnostics.recommendations.push("Consider using OFFSITE_CONVERSIONS optimization goal");
          }
          
          if (account.account_status !== "ACTIVE") {
            diagnostics.recommendations.push("Account must be in ACTIVE status for ad creation");
          }
          
          if (!diagnostics.has_payment_method) {
            diagnostics.recommendations.push("Add a payment method to the ad account");
          }
          
          diagnostics.recommendations.push("Wait 1-2 minutes after campaign creation before adding ad sets");
          diagnostics.recommendations.push("Start with simple targeting (just countries and age)");
          
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              success: true, 
              campaign_id,
              diagnostics,
              suggested_ad_set_config: {
                optimization_goal: campaign.objective === "OUTCOME_SALES" ? "OFFSITE_CONVERSIONS" : "LINK_CLICKS",
                billing_event: "LINK_CLICKS",
                daily_budget: 500, // $5 minimum
                targeting: {
                  geo_locations: { countries: ["US"] },
                  age_min: 25,
                  age_max: 65
                }
              }
            }, null, 2) }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: JSON.stringify({ 
              success: false, 
              error: error.message,
              campaign_id
            }, null, 2) }],
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
