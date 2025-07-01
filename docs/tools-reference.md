# Meta Marketing API MCP Server - Tools & Resources Reference

This document provides a comprehensive reference for all tools and resources available in the Meta Marketing API MCP Server.

## Table of Contents

- [Campaign Management Tools](#campaign-management-tools)
- [Analytics & Reporting Tools](#analytics--reporting-tools)
- [Audience Management Tools](#audience-management-tools)
- [Creative Management Tools](#creative-management-tools)
- [Utility Tools](#utility-tools)
- [MCP Resources](#mcp-resources)
- [Common Workflows](#common-workflows)
- [Diagnostic & Troubleshooting Tools](#diagnostic--troubleshooting-tools)

## Campaign Management Tools

### `list_campaigns`
List all campaigns in an ad account with filtering options.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `status` (optional): Filter by campaign status ('ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED')
- `limit` (optional): Number of campaigns to return (1-100, default: 25)
- `after` (optional): Pagination cursor for next page

**Example:**
```
List all active campaigns for account act_123456789
```

### `create_campaign`
Create a new advertising campaign.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `name` (required): Campaign name
- `objective` (required): Campaign objective (e.g., 'OUTCOME_TRAFFIC', 'OUTCOME_CONVERSIONS')
- `status` (optional): Initial status ('ACTIVE', 'PAUSED', default: 'PAUSED')
- `daily_budget` (optional): Daily budget in account currency cents
- `lifetime_budget` (optional): Lifetime budget in account currency cents
- `start_time` (optional): Campaign start time (ISO 8601 format)
- `stop_time` (optional): Campaign stop time (ISO 8601 format)

**Example:**
```
Create a new traffic campaign named "Summer Sale 2024" for account act_123456789 with a daily budget of $50
```

### `update_campaign`
Update an existing campaign's settings.

**Parameters:**
- `campaign_id` (required): Campaign ID to update
- `name` (optional): New campaign name
- `status` (optional): New status ('ACTIVE', 'PAUSED', 'ARCHIVED')
- `daily_budget` (optional): New daily budget in cents
- `lifetime_budget` (optional): New lifetime budget in cents
- `start_time` (optional): New start time
- `stop_time` (optional): New stop time

**Example:**
```
Update campaign 120212345678901234 to increase daily budget to $100
```

### `pause_campaign` / `resume_campaign`
Pause or resume a campaign.

**Parameters:**
- `campaign_id` (required): Campaign ID

**Example:**
```
Pause campaign 120212345678901234
Resume campaign 120212345678901234
```

### `delete_campaign`
Delete a campaign permanently.

**Parameters:**
- `campaign_id` (required): Campaign ID to delete

**Example:**
```
Delete campaign 120212345678901234
```

### `get_campaign`
Get detailed information about a specific campaign.

**Parameters:**
- `campaign_id` (required): Campaign ID

**Example:**
```
Get details for campaign 120212345678901234
```

### `list_ad_sets`
List ad sets within campaigns or accounts.

**Parameters:**
- `campaign_id` (optional): Filter by campaign ID
- `account_id` (optional): Filter by account ID
- `status` (optional): Filter by status
- `limit` (optional): Number of ad sets to return
- `after` (optional): Pagination cursor

**Example:**
```
List all ad sets for campaign 120212345678901234
```

### `create_ad_set`
Create a new ad set within a campaign.

**Parameters:**
- `campaign_id` (required): Parent campaign ID
- `name` (required): Ad set name
- `daily_budget` or `lifetime_budget` (required): Budget settings
- `optimization_goal` (required): Optimization goal (e.g., 'LINK_CLICKS', 'CONVERSIONS')
- `billing_event` (required): Billing event (e.g., 'LINK_CLICKS', 'IMPRESSIONS')
- `targeting` (optional): Targeting parameters
- `start_time` (optional): Start time
- `end_time` (optional): End time

**Example:**
```
Create an ad set for campaign 120212345678901234 targeting US adults aged 25-45 interested in fitness
```

### `list_ads`
List individual ads within ad sets, campaigns, or accounts.

**Parameters:**
- `adset_id` (optional): Filter by ad set ID
- `campaign_id` (optional): Filter by campaign ID
- `account_id` (optional): Filter by account ID
- `status` (optional): Filter by status
- `limit` (optional): Number of ads to return

**Example:**
```
List all ads in ad set 120212345678901234
```

## Analytics & Reporting Tools

### `get_insights`
Get performance insights for campaigns, ad sets, or ads.

**Parameters:**
- `object_id` (required): ID of object to get insights for
- `level` (required): Level of insights ('account', 'campaign', 'adset', 'ad')
- `date_preset` (optional): Date preset ('today', 'yesterday', 'last_7d', 'last_30d', etc.)
- `time_range` (optional): Custom date range with 'since' and 'until'
- `fields` (optional): Specific metrics to retrieve
- `breakdowns` (optional): Breakdown dimensions
- `limit` (optional): Number of results

**Example:**
```
Get last 30 days performance insights for campaign 120212345678901234
```

### `compare_performance`
Compare performance metrics across multiple campaigns, ad sets, or ads.

**Parameters:**
- `object_ids` (required): Array of object IDs to compare (2-10 items)
- `level` (required): Level of objects ('campaign', 'adset', 'ad')
- `date_preset` (optional): Date preset for comparison
- `time_range` (optional): Custom date range
- `metrics` (optional): Metrics to compare

**Example:**
```
Compare performance of campaigns 120212345678901234 and 120212345678901235 for the last 7 days
```

### `export_insights`
Export performance data in CSV or JSON format.

**Parameters:**
- `object_id` (required): ID of object to export insights for
- `level` (required): Level of insights
- `format` (optional): Export format ('csv', 'json', default: 'csv')
- `date_preset` (optional): Date preset
- `time_range` (optional): Custom date range
- `fields` (optional): Fields to export
- `breakdowns` (optional): Breakdowns to include

**Example:**
```
Export last 30 days campaign performance data as CSV for campaign 120212345678901234
```

### `get_campaign_performance`
Get simplified performance overview for a campaign.

**Parameters:**
- Same as `get_insights` but automatically sets level to 'campaign'

**Example:**
```
Get performance overview for campaign 120212345678901234
```

### `get_attribution_data`
Get attribution modeling data showing conversion paths.

**Parameters:**
- `object_id` (required): Campaign, ad set, or ad ID
- `level` (required): Analysis level
- `date_preset` (optional): Date preset
- `time_range` (optional): Custom date range

**Example:**
```
Get attribution data for campaign 120212345678901234 showing conversion paths
```

## Audience Management Tools

### `list_audiences`
List custom and lookalike audiences in an ad account.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `type` (optional): Filter by audience type ('custom', 'lookalike', 'saved')
- `limit` (optional): Number of audiences to return
- `after` (optional): Pagination cursor

**Example:**
```
List all custom audiences for account act_123456789
```

### `create_custom_audience`
Create a new custom audience.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `name` (required): Audience name
- `description` (optional): Audience description
- `subtype` (required): Audience subtype ('CUSTOM', 'WEBSITE', 'APP', etc.)
- `customer_file_source` (optional): Customer file source
- `retention_days` (optional): Data retention period
- `rule` (optional): Audience rule definition

**Example:**
```
Create a website custom audience named "Website Visitors - Last 30 Days" for account act_123456789
```

### `create_lookalike_audience`
Create a lookalike audience based on an existing custom audience.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `name` (required): Lookalike audience name
- `origin_audience_id` (required): Source custom audience ID
- `country` (required): Target country code
- `ratio` (required): Similarity ratio (0.01-0.2, i.e., 1%-20%)
- `description` (optional): Audience description

**Example:**
```
Create a 3% lookalike audience based on custom audience 12345 for the United States
```

### `estimate_audience_size`
Estimate the reach of targeting parameters.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `targeting` (required): Targeting parameters object
- `optimization_goal` (required): Optimization goal for the estimate

**Example:**
```
Estimate audience size for US adults aged 25-45 interested in fitness
```

## Creative Management Tools

### `list_creatives`
List all ad creatives in an ad account. Use this to see existing creatives, their formats, and content before creating new ones or reusing existing creatives.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `limit` (optional): Maximum number of creatives to return
- `after` (optional): Pagination cursor

**Returns:** List of creatives with details including name, title, body, image_url, call_to_action, and object_story_spec.

### `create_ad_creative`
Create a new ad creative with images, videos, text, and call-to-action buttons. Supports both image and video creatives with proper object_story_spec structure for Meta API compliance.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `name` (required): Creative name
- `page_id` (required): Facebook Page ID
- `headline` (optional): Ad headline text
- `message` (required): Primary ad text
- `picture` (optional): External image URL (fully supported)
- `video_id` (optional): Video ID for video creatives
- `call_to_action_type` (optional): CTA button type (LEARN_MORE, SHOP_NOW, etc.)
- `link_url` (required): Destination URL
- `description` (optional): Additional description text
- `instagram_actor_id` (optional): Instagram account ID
- `adlabels` (optional): Array of label names

**Returns:** Created creative details including ID and configuration.

### `validate_creative_setup`
Validate ad creative parameters before creation to catch errors early. Checks required fields, URL validity, and provides object_story_spec preview. Use this before create_ad_creative to avoid API errors.

**Parameters:** Same as create_ad_creative

**Returns:** Validation results with issues, warnings, recommendations, and object_story_spec preview.

### `validate_creative_enhanced`
Enhanced creative validation with comprehensive checks including page permissions, image accessibility, and Meta API compliance. Provides detailed feedback and fix suggestions.

**Parameters:** Same as create_ad_creative

**Returns:** Comprehensive validation report with:
- Status checks for required fields, media, URLs, permissions, and API compliance
- Detailed error messages and fix suggestions
- Overall readiness assessment
- object_story_spec preview

### `preview_ad`
Generate HTML preview of how an ad creative will appear in different placements and formats. Useful for testing creative appearance before launching campaigns.

**Parameters:**
- `creative_id` (required): Ad creative ID
- `ad_format` (required): Preview format
- `product_item_ids` (optional): Product IDs for dynamic ads

**Returns:** HTML preview of the creative.

### `get_creative_best_practices`
Get comprehensive best practices for creating high-performing ad creatives. Includes platform-specific guidelines, content recommendations, and optimization strategies.

**Parameters:** None

**Returns:** Detailed best practices guide including:
- Image and video technical specifications
- Design and content recommendations
- Platform-specific tips (Facebook, Instagram, Stories, Reels)
- Copy guidelines and CTA strategies
- Testing strategies and common mistakes to avoid

### `troubleshoot_creative_issues`
Diagnose and fix common creative creation and performance issues. Provide an error message or describe your issue to get specific solutions and recommendations.

**Parameters:**
- `issue_description` (required): Description of the issue or error message
- `creative_type` (optional): Type of creative (image, video, carousel, collection)

**Returns:** Troubleshooting guide with:
- Issue diagnosis
- Step-by-step solutions
- Prevention tips
- Related tools for further assistance

### `analyze_account_creatives`
Analyze all creatives in an account to identify patterns, performance insights, and optimization opportunities. Provides summary statistics and recommendations.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `limit` (optional): Maximum number of creatives to analyze (default: 50)

**Returns:** Comprehensive analysis including:
- Creative type distribution and usage patterns
- Content analysis (headline/message lengths, CTA usage)
- Optimization opportunities and recommendations
- Performance improvement suggestions

### `upload_creative_asset`
Get guidance on uploading creative assets (images/videos) to Meta. Provides step-by-step instructions and technical requirements for asset uploads.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `name` (required): Asset name

**Returns:** Upload guidance including steps, format requirements, and API endpoints.

### `setup_ab_test`
Get comprehensive guidance on setting up A/B tests for ad creatives. Provides best practices, testing strategies, and metrics to track for creative optimization.

**Parameters:**
- `account_id` (required): Meta Ad Account ID
- `name` (required): Test name

**Returns:** A/B testing setup guide including:
- Test setup steps and variables to test
- Best practices and metrics to track
- Testing recommendations for creative optimization

### `get_creative_performance`
Get guidance on analyzing creative performance metrics. Provides recommended approaches for tracking creative effectiveness and optimization strategies.

**Parameters:**
- `creative_id` (required): Creative ID to analyze

**Returns:** Performance analysis guidance and optimization tips.

## Utility Tools

### `get_ad_accounts`
List all accessible ad accounts.

**Parameters:** None

**Example:**
```
Show me all my Meta ad accounts
```

### `health_check`
Check the server health and connection status.

**Parameters:** None

**Example:**
```
Check the health of the Meta Marketing API server
```

### `get_capabilities`
Get detailed information about server capabilities and features.

**Parameters:** None

**Example:**
```
What are the capabilities of the Meta Marketing API server?
```

## MCP Resources

Resources provide structured data access through URI patterns:

### Campaign Resources
- `meta://campaigns/{account_id}` - Campaign overview for an account
- `meta://campaign/{campaign_id}` - Detailed campaign information
- `meta://campaign-status/{account_id}` - Campaign status breakdown
- `meta://adsets/{campaign_id}` - Ad sets within a campaign

### Insights Resources
- `meta://insights/campaign/{campaign_id}` - Campaign performance data
- `meta://insights/account/{account_id}` - Account performance dashboard
- `meta://insights/compare/{object_ids}` - Performance comparison
- `meta://insights/trends/{object_id}/{days}` - Daily performance trends

### Audience Resources
- `meta://audiences/{account_id}` - Audience overview
- `meta://audience-performance/{account_id}` - Audience performance analysis
- `meta://targeting-insights/{account_id}` - Targeting recommendations
- `meta://audience-health/{account_id}` - Audience health report

## Common Workflows

### Campaign Creation Workflow
1. `get_ad_accounts` - Find your account ID
2. `create_campaign` - Create the campaign
3. `create_ad_set` - Add targeting and budget
4. `create_ad_creative` - Design your ad
5. `get_insights` - Monitor performance

### Performance Analysis Workflow
1. `list_campaigns` - Find campaigns to analyze
2. `get_insights` - Get performance data
3. `compare_performance` - Compare multiple campaigns
4. `export_insights` - Export data for further analysis

### Audience Building Workflow
1. `list_audiences` - Review existing audiences
2. `create_custom_audience` - Create source audience
3. `create_lookalike_audience` - Scale with lookalikes
4. `estimate_audience_size` - Validate targeting reach

### Optimization Workflow
1. Access `meta://insights/account/{account_id}` - Review dashboard
2. `compare_performance` - Identify top performers
3. `update_campaign` - Adjust budgets based on performance
4. `pause_campaign` - Stop underperforming campaigns

## Error Handling

All tools provide structured error responses with:
- Error type and message
- Suggested solutions
- Relevant documentation links
- Rate limit information when applicable

Common error types:
- **Authentication errors**: Invalid or expired access tokens
- **Permission errors**: Insufficient permissions for the operation
- **Rate limit errors**: API quota exceeded
- **Validation errors**: Invalid parameters or data
- **Not found errors**: Requested resource doesn't exist

## Rate Limits

The server automatically handles Meta's rate limiting:
- **Development tier**: 60 points per account per 5 minutes
- **Standard tier**: 9000 points per account per 5 minutes
- **Read operations**: 1 point each
- **Write operations**: 3 points each

The server will automatically retry with exponential backoff when rate limits are hit.

## Key Changes from Previous Version

1. **Added required `page_id` field**: All ad creatives now require a Facebook Page ID
2. **Updated call-to-action structure**: CTAs now use proper enum values and structured value objects
3. **Enhanced validation**: Better error checking and user-friendly feedback
4. **Added validation tool**: Pre-creation validation to catch issues early
5. **Improved object_story_spec construction**: Better alignment with Meta's API requirements

## Best Practices

1. **Always validate first**: Use `validate_creative_setup` before `create_ad_creative`
2. **Include meaningful content**: Add both title and body for better performance
3. **Use appropriate CTAs**: Match call-to-action type to your campaign objective
4. **Test image URLs**: Ensure image URLs are accessible and point to valid images
5. **Consider cross-posting**: Use `instagram_actor_id` for Instagram integration

## Common Issues and Solutions

### Missing page_id
**Error**: "Missing page_id: Facebook Page ID is required for object_story_spec"
**Solution**: Provide a valid Facebook Page ID that your account has access to

### Invalid call_to_action type
**Error**: "Invalid call_to_action type: XYZ"
**Solution**: Use one of the supported CTA types: LEARN_MORE, SHOP_NOW, SIGN_UP, etc.

### Missing media
**Error**: "Missing media: Either image_url or video_id must be provided"
**Solution**: Provide either a valid image URL or video ID

### Invalid URLs
**Error**: "Invalid image_url: Must be a valid URL"
**Solution**: Ensure URLs are properly formatted and accessible

## Diagnostic & Troubleshooting Tools

### `verify_account_setup`
Verify that an ad account has all necessary components for ad creation.

**Parameters:**
- `account_id` (required): Meta Ad Account ID to verify

**Example:**
```
Verify setup for account act_123456789
```

**Response includes:**
- Account access status
- Payment method configuration
- Campaign count
- Setup recommendations and warnings

### `check_campaign_readiness`
Check if a campaign is ready for ad set creation and get specific requirements.

**Parameters:**
- `campaign_id` (required): Campaign ID to check

**Example:**
```
Check readiness for campaign 120228246450490163
```

**Response includes:**
- Campaign status and objective
- Required setup items
- Recommended optimization goals and billing events
- Minimum budget suggestions

### `get_meta_api_reference`
Get reference information for Meta Marketing API parameters.

**Parameters:** None

**Example:**
```
Get Meta API parameter reference
```

**Response includes:**
- Valid optimization goals and billing events
- Compatible parameter combinations
- Campaign objective requirements
- Troubleshooting tips for common errors

### `get_quick_fixes`
Get specific fix suggestions for common Meta Ads API errors.

**Parameters:**
- `error_message` (required): The error message you received

**Example:**
```
Get quick fixes for "Invalid parameter" error
```

**Response includes:**
- Likely causes of the error
- Specific fix suggestions
- Next steps to resolve the issue
- Parameter recommendations

### `list_campaign_ad_sets`
List all ad sets within a specific campaign to understand structure.

**Parameters:**
- `campaign_id` (required): Campaign ID to list ad sets for

**Example:**
```
List ad sets for campaign 120228246450490163
```

**Response includes:**
- All ad sets in the campaign
- Status and budget information
- Summary statistics
- Targeting information

### `create_ad_set_enhanced`
Enhanced ad set creation with better validation and error messages.

**Parameters:** Same as `create_ad_set` but with improved validation

**Example:**
```
Create enhanced ad set with campaign_id 120228246450490163
```

**Features:**
- Pre-creation validation
- Better error messages with specific guidance
- Automatic parameter compatibility checking
- Objective-specific recommendations

## Usage Recommendations

### Before Creating Ad Sets:
1. Run `verify_account_setup` to check overall readiness
2. Run `check_campaign_readiness` for the target campaign
3. Use `get_meta_api_reference` if you need parameter guidance
4. Use `create_ad_set_enhanced` instead of `create_ad_set` for better error handling

### When You Get Errors:
1. Copy the error message
2. Run `get_quick_fixes` with the error message
3. Follow the suggested fixes
4. Use `get_meta_api_reference` for valid parameter combinations

### For Debugging:
1. Use `list_campaign_ad_sets` to see existing structure
2. Use `verify_account_setup` to check permissions
3. Use `check_campaign_readiness` to verify campaign status

### Creative Workflow Recommendations

1. **Before Creating Creatives:**
   - Use `get_creative_best_practices` to understand requirements
   - Use `validate_creative_enhanced` to check parameters
   - Use `analyze_account_creatives` to understand existing patterns

2. **Creative Creation:**
   - Use `create_ad_creative` with validated parameters
   - Use `preview_ad` to test appearance
   - Use `troubleshoot_creative_issues` if errors occur

3. **Performance Optimization:**
   - Use `setup_ab_test` for systematic testing
   - Use `get_creative_performance` for analysis guidance
   - Use `analyze_account_creatives` for bulk insights
