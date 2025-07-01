"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadImageFromUrlSchema = exports.CreativeValidationEnhancedSchema = exports.AnalyzeCreativesSchema = exports.TroubleshootCreativeSchema = exports.PreviewAdSchema = exports.CreateAdCreativeSchema = exports.ListCreativesSchema = exports.GenerateSystemTokenSchema = exports.RefreshTokenSchema = exports.ExchangeCodeSchema = exports.GenerateAuthUrlSchema = exports.EstimateAudienceSizeSchema = exports.CreateLookalikeAudienceSchema = exports.CreateCustomAudienceSchema = exports.ListAudiencesSchema = exports.ExportInsightsSchema = exports.ComparePerformanceSchema = exports.GetInsightsSchema = exports.CreateAdSetSchema = exports.ListAdSetsSchema = exports.DeleteCampaignSchema = exports.UpdateCampaignSchema = exports.CreateCampaignSchema = exports.ListCampaignsSchema = void 0;
var zod_1 = require("zod");
// Campaign Management Schemas
exports.ListCampaignsSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    status: zod_1.z
        .enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"])
        .optional()
        .describe("Filter by campaign status"),
    limit: zod_1.z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Number of campaigns to return"),
    after: zod_1.z.string().optional().describe("Pagination cursor for next page"),
});
exports.CreateCampaignSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    name: zod_1.z.string().min(1).describe("Campaign name"),
    objective: zod_1.z
        .enum([
        "OUTCOME_APP_PROMOTION",
        "OUTCOME_AWARENESS",
        "OUTCOME_ENGAGEMENT",
        "OUTCOME_LEADS",
        "OUTCOME_SALES",
        "OUTCOME_TRAFFIC",
    ])
        .describe("Campaign objective using Outcome-Driven Ad Experience (ODAE) format"),
    status: zod_1.z
        .enum(["ACTIVE", "PAUSED"])
        .default("PAUSED")
        .describe("Initial campaign status"),
    daily_budget: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("Daily budget in account currency cents"),
    lifetime_budget: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("Lifetime budget in account currency cents"),
    start_time: zod_1.z
        .string()
        .optional()
        .describe("Campaign start time (ISO 8601 format)"),
    stop_time: zod_1.z
        .string()
        .optional()
        .describe("Campaign stop time (ISO 8601 format)"),
    special_ad_categories: zod_1.z
        .array(zod_1.z.enum([
        "NONE",
        "EMPLOYMENT",
        "HOUSING",
        "CREDIT",
        "SOCIAL_ISSUES_ELECTIONS_POLITICS",
    ]))
        .optional()
        .describe("Special ad categories for regulated industries (required for legal, financial services, etc.)"),
    bid_strategy: zod_1.z
        .enum(["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP", "COST_CAP"])
        .optional()
        .describe("Bid strategy for the campaign"),
    bid_cap: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("Bid cap amount in account currency cents (required for LOWEST_COST_WITH_BID_CAP)"),
    budget_optimization: zod_1.z
        .boolean()
        .optional()
        .describe("Enable campaign budget optimization across ad sets"),
});
exports.UpdateCampaignSchema = zod_1.z.object({
    campaign_id: zod_1.z.string().describe("Campaign ID to update"),
    name: zod_1.z.string().optional().describe("New campaign name"),
    status: zod_1.z
        .enum(["ACTIVE", "PAUSED", "ARCHIVED"])
        .optional()
        .describe("New campaign status"),
    daily_budget: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("New daily budget in account currency cents"),
    lifetime_budget: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("New lifetime budget in account currency cents"),
    start_time: zod_1.z
        .string()
        .optional()
        .describe("New campaign start time (ISO 8601 format)"),
    stop_time: zod_1.z
        .string()
        .optional()
        .describe("New campaign stop time (ISO 8601 format)"),
});
exports.DeleteCampaignSchema = zod_1.z.object({
    campaign_id: zod_1.z.string().describe("Campaign ID to delete"),
});
// Ad Set Management Schemas
exports.ListAdSetsSchema = zod_1.z.object({
    campaign_id: zod_1.z.string().optional().describe("Filter by campaign ID"),
    account_id: zod_1.z.string().optional().describe("Filter by account ID"),
    status: zod_1.z
        .enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"])
        .optional()
        .describe("Filter by ad set status"),
    limit: zod_1.z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Number of ad sets to return"),
    after: zod_1.z.string().optional().describe("Pagination cursor for next page"),
});
exports.CreateAdSetSchema = zod_1.z.object({
    campaign_id: zod_1.z.string().describe("Campaign ID for the ad set"),
    name: zod_1.z.string().min(1).describe("Ad set name"),
    daily_budget: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("Daily budget in account currency cents"),
    lifetime_budget: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("Lifetime budget in account currency cents"),
    optimization_goal: zod_1.z
        .string()
        .describe("Optimization goal (e.g., LINK_CLICKS, CONVERSIONS)"),
    billing_event: zod_1.z
        .string()
        .describe("Billing event (e.g., LINK_CLICKS, IMPRESSIONS)"),
    bid_amount: zod_1.z
        .number()
        .positive()
        .optional()
        .describe("Bid amount in account currency cents"),
    start_time: zod_1.z
        .string()
        .optional()
        .describe("Ad set start time (ISO 8601 format)"),
    end_time: zod_1.z.string().optional().describe("Ad set end time (ISO 8601 format)"),
    promoted_object: zod_1.z
        .object({
        page_id: zod_1.z.string().optional().describe("Facebook Page ID to promote"),
        pixel_id: zod_1.z
            .string()
            .optional()
            .describe("Facebook Pixel ID for tracking"),
        application_id: zod_1.z
            .string()
            .optional()
            .describe("Application ID for app promotion"),
        object_store_url: zod_1.z
            .string()
            .optional()
            .describe("App store URL for app promotion"),
        custom_event_type: zod_1.z
            .string()
            .optional()
            .describe("Custom event type for conversion tracking"),
    })
        .optional()
        .describe("Object being promoted - required for certain campaign objectives like OUTCOME_TRAFFIC"),
    attribution_spec: zod_1.z
        .array(zod_1.z.object({
        event_type: zod_1.z
            .enum(["CLICK_THROUGH", "VIEW_THROUGH"])
            .default("CLICK_THROUGH"),
        window_days: zod_1.z.number().min(1).max(90).default(1),
    }))
        .default([{ event_type: "CLICK_THROUGH", window_days: 1 }])
        .describe("Attribution specification for tracking conversions - REQUIRED by Meta API"),
    destination_type: zod_1.z
        .enum([
        "WEBSITE",
        "ON_AD",
        "FACEBOOK",
        "INSTAGRAM",
        "MESSENGER",
        "WHATSAPP",
        "UNDEFINED",
    ])
        .default("UNDEFINED")
        .describe("Destination type for traffic campaigns - REQUIRED"),
    is_dynamic_creative: zod_1.z
        .boolean()
        .default(false)
        .describe("Whether to use dynamic creative optimization - REQUIRED"),
    use_new_app_click: zod_1.z
        .boolean()
        .default(false)
        .describe("Whether to use new app click attribution - REQUIRED"),
    configured_status: zod_1.z
        .enum(["ACTIVE", "PAUSED"])
        .default("PAUSED")
        .describe("Configured status field - REQUIRED by Meta API"),
    optimization_sub_event: zod_1.z
        .enum([
        "NONE",
        "VIDEO_PLAY",
        "APP_INSTALL",
        "LINK_CLICK",
        "LEAD_GROUPED",
        "PURCHASE",
    ])
        .default("NONE")
        .describe("Optimization sub-event - REQUIRED by Meta API"),
    recurring_budget_semantics: zod_1.z
        .boolean()
        .default(false)
        .describe("Recurring budget semantics - REQUIRED by Meta API"),
    targeting: zod_1.z
        .object({
        age_min: zod_1.z
            .number()
            .min(13)
            .max(65)
            .optional()
            .describe("Minimum age for targeting"),
        age_max: zod_1.z
            .number()
            .min(13)
            .max(65)
            .optional()
            .describe("Maximum age for targeting"),
        genders: zod_1.z
            .array(zod_1.z.number().min(1).max(2))
            .optional()
            .describe("Gender targeting (1=male, 2=female)"),
        geo_locations: zod_1.z
            .object({
            countries: zod_1.z
                .array(zod_1.z.string())
                .optional()
                .describe("Country codes for targeting"),
            location_types: zod_1.z
                .array(zod_1.z.enum(["home", "recent"]))
                .default(["home", "recent"])
                .describe("Location types for targeting - REQUIRED by Meta API"),
            regions: zod_1.z
                .array(zod_1.z.object({ key: zod_1.z.string() }))
                .optional()
                .describe("Region targeting"),
            cities: zod_1.z
                .array(zod_1.z.object({
                key: zod_1.z.string(),
                radius: zod_1.z.number().optional(),
                distance_unit: zod_1.z.enum(["mile", "kilometer"]).optional(),
            }))
                .optional()
                .describe("City targeting with optional radius"),
        })
            .optional()
            .describe("Geographic targeting"),
        interests: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string().optional(),
        }))
            .optional()
            .describe("Interest targeting"),
        behaviors: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string().optional(),
        }))
            .optional()
            .describe("Behavior targeting"),
        custom_audiences: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe("Custom audience IDs"),
        lookalike_audiences: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe("Lookalike audience IDs"),
        device_platforms: zod_1.z
            .array(zod_1.z.enum(["mobile", "desktop"]))
            .optional()
            .describe("Device platform targeting"),
        publisher_platforms: zod_1.z
            .array(zod_1.z.enum(["facebook", "instagram", "messenger", "whatsapp"]))
            .optional()
            .describe("Publisher platform targeting"),
        targeting_optimization: zod_1.z
            .enum(["none", "expansion_all"])
            .default("none")
            .describe("Targeting optimization setting - REQUIRED by Meta API"),
        brand_safety_content_filter_levels: zod_1.z
            .array(zod_1.z.enum(["FACEBOOK_STANDARD", "AN_STANDARD", "RESTRICTIVE"]))
            .default(["FACEBOOK_STANDARD"])
            .describe("Brand safety content filter levels - REQUIRED by Meta API"),
    })
        .default({
        geo_locations: {
            countries: ["US"],
            location_types: ["home", "recent"],
        },
        targeting_optimization: "none",
        brand_safety_content_filter_levels: ["FACEBOOK_STANDARD"],
    })
        .describe("Targeting parameters - defaults to US if not specified"),
    status: zod_1.z
        .enum(["ACTIVE", "PAUSED"])
        .default("PAUSED")
        .describe("Initial ad set status"),
});
// Analytics Schemas
exports.GetInsightsSchema = zod_1.z.object({
    object_id: zod_1.z
        .string()
        .describe("ID of campaign, ad set, or ad to get insights for"),
    level: zod_1.z
        .enum(["account", "campaign", "adset", "ad"])
        .describe("Level of insights to retrieve"),
    date_preset: zod_1.z
        .enum([
        "today",
        "yesterday",
        "this_week",
        "last_week",
        "this_month",
        "last_month",
        "this_quarter",
        "last_quarter",
        "this_year",
        "last_year",
        "lifetime",
    ])
        .optional()
        .describe("Date preset for insights"),
    time_range: zod_1.z
        .object({
        since: zod_1.z.string().describe("Start date (YYYY-MM-DD)"),
        until: zod_1.z.string().describe("End date (YYYY-MM-DD)"),
    })
        .optional()
        .describe("Custom date range for insights"),
    fields: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe("Specific fields to retrieve (e.g., impressions, clicks, spend)"),
    breakdowns: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe("Breakdown dimensions (e.g., age, gender, placement)"),
    limit: zod_1.z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Number of insights to return"),
});
exports.ComparePerformanceSchema = zod_1.z.object({
    object_ids: zod_1.z
        .array(zod_1.z.string())
        .min(2)
        .max(10)
        .describe("IDs of campaigns/ad sets/ads to compare"),
    level: zod_1.z
        .enum(["campaign", "adset", "ad"])
        .describe("Level of objects being compared"),
    date_preset: zod_1.z
        .enum([
        "today",
        "yesterday",
        "this_week",
        "last_week",
        "this_month",
        "last_month",
        "this_quarter",
        "last_quarter",
        "this_year",
        "last_year",
        "lifetime",
    ])
        .optional()
        .describe("Date preset for comparison"),
    time_range: zod_1.z
        .object({
        since: zod_1.z.string().describe("Start date (YYYY-MM-DD)"),
        until: zod_1.z.string().describe("End date (YYYY-MM-DD)"),
    })
        .optional()
        .describe("Custom date range for comparison"),
    metrics: zod_1.z
        .array(zod_1.z.string())
        .default(["impressions", "clicks", "spend", "ctr", "cpc"])
        .describe("Metrics to compare"),
});
exports.ExportInsightsSchema = zod_1.z.object({
    object_id: zod_1.z
        .string()
        .describe("ID of campaign, ad set, or ad to export insights for"),
    level: zod_1.z
        .enum(["account", "campaign", "adset", "ad"])
        .describe("Level of insights to export"),
    format: zod_1.z.enum(["csv", "json"]).default("csv").describe("Export format"),
    date_preset: zod_1.z
        .enum([
        "today",
        "yesterday",
        "this_week",
        "last_week",
        "this_month",
        "last_month",
        "this_quarter",
        "last_quarter",
        "this_year",
        "last_year",
        "lifetime",
    ])
        .optional()
        .describe("Date preset for export"),
    time_range: zod_1.z
        .object({
        since: zod_1.z.string().describe("Start date (YYYY-MM-DD)"),
        until: zod_1.z.string().describe("End date (YYYY-MM-DD)"),
    })
        .optional()
        .describe("Custom date range for export"),
    fields: zod_1.z.array(zod_1.z.string()).optional().describe("Specific fields to export"),
    breakdowns: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe("Breakdown dimensions to include"),
});
// Audience Management Schemas
exports.ListAudiencesSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    type: zod_1.z
        .enum(["custom", "lookalike", "saved"])
        .optional()
        .describe("Filter by audience type"),
    limit: zod_1.z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Number of audiences to return"),
    after: zod_1.z.string().optional().describe("Pagination cursor for next page"),
});
exports.CreateCustomAudienceSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    name: zod_1.z.string().min(1).describe("Custom audience name"),
    description: zod_1.z.string().optional().describe("Custom audience description"),
    subtype: zod_1.z
        .enum([
        "CUSTOM",
        "WEBSITE",
        "APP",
        "OFFLINE_CONVERSION",
        "CLAIM",
        "PARTNER",
        "VIDEO",
        "BAG_OF_ACCOUNTS",
        "STUDY_RULE_AUDIENCE",
        "FOX",
    ])
        .describe("Custom audience subtype"),
    customer_file_source: zod_1.z
        .enum([
        "USER_PROVIDED_ONLY",
        "PARTNER_PROVIDED_ONLY",
        "BOTH_USER_AND_PARTNER_PROVIDED",
    ])
        .optional()
        .describe("Customer file source"),
    retention_days: zod_1.z
        .number()
        .min(1)
        .max(180)
        .optional()
        .describe("Retention days for the audience"),
    rule: zod_1.z
        .any()
        .optional()
        .describe("Rule definition for the audience (depends on subtype)"),
});
exports.CreateLookalikeAudienceSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    name: zod_1.z.string().min(1).describe("Lookalike audience name"),
    origin_audience_id: zod_1.z.string().describe("ID of the source custom audience"),
    country: zod_1.z.string().describe("Country code for the lookalike audience"),
    ratio: zod_1.z
        .number()
        .min(0.01)
        .max(0.2)
        .describe("Ratio of the population to target (0.01 = 1%, 0.2 = 20%)"),
    description: zod_1.z.string().optional().describe("Lookalike audience description"),
});
exports.EstimateAudienceSizeSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    targeting: zod_1.z
        .object({
        age_min: zod_1.z
            .number()
            .min(13)
            .max(65)
            .optional()
            .describe("Minimum age for targeting"),
        age_max: zod_1.z
            .number()
            .min(13)
            .max(65)
            .optional()
            .describe("Maximum age for targeting"),
        genders: zod_1.z
            .array(zod_1.z.number().min(1).max(2))
            .optional()
            .describe("Gender targeting (1=male, 2=female)"),
        geo_locations: zod_1.z
            .object({
            countries: zod_1.z
                .array(zod_1.z.string())
                .optional()
                .describe("Country codes for targeting"),
            regions: zod_1.z
                .array(zod_1.z.object({ key: zod_1.z.string() }))
                .optional()
                .describe("Region targeting"),
            cities: zod_1.z
                .array(zod_1.z.object({
                key: zod_1.z.string(),
                radius: zod_1.z.number().optional(),
                distance_unit: zod_1.z.enum(["mile", "kilometer"]).optional(),
            }))
                .optional()
                .describe("City targeting with optional radius"),
        })
            .optional()
            .describe("Geographic targeting"),
        interests: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string().optional(),
        }))
            .optional()
            .describe("Interest targeting"),
        behaviors: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string().optional(),
        }))
            .optional()
            .describe("Behavior targeting"),
        custom_audiences: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe("Custom audience IDs"),
        lookalike_audiences: zod_1.z
            .array(zod_1.z.string())
            .optional()
            .describe("Lookalike audience IDs"),
    })
        .describe("Targeting parameters for size estimation"),
    optimization_goal: zod_1.z.string().describe("Optimization goal for the estimate"),
});
// OAuth Tool Schemas
exports.GenerateAuthUrlSchema = zod_1.z.object({
    scopes: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .default(["ads_management"])
        .describe("OAuth scopes to request"),
    state: zod_1.z.string().optional().describe("State parameter for security"),
});
exports.ExchangeCodeSchema = zod_1.z.object({
    code: zod_1.z.string().describe("Authorization code from OAuth redirect"),
});
exports.RefreshTokenSchema = zod_1.z.object({
    short_lived_token: zod_1.z
        .string()
        .optional()
        .describe("Short-lived token to exchange (optional, uses current if not provided)"),
});
exports.GenerateSystemTokenSchema = zod_1.z.object({
    system_user_id: zod_1.z.string().describe("System user ID"),
    scopes: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .default(["ads_management"])
        .describe("Scopes for the system user token"),
    expiring_token: zod_1.z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to generate an expiring token (60 days) or non-expiring"),
});
// Creative Management Schemas
exports.ListCreativesSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    limit: zod_1.z
        .number()
        .min(1)
        .max(100)
        .default(25)
        .describe("Number of creatives to return"),
    after: zod_1.z.string().optional().describe("Pagination cursor for next page"),
});
exports.CreateAdCreativeSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    name: zod_1.z.string().min(1).describe("Creative name"),
    page_id: zod_1.z
        .string()
        .describe("Facebook Page ID (required for object_story_spec)"),
    message: zod_1.z.string().describe("Primary ad text/message"),
    headline: zod_1.z.string().optional().describe("Ad title/headline"),
    picture: zod_1.z
        .string()
        .url()
        .optional()
        .describe("External image URL - must be publicly accessible"),
    image_hash: zod_1.z
        .string()
        .optional()
        .describe("Pre-uploaded image hash (alternative to picture URL)"),
    video_id: zod_1.z.string().optional().describe("Video ID for video creatives"),
    call_to_action_type: zod_1.z
        .enum([
        "LEARN_MORE",
        "SHOP_NOW",
        "SIGN_UP",
        "DOWNLOAD",
        "BOOK_TRAVEL",
        "LISTEN_MUSIC",
        "WATCH_VIDEO",
        "GET_QUOTE",
        "CONTACT_US",
        "APPLY_NOW",
        "GET_DIRECTIONS",
        "CALL_NOW",
        "MESSAGE_PAGE",
        "SUBSCRIBE",
        "BOOK_NOW",
        "ORDER_NOW",
        "DONATE_NOW",
        "SAY_THANKS",
        "SELL_NOW",
        "SHARE",
        "OPEN_LINK",
        "LIKE_PAGE",
        "FOLLOW_PAGE",
        "FOLLOW_USER",
        "REQUEST_TIME",
        "VISIT_PAGES_FEED",
        "USE_APP",
        "PLAY_GAME",
        "INSTALL_APP",
        "USE_MOBILE_APP",
        "INSTALL_MOBILE_APP",
        "OPEN_MOVIES",
        "AUDIO_CALL",
        "VIDEO_CALL",
        "GET_OFFER",
        "GET_OFFER_VIEW",
        "BUY_NOW",
        "ADD_TO_CART",
        "SELL",
        "GIFT_WRAP",
        "MAKE_AN_OFFER",
    ])
        .optional()
        .describe("Call to action button type (40+ supported types)"),
    link_url: zod_1.z
        .string()
        .url()
        .describe("Destination URL where users will be directed when clicking the ad"),
    description: zod_1.z.string().optional().describe("Additional description text"),
    instagram_actor_id: zod_1.z
        .string()
        .optional()
        .describe("Instagram account ID for cross-posting"),
    adlabels: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe("Ad labels for organization and tracking"),
    // v23.0 Standard Enhancements (new structure)
    enable_standard_enhancements: zod_1.z
        .boolean()
        .optional()
        .default(false)
        .describe("Enable v23.0 Standard Enhancements with individual feature control"),
    enhancement_features: zod_1.z
        .object({
        enhance_cta: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe("Enhance call-to-action buttons"),
        image_brightness_and_contrast: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe("Auto-adjust image brightness and contrast"),
        text_improvements: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe("Improve ad text readability"),
        image_templates: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe("Apply image templates and frames"),
    })
        .optional()
        .describe("Individual enhancement features for v23.0 compliance"),
    attachment_style: zod_1.z
        .enum(["link", "album"])
        .optional()
        .default("link")
        .describe("Attachment style for link ads"),
    caption: zod_1.z
        .string()
        .optional()
        .describe("Caption text (typically domain name)"),
});
exports.PreviewAdSchema = zod_1.z.object({
    creative_id: zod_1.z.string().describe("Creative ID to preview"),
    ad_format: zod_1.z
        .enum([
        "DESKTOP_FEED_STANDARD",
        "MOBILE_FEED_STANDARD",
        "MOBILE_FEED_BASIC",
        "MOBILE_BANNER",
        "MOBILE_MEDIUM_RECTANGLE",
        "MOBILE_FULLWIDTH",
        "MOBILE_INTERSTITIAL",
        "INSTAGRAM_STANDARD",
        "INSTAGRAM_STORY",
    ])
        .describe("Ad format for preview"),
    product_item_ids: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe("Product item IDs for dynamic ads"),
});
// Enhanced Creative Tool Schemas
exports.TroubleshootCreativeSchema = zod_1.z.object({
    issue_description: zod_1.z
        .string()
        .min(5)
        .describe("Describe the creative issue you're experiencing or paste the error message"),
    creative_type: zod_1.z
        .enum(["image", "video", "carousel", "collection"])
        .optional()
        .describe("Type of creative experiencing issues"),
});
exports.AnalyzeCreativesSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID to analyze"),
    limit: zod_1.z
        .number()
        .min(1)
        .max(100)
        .default(50)
        .describe("Maximum number of creatives to analyze"),
});
exports.CreativeValidationEnhancedSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID"),
    name: zod_1.z.string().min(1).describe("Creative name"),
    page_id: zod_1.z
        .string()
        .describe("Facebook Page ID (required for object_story_spec)"),
    message: zod_1.z.string().describe("Primary ad text/message"),
    headline: zod_1.z.string().optional().describe("Ad title/headline"),
    picture: zod_1.z
        .string()
        .url()
        .optional()
        .describe("External image URL - must be publicly accessible"),
    image_hash: zod_1.z
        .string()
        .optional()
        .describe("Pre-uploaded image hash (alternative to picture URL)"),
    video_id: zod_1.z.string().optional().describe("Video ID for video creatives"),
    call_to_action_type: zod_1.z
        .enum([
        "LEARN_MORE",
        "SHOP_NOW",
        "SIGN_UP",
        "DOWNLOAD",
        "BOOK_TRAVEL",
        "LISTEN_MUSIC",
        "WATCH_VIDEO",
        "GET_QUOTE",
        "CONTACT_US",
        "APPLY_NOW",
        "GET_DIRECTIONS",
        "CALL_NOW",
        "MESSAGE_PAGE",
        "SUBSCRIBE",
        "BOOK_NOW",
        "ORDER_NOW",
        "DONATE_NOW",
        "SAY_THANKS",
        "SELL_NOW",
        "SHARE",
        "OPEN_LINK",
        "LIKE_PAGE",
        "FOLLOW_PAGE",
        "FOLLOW_USER",
        "REQUEST_TIME",
        "VISIT_PAGES_FEED",
        "USE_APP",
        "PLAY_GAME",
        "INSTALL_APP",
        "USE_MOBILE_APP",
        "INSTALL_MOBILE_APP",
        "OPEN_MOVIES",
        "AUDIO_CALL",
        "VIDEO_CALL",
        "GET_OFFER",
        "GET_OFFER_VIEW",
        "BUY_NOW",
        "ADD_TO_CART",
        "SELL",
        "GIFT_WRAP",
        "MAKE_AN_OFFER",
    ])
        .optional()
        .describe("Call to action button type (40+ supported types)"),
    link_url: zod_1.z
        .string()
        .url()
        .optional()
        .describe("Destination URL where users will be directed when clicking the ad"),
    description: zod_1.z.string().optional().describe("Additional description text"),
    instagram_actor_id: zod_1.z
        .string()
        .optional()
        .describe("Instagram account ID for cross-posting"),
    adlabels: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe("Ad labels for organization and tracking"),
    enable_standard_enhancements: zod_1.z
        .boolean()
        .optional()
        .default(false)
        .describe("Enable v23.0 Standard Enhancements with individual feature control"),
    enhancement_features: zod_1.z
        .object({
        enhance_cta: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe("Enhance call-to-action buttons"),
        image_brightness_and_contrast: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe("Auto-adjust image brightness and contrast"),
        text_improvements: zod_1.z
            .boolean()
            .optional()
            .default(true)
            .describe("Improve ad text readability"),
        image_templates: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe("Apply image templates and frames"),
    })
        .optional()
        .describe("Individual enhancement features for v23.0 compliance"),
    attachment_style: zod_1.z
        .enum(["link", "album"])
        .optional()
        .default("link")
        .describe("Attachment style for link ads"),
    caption: zod_1.z
        .string()
        .optional()
        .describe("Caption text (typically domain name)"),
});
// Upload Image from URL Schema
exports.UploadImageFromUrlSchema = zod_1.z.object({
    account_id: zod_1.z.string().describe("Meta Ad Account ID (with act_ prefix)"),
    image_url: zod_1.z
        .string()
        .url()
        .describe("URL of the image to download and upload to Meta"),
    image_name: zod_1.z
        .string()
        .optional()
        .describe("Optional custom name for the uploaded image"),
});
