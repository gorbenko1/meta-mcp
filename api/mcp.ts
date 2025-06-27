import { createMcpHandler } from '@vercel/mcp-adapter';
import { MetaApiClient } from '../src/meta-client.js';
import { UserAuthManager } from '../src/utils/user-auth.js';
import { registerCampaignTools } from '../src/tools/campaigns.js';
import { registerAnalyticsTools } from '../src/tools/analytics.js';
import { registerAudienceTools } from '../src/tools/audiences.js';
import { registerCreativeTools } from '../src/tools/creatives.js';
import { registerOAuthTools } from '../src/tools/oauth.js';
import { registerCampaignResources } from '../src/resources/campaigns.js';
import { registerInsightsResources } from '../src/resources/insights.js';
import { registerAudienceResources } from '../src/resources/audiences.js';

const handler = createMcpHandler(
  async (server, { request }) => {
    // Authenticate user from request headers
    const authHeader = request?.headers?.get?.('authorization') || 
                      request?.headers?.authorization;
    
    const user = await UserAuthManager.authenticateUser(authHeader);
    
    if (!user) {
      throw new Error("Authentication required: Please login with your Meta account to use this MCP server");
    }

    // Create user-specific AuthManager
    const auth = await UserAuthManager.createUserAuthManager(user.userId);
    
    if (!auth) {
      throw new Error("Failed to initialize user authentication: Token may be expired or invalid");
    }

    // Validate and refresh token if needed
    try {
      await auth.refreshTokenIfNeeded();
    } catch (error) {
      console.error("Token validation failed for user:", user.userId, error);
      throw new Error("Authentication failed: Your Meta token is invalid or expired. Please re-authenticate.");
    }

    // Initialize Meta API client with user's tokens
    const metaClient = new MetaApiClient(auth);

    // Register all tools
    registerCampaignTools(server, metaClient);
    registerAnalyticsTools(server, metaClient);
    registerAudienceTools(server, metaClient);
    registerCreativeTools(server, metaClient);
    registerOAuthTools(server, auth);

    // Register all resources
    registerCampaignResources(server, metaClient);
    registerInsightsResources(server, metaClient);
    registerAudienceResources(server, metaClient);

    // Add account discovery tool
    server.tool("get_ad_accounts", {}, async () => {
      try {
        const accounts = await metaClient.getAdAccounts();

        const accountsData = accounts.map((account) => ({
          id: account.id,
          name: account.name,
          account_status: account.account_status,
          currency: account.currency,
          timezone_name: account.timezone_name,
          balance: account.balance,
          business: account.business
            ? {
                id: account.business.id,
                name: account.business.name,
              }
            : null,
        }));

        const response = {
          success: true,
          accounts: accountsData,
          total_accounts: accountsData.length,
          message: "Ad accounts retrieved successfully",
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error getting ad accounts: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Add server health check tool
    server.tool("health_check", {}, async () => {
      try {
        const accounts = await metaClient.getAdAccounts();
        const response = {
          status: "healthy",
          server_name: "Meta Marketing API Server (Multi-User)",
          version: "1.1.0",
          timestamp: new Date().toISOString(),
          meta_api_connection: "connected",
          accessible_accounts: accounts.length,
          rate_limit_status: "operational",
          deployment: "vercel",
          authentication: "oauth_required",
          user: {
            id: user.userId,
            name: user.name,
            email: user.email,
            metaUserId: user.metaUserId,
            lastUsed: user.lastUsed,
          },
          features: {
            campaign_management: true,
            analytics_reporting: true,
            audience_management: true,
            creative_management: true,
            real_time_insights: true,
            multi_user_support: true,
            oauth_authentication: true,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        const response = {
          status: "unhealthy",
          server_name: "Meta Marketing API Server (Multi-User)",
          version: "1.1.0",
          timestamp: new Date().toISOString(),
          error: errorMessage,
          meta_api_connection: "failed",
          deployment: "vercel",
          authentication: "oauth_required",
          user: {
            id: user.userId,
            name: user.name,
            email: user.email,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
          isError: true,
        };
      }
    });

    // Add server capabilities info
    server.tool("get_capabilities", {}, async () => {
      const capabilities = {
        server_info: {
          name: "Meta Marketing API Server (Multi-User)",
          version: "1.1.0",
          deployment: "vercel",
          authentication: "oauth_required",
          description:
            "Secure multi-user MCP server providing access to Meta Marketing API for campaign management, analytics, and audience targeting. Each user authenticates with their own Meta account.",
        },
        current_user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          metaUserId: user.metaUserId,
          connectedAt: user.createdAt,
          lastUsed: user.lastUsed,
        },
        api_coverage: {
          campaigns: {
            description: "Full campaign lifecycle management",
            operations: [
              "create",
              "read",
              "update",
              "delete",
              "pause",
              "resume",
            ],
            supported_objectives: [
              "OUTCOME_APP_PROMOTION",
              "OUTCOME_AWARENESS",
              "OUTCOME_ENGAGEMENT",
              "OUTCOME_LEADS",
              "OUTCOME_SALES",
              "OUTCOME_TRAFFIC",
            ],
          },
          ad_sets: {
            description: "Ad set management and targeting",
            operations: ["create", "read", "update", "list"],
            targeting_options: [
              "demographics",
              "interests",
              "behaviors",
              "custom_audiences",
              "lookalike_audiences",
              "geographic",
            ],
          },
          ads: {
            description: "Individual ad management",
            operations: ["create", "read", "update", "list"],
            supported_formats: [
              "single_image",
              "carousel",
              "video",
              "collection",
            ],
          },
          insights: {
            description: "Performance analytics and reporting",
            metrics: [
              "impressions",
              "clicks",
              "spend",
              "reach",
              "frequency",
              "ctr",
              "cpc",
              "cpm",
              "conversions",
            ],
            breakdowns: ["age", "gender", "placement", "device", "country"],
            date_ranges: [
              "today",
              "yesterday",
              "last_7d",
              "last_30d",
              "last_90d",
              "custom",
            ],
          },
          audiences: {
            description: "Custom and lookalike audience management",
            types: ["custom", "lookalike", "website", "app", "offline"],
            operations: ["create", "read", "update", "delete", "estimate_size"],
          },
          creatives: {
            description: "Ad creative management and testing",
            operations: ["create", "read", "preview", "ab_test_setup"],
            formats: ["image", "video", "carousel", "collection"],
          },
        },
        tools_available: [
          // Campaign tools
          "list_campaigns",
          "create_campaign",
          "update_campaign",
          "delete_campaign",
          "pause_campaign",
          "resume_campaign",
          "get_campaign",
          // Ad set tools
          "list_ad_sets",
          "create_ad_set",
          // Ad tools
          "list_ads",
          // Analytics tools
          "get_insights",
          "compare_performance",
          "export_insights",
          "get_campaign_performance",
          "get_attribution_data",
          // Audience tools
          "list_audiences",
          "create_custom_audience",
          "create_lookalike_audience",
          "estimate_audience_size",
          // Creative tools
          "list_creatives",
          "create_ad_creative",
          "preview_ad",
          "setup_ab_test",
          // OAuth tools
          "generate_auth_url",
          "exchange_code_for_token",
          "refresh_to_long_lived_token",
          "generate_system_user_token",
          "get_token_info",
          "validate_token",
          // Utility tools
          "get_ad_accounts",
          "health_check",
          "get_capabilities",
        ],
        resources_available: [
          "meta://campaigns/{account_id}",
          "meta://campaign/{campaign_id}",
          "meta://campaign-status/{account_id}",
          "meta://adsets/{campaign_id}",
          "meta://insights/campaign/{campaign_id}",
          "meta://insights/account/{account_id}",
          "meta://insights/compare/{object_ids}",
          "meta://insights/trends/{object_id}/{days}",
          "meta://audiences/{account_id}",
          "meta://audience-performance/{account_id}",
          "meta://targeting-insights/{account_id}",
          "meta://audience-health/{account_id}",
        ],
        rate_limits: {
          development_tier: {
            max_score: 60,
            decay_time: "5 minutes",
            block_time: "5 minutes",
          },
          standard_tier: {
            max_score: 9000,
            decay_time: "5 minutes",
            block_time: "1 minute",
          },
          scoring: {
            read_calls: 1,
            write_calls: 3,
          },
        },
        authentication: {
          type: "oauth_required",
          provider: "meta_marketing_api",
          flow: "authorization_code_with_pkce",
          endpoints: {
            login: "/api/auth/login",
            callback: "/api/auth/callback",
            profile: "/api/auth/profile",
            logout: "/api/auth/logout",
          },
          required_scopes: [
            "ads_management",
            "ads_read", 
            "business_management",
            "read_insights"
          ],
          token_management: {
            storage: "secure_kv_store",
            refresh: "automatic",
            expiration_handling: "automatic_refresh",
            revocation: "supported",
          },
          security_features: {
            csrf_protection: true,
            secure_cookies: true,
            jwt_sessions: true,
            per_user_isolation: true,
          },
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(capabilities, null, 2),
          },
        ],
      };
    });
  },
  {
    serverName: process.env.MCP_SERVER_NAME || "Meta Marketing API Server",
    serverVersion: "1.1.0",
  },
  { basePath: '/api' }
);

export { handler as GET, handler as POST, handler as DELETE };