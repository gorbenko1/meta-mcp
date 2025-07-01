import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MetaApiClient } from "../meta-client.js";
import {
  ListCreativesSchema,
  CreateAdCreativeSchema,
  PreviewAdSchema,
} from "../types/mcp-tools.js";

export function registerCreativeTools(
  server: McpServer,
  metaClient: MetaApiClient
) {
  // List Creatives Tool
  server.tool(
    "list_creatives",
    ListCreativesSchema.shape,
    async ({ account_id, limit, after }) => {
      try {
        const result = await metaClient.getAdCreatives(account_id, {
          limit,
          after,
        });

        const creatives = result.data.map((creative) => ({
          id: creative.id,
          name: creative.name,
          title: creative.title,
          body: creative.body,
          image_url: creative.image_url,
          video_id: creative.video_id,
          call_to_action: creative.call_to_action,
          object_story_spec: creative.object_story_spec,
          url_tags: creative.url_tags,
        }));

        const response = {
          creatives,
          pagination: {
            has_next_page: result.hasNextPage,
            has_previous_page: result.hasPreviousPage,
            next_cursor: result.paging?.cursors?.after,
            previous_cursor: result.paging?.cursors?.before,
          },
          total_count: creatives.length,
          account_id,
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
              text: `Error listing creatives: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create Ad Creative Tool
  server.tool(
    "create_ad_creative",
    CreateAdCreativeSchema.shape,
    async ({
      account_id,
      name,
      page_id,
      headline,
      message,
      picture,
      video_id,
      call_to_action_type,
      link_url,
      description,
      instagram_actor_id,
      adlabels,
    }) => {
      try {
        console.log("=== CREATE AD CREATIVE DEBUG ===");
        console.log("Input parameters:", {
          account_id,
          name,
          page_id,
          headline,
          message,
          picture,
          video_id,
          call_to_action_type,
          link_url,
          description,
          instagram_actor_id,
          adlabels,
        });

        // Validate that we have either an image or video
        if (!picture && !video_id) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Either picture (image URL) or video_id must be provided for the creative",
              },
            ],
            isError: true,
          };
        }

        // Construct the proper object_story_spec for Meta API
        const object_story_spec: any = {
          page_id: page_id, // Required for most creative types
        };

        // For link ads with external images
        if (link_url || picture) {
          object_story_spec.link_data = {};

          if (link_url) {
            object_story_spec.link_data.link = link_url;
          }

          if (picture) {
            object_story_spec.link_data.picture = picture;
          }

          if (message) {
            object_story_spec.link_data.message = message;
          }

          if (headline) {
            object_story_spec.link_data.name = headline;
          }

          if (description) {
            object_story_spec.link_data.description = description;
          }

          if (call_to_action_type) {
            object_story_spec.link_data.call_to_action = {
              type: call_to_action_type,
            };
          }
        }

        // For video creatives
        if (video_id) {
          object_story_spec.video_data = {
            video_id: video_id,
          };

          if (message) {
            object_story_spec.video_data.message = message;
          }

          if (headline) {
            object_story_spec.video_data.title = headline;
          }

          if (call_to_action_type) {
            object_story_spec.video_data.call_to_action = {
              type: call_to_action_type,
            };
          }
        }

        // Add Instagram actor if provided
        if (instagram_actor_id) {
          object_story_spec.instagram_actor_id = instagram_actor_id;
        }

        const creativeData: any = {
          name,
          object_story_spec,
        };

        // Add ad labels if provided
        if (adlabels && adlabels.length > 0) {
          creativeData.adlabels = adlabels.map((label) => ({ name: label }));
        }

        console.log(
          "Constructed object_story_spec:",
          JSON.stringify(object_story_spec, null, 2)
        );
        console.log(
          "Final creative data:",
          JSON.stringify(creativeData, null, 2)
        );

        const result = await metaClient.createAdCreative(
          account_id,
          creativeData
        );

        console.log("API Response:", JSON.stringify(result, null, 2));
        console.log("================================");

        const response = {
          success: true,
          creative_id: result.id,
          message: `Ad creative "${name}" created successfully`,
          details: {
            id: result.id,
            name,
            page_id,
            headline,
            message,
            picture,
            video_id,
            call_to_action_type,
            link_url,
            account_id,
            instagram_actor_id,
          },
          next_steps: [
            "Use this creative in ad creation",
            "Preview the creative across different placements",
            "Test different variations for A/B testing",
          ],
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
        console.log("=== CREATE AD CREATIVE ERROR ===");
        console.log("Error object:", error);

        if (error instanceof Error) {
          console.log("Error message:", error.message);

          // Try to parse Meta API error response
          try {
            const errorData = JSON.parse(error.message);
            console.log(
              "Parsed Meta API error:",
              JSON.stringify(errorData, null, 2)
            );

            if (errorData.error) {
              console.log("Meta API Error Details:");
              console.log("- Message:", errorData.error.message);
              console.log("- Code:", errorData.error.code);
              console.log("- Type:", errorData.error.type);
              console.log("- Error Subcode:", errorData.error.error_subcode);
              console.log("- FBTrace ID:", errorData.error.fbtrace_id);

              if (errorData.error.error_data) {
                console.log(
                  "- Error Data:",
                  JSON.stringify(errorData.error.error_data, null, 2)
                );
              }

              if (errorData.error.error_user_title) {
                console.log("- User Title:", errorData.error.error_user_title);
              }

              if (errorData.error.error_user_msg) {
                console.log("- User Message:", errorData.error.error_user_msg);
              }
            }
          } catch (parseError) {
            console.log(
              "Could not parse error as JSON, raw message:",
              error.message
            );
          }
        }
        console.log("===============================");

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Error creating ad creative: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Validate Creative Setup Tool
  server.tool(
    "validate_creative_setup",
    CreateAdCreativeSchema.shape,
    async ({
      account_id,
      name,
      page_id,
      headline,
      message,
      picture,
      video_id,
      call_to_action_type,
      link_url,
      description,
    }) => {
      try {
        const validationResults = {
          account_id,
          name,
          is_valid: true,
          issues: [] as string[],
          warnings: [] as string[],
          recommendations: [] as string[],
          requirements_check: {
            has_media: false,
            has_page_id: false,
            has_name: false,
            has_content: false,
            call_to_action_valid: true,
            urls_valid: true,
          },
        };

        // Check required fields
        if (!page_id) {
          validationResults.issues.push(
            "Missing page_id: Facebook Page ID is required for object_story_spec"
          );
          validationResults.is_valid = false;
        } else {
          validationResults.requirements_check.has_page_id = true;
        }

        if (!name || name.trim().length === 0) {
          validationResults.issues.push(
            "Missing or empty name: Creative name is required"
          );
          validationResults.is_valid = false;
        } else {
          validationResults.requirements_check.has_name = true;
        }

        // Check media requirements
        if (!picture && !video_id) {
          validationResults.issues.push(
            "Missing media: Either picture (image URL) or video_id must be provided"
          );
          validationResults.is_valid = false;
        } else {
          validationResults.requirements_check.has_media = true;
        }

        // Check content
        if (!message && !headline) {
          validationResults.warnings.push(
            "No content provided: Consider adding headline or message text for better performance"
          );
        } else {
          validationResults.requirements_check.has_content = true;
        }

        // Validate call to action type
        if (call_to_action_type) {
          const validCTATypes = [
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
          ];

          if (!validCTATypes.includes(call_to_action_type)) {
            validationResults.issues.push(
              `Invalid call_to_action_type: ${call_to_action_type}. Must be one of: ${validCTATypes.join(
                ", "
              )}`
            );
            validationResults.is_valid = false;
            validationResults.requirements_check.call_to_action_valid = false;
          }
        }

        // URL validation
        if (picture) {
          try {
            new URL(picture);
          } catch {
            validationResults.issues.push(
              "Invalid picture URL: Must be a valid URL"
            );
            validationResults.is_valid = false;
            validationResults.requirements_check.urls_valid = false;
          }
        }

        if (link_url) {
          try {
            new URL(link_url);
          } catch {
            validationResults.issues.push(
              "Invalid link_url: Must be a valid URL"
            );
            validationResults.is_valid = false;
            validationResults.requirements_check.urls_valid = false;
          }
        }

        // Add recommendations
        if (!headline && message) {
          validationResults.recommendations.push(
            "Consider adding a headline for better ad performance"
          );
        }

        if (!call_to_action_type && link_url) {
          validationResults.recommendations.push(
            "Consider adding a call-to-action button when using a destination URL"
          );
        }

        if (picture && video_id) {
          validationResults.recommendations.push(
            "Both image and video provided - video will take precedence in creative"
          );
        }

        if (!description && link_url) {
          validationResults.recommendations.push(
            "Consider adding a description for better user experience"
          );
        }

        // Object story spec preview
        const object_story_spec_preview: any = {
          page_id: page_id,
        };

        if (link_url || picture) {
          object_story_spec_preview.link_data = {};
          if (link_url) object_story_spec_preview.link_data.link = link_url;
          if (picture) object_story_spec_preview.link_data.picture = picture;
          if (message) object_story_spec_preview.link_data.message = message;
          if (headline) object_story_spec_preview.link_data.name = headline;
          if (description)
            object_story_spec_preview.link_data.description = description;
          if (call_to_action_type) {
            object_story_spec_preview.link_data.call_to_action = {
              type: call_to_action_type,
            };
          }
        }

        if (video_id) {
          object_story_spec_preview.video_data = {
            video_id: video_id,
          };
          if (message) object_story_spec_preview.video_data.message = message;
          if (headline) object_story_spec_preview.video_data.title = headline;
          if (call_to_action_type) {
            object_story_spec_preview.video_data.call_to_action = {
              type: call_to_action_type,
            };
          }
        }

        validationResults.object_story_spec_preview = object_story_spec_preview;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validationResults, null, 2),
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
              text: `Error validating creative setup: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Preview Ad Tool
  server.tool(
    "preview_ad",
    PreviewAdSchema.shape,
    async ({ creative_id, ad_format, product_item_ids }) => {
      try {
        const result = await metaClient.generateAdPreview(
          creative_id,
          ad_format,
          product_item_ids
        );

        const response = {
          success: true,
          creative_id,
          ad_format,
          preview_html: result.body,
          product_item_ids,
          notes: [
            "The preview shows how the ad will appear in the selected format",
            "Different placements may render the creative differently",
            "Test across multiple formats to ensure optimal display",
          ],
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
              text: `Error generating ad preview: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Upload Creative Asset Tool (simplified - would need actual file upload)
  server.tool(
    "upload_creative_asset",
    CreateAdCreativeSchema.shape,
    async ({ account_id, name }) => {
      try {
        const response = {
          message: "Creative asset upload process",
          account_id,
          asset_name: name,
          upload_steps: [
            "1. Use Meta Business Manager to upload images/videos",
            "2. Get the asset URL or video ID",
            "3. Use create_ad_creative with the asset URL/ID",
            "4. Preview the creative before using in ads",
          ],
          supported_formats: {
            images: ["JPG", "PNG", "GIF"],
            videos: ["MP4", "MOV", "AVI"],
            requirements: {
              image_max_size: "30MB",
              video_max_size: "4GB",
              image_min_resolution: "600x600px",
              video_min_resolution: "720p",
            },
          },
          api_endpoints: {
            image_upload: "Use Graph API /adimages endpoint",
            video_upload: "Use Graph API /advideos endpoint",
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
        return {
          content: [
            {
              type: "text",
              text: `Error with asset upload process: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Setup A/B Test Tool
  server.tool(
    "setup_ab_test",
    CreateAdCreativeSchema.shape,
    async ({ account_id, name }) => {
      try {
        const response = {
          message: "A/B testing setup for creatives",
          test_name: name,
          account_id,
          test_setup_steps: [
            "1. Create multiple creative variations",
            "2. Set up identical ad sets with different creatives",
            "3. Use the same targeting and budget for each variation",
            "4. Run the test for at least 3-7 days",
            "5. Analyze performance metrics to determine winner",
          ],
          recommended_test_variables: [
            "Headlines and ad copy",
            "Images or videos",
            "Call-to-action buttons",
            "Ad formats (single image vs carousel)",
            "Color schemes and visual elements",
          ],
          testing_best_practices: [
            "Test one variable at a time for clear results",
            "Ensure statistical significance before declaring a winner",
            "Account for day-of-week and time-of-day variations",
            "Use Facebook's built-in A/B testing tools when possible",
          ],
          metrics_to_track: [
            "Click-through rate (CTR)",
            "Cost per click (CPC)",
            "Conversion rate",
            "Cost per conversion",
            "Relevance score",
          ],
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
              text: `Error setting up A/B test: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Get Creative Performance Tool
  server.tool(
    "get_creative_performance",
    PreviewAdSchema.shape,
    async ({ creative_id }) => {
      try {
        // This would typically fetch insights for ads using this creative
        // For now, we'll provide a structure showing what performance data is available

        const response = {
          creative_id,
          performance_note:
            "Creative performance requires analyzing ads that use this creative",
          recommended_approach: [
            "1. Find ads using this creative with list_ads tool",
            "2. Get insights for those ads using get_insights tool",
            "3. Compare performance across different placements",
            "4. Analyze engagement metrics specific to the creative",
          ],
          key_metrics_to_analyze: [
            "Click-through rate (CTR) - indicates creative appeal",
            "Cost per click (CPC) - shows efficiency",
            "Engagement rate - measures audience interaction",
            "Conversion rate - tracks business impact",
            "Frequency - monitors ad fatigue",
          ],
          creative_optimization_tips: [
            "Monitor frequency to avoid ad fatigue",
            "Test different call-to-action buttons",
            "Analyze performance by placement",
            "Consider seasonal or trending content",
            "Use dynamic creative optimization when possible",
          ],
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
              text: `Error getting creative performance: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Update Creative Tool
  server.tool(
    "update_creative",
    CreateAdCreativeSchema.shape,
    async (_params) => {
      // Note: These variables would be used in actual implementation
      // const { name, title, body } = _params;
      try {
        const response = {
          message: "Creative update limitations",
          important_note:
            "Ad creatives cannot be modified once created in Meta's system",
          explanation:
            "This is by design to maintain ad performance data integrity",
          recommended_approach: [
            "1. Create a new creative with the desired changes",
            "2. Update existing ads to use the new creative",
            "3. Archive the old creative if no longer needed",
            "4. Compare performance between old and new creatives",
          ],
          updatable_elements: {
            ad_level: [
              "Link URL (in ad, not creative)",
              "Headline (in ad copy, not creative)",
              "Description (in ad copy, not creative)",
            ],
            campaign_level: [
              "Budget and schedule",
              "Targeting parameters",
              "Optimization goals",
            ],
          },
          creative_versioning_tip:
            "Use descriptive naming conventions to track creative versions",
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
              text: `Error updating creative: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Delete Creative Tool
  server.tool("delete_creative", PreviewAdSchema.shape, async (params) => {
    const { creative_id } = params;
    try {
      // Note: This would require actual deletion logic
      const response = {
        creative_id,
        warning: "Deleting a creative will affect all ads using it",
        pre_deletion_checks: [
          "Verify no active ads are using this creative",
          "Consider pausing ads instead of deleting creative",
          "Export performance data before deletion",
          "Archive creative for future reference",
        ],
        deletion_impact: [
          "All ads using this creative will stop serving",
          "Historical performance data will be preserved",
          "Creative cannot be recovered once deleted",
          "Campaign performance may be affected",
        ],
        safer_alternatives: [
          "Pause ads using the creative instead",
          "Create new creatives and migrate ads",
          "Use creative archiving for organization",
        ],
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
            text: `Error deleting creative: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });
}
