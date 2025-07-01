"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCreativeTools = registerCreativeTools;
var mcp_tools_js_1 = require("../types/mcp-tools.js");
function registerCreativeTools(server, metaClient) {
    var _this = this;
    // List Creatives Tool
    server.tool("list_creatives", "List all ad creatives in an ad account. Use this to see existing creatives, their formats, and content before creating new ones or reusing existing creatives.", mcp_tools_js_1.ListCreativesSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var result, creatives, response, error_1, errorMessage;
        var _c, _d, _e, _f;
        var account_id = _b.account_id, limit = _b.limit, after = _b.after;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, metaClient.getAdCreatives(account_id, {
                            limit: limit,
                            after: after,
                        })];
                case 1:
                    result = _g.sent();
                    creatives = result.data.map(function (creative) { return ({
                        id: creative.id,
                        name: creative.name,
                        title: creative.title,
                        body: creative.body,
                        image_url: creative.image_url,
                        video_id: creative.video_id,
                        call_to_action: creative.call_to_action,
                        object_story_spec: creative.object_story_spec,
                        url_tags: creative.url_tags,
                    }); });
                    response = {
                        creatives: creatives,
                        pagination: {
                            has_next_page: result.hasNextPage,
                            has_previous_page: result.hasPreviousPage,
                            next_cursor: (_d = (_c = result.paging) === null || _c === void 0 ? void 0 : _c.cursors) === null || _d === void 0 ? void 0 : _d.after,
                            previous_cursor: (_f = (_e = result.paging) === null || _e === void 0 ? void 0 : _e.cursors) === null || _f === void 0 ? void 0 : _f.before,
                        },
                        total_count: creatives.length,
                        account_id: account_id,
                    };
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(response, null, 2),
                                },
                            ],
                        }];
                case 2:
                    error_1 = _g.sent();
                    errorMessage = error_1 instanceof Error ? error_1.message : "Unknown error occurred";
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error listing creatives: ".concat(errorMessage),
                                },
                            ],
                            isError: true,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Create Ad Creative Tool
    server.tool("create_ad_creative", "Create a new ad creative with images, videos, text, and call-to-action buttons. Supports both image and video creatives with proper object_story_spec structure for Meta API compliance.", mcp_tools_js_1.CreateAdCreativeSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var object_story_spec, creativeData, result, response, error_2, errorData, specificGuidance, enhancedErrorMessage, errorMessage;
        var account_id = _b.account_id, name = _b.name, page_id = _b.page_id, headline = _b.headline, message = _b.message, picture = _b.picture, image_hash = _b.image_hash, video_id = _b.video_id, call_to_action_type = _b.call_to_action_type, link_url = _b.link_url, description = _b.description, instagram_actor_id = _b.instagram_actor_id, adlabels = _b.adlabels, enable_standard_enhancements = _b.enable_standard_enhancements, enhancement_features = _b.enhancement_features, attachment_style = _b.attachment_style, caption = _b.caption;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    console.log("=== CREATE AD CREATIVE DEBUG (v23.0) ===");
                    console.log("Input parameters:", {
                        account_id: account_id,
                        name: name,
                        page_id: page_id,
                        headline: headline,
                        message: message,
                        picture: picture,
                        image_hash: image_hash,
                        video_id: video_id,
                        call_to_action_type: call_to_action_type,
                        link_url: link_url,
                        description: description,
                        instagram_actor_id: instagram_actor_id,
                        adlabels: adlabels,
                        enable_standard_enhancements: enable_standard_enhancements,
                        enhancement_features: enhancement_features,
                        attachment_style: attachment_style,
                        caption: caption,
                    });
                    // Validate account ID format (must include "act_" prefix)
                    if (!account_id.startsWith("act_")) {
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: "Error (Meta API Code 100, Subcode 33): Invalid account ID format. Must include \"act_\" prefix. Use \"act_".concat(account_id, "\" instead of \"").concat(account_id, "\"."),
                                    },
                                ],
                                isError: true,
                            }];
                    }
                    // Validate that we have either an image (URL or hash) or video
                    if (!picture && !image_hash && !video_id) {
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: "Error: Either picture (image URL), image_hash (pre-uploaded image), or video_id must be provided for the creative",
                                    },
                                ],
                                isError: true,
                            }];
                    }
                    // Validate image vs hash usage
                    if (picture && image_hash) {
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: "Error: Cannot use both picture (external URL) and image_hash (uploaded image). Choose one method.",
                                    },
                                ],
                                isError: true,
                            }];
                    }
                    object_story_spec = {
                        page_id: page_id, // Required for most creative types
                    };
                    // For link ads with external images or uploaded images
                    if (link_url || picture || image_hash) {
                        object_story_spec.link_data = {
                            attachment_style: attachment_style || "link",
                        };
                        if (link_url) {
                            object_story_spec.link_data.link = link_url;
                        }
                        // Use either external image URL or uploaded image hash
                        if (picture) {
                            object_story_spec.link_data.picture = picture;
                        }
                        else if (image_hash) {
                            object_story_spec.link_data.image_hash = image_hash;
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
                        if (caption) {
                            object_story_spec.link_data.caption = caption;
                        }
                        // v23.0 Call-to-action structure with proper value object
                        if (call_to_action_type) {
                            object_story_spec.link_data.call_to_action = {
                                type: call_to_action_type,
                                value: {
                                    link: link_url,
                                    link_format: "WEBSITE_LINK",
                                },
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
                                value: {
                                    link: link_url,
                                    link_format: "WEBSITE_LINK",
                                },
                            };
                        }
                    }
                    // Add Instagram actor if provided
                    if (instagram_actor_id) {
                        object_story_spec.instagram_actor_id = instagram_actor_id;
                    }
                    creativeData = {
                        name: name,
                        object_story_spec: object_story_spec,
                    };
                    // Add v23.0 Standard Enhancements with new structure
                    if (enable_standard_enhancements && enhancement_features) {
                        creativeData.degrees_of_freedom_spec = {
                            creative_features_spec: {},
                        };
                        if (enhancement_features.enhance_cta) {
                            creativeData.degrees_of_freedom_spec.creative_features_spec.enhance_cta =
                                {
                                    enroll_status: "OPT_IN",
                                };
                        }
                        if (enhancement_features.image_brightness_and_contrast) {
                            creativeData.degrees_of_freedom_spec.creative_features_spec.image_brightness_and_contrast =
                                {
                                    enroll_status: "OPT_IN",
                                };
                        }
                        if (enhancement_features.text_improvements) {
                            creativeData.degrees_of_freedom_spec.creative_features_spec.text_improvements =
                                {
                                    enroll_status: "OPT_IN",
                                };
                        }
                        if (enhancement_features.image_templates) {
                            creativeData.degrees_of_freedom_spec.creative_features_spec.image_templates =
                                {
                                    enroll_status: "OPT_IN",
                                };
                        }
                    }
                    // Add ad labels if provided
                    if (adlabels && adlabels.length > 0) {
                        creativeData.adlabels = adlabels.map(function (label) { return ({ name: label }); });
                    }
                    console.log("Constructed object_story_spec:", JSON.stringify(object_story_spec, null, 2));
                    console.log("Final creative data (v23.0):", JSON.stringify(creativeData, null, 2));
                    return [4 /*yield*/, metaClient.createAdCreative(account_id, creativeData)];
                case 1:
                    result = _c.sent();
                    console.log("API Response:", JSON.stringify(result, null, 2));
                    console.log("================================");
                    response = {
                        success: true,
                        creative_id: result.id,
                        message: "Ad creative \"".concat(name, "\" created successfully with v23.0 features"),
                        api_version: "v23.0",
                        details: {
                            id: result.id,
                            name: name,
                            page_id: page_id,
                            headline: headline,
                            message: message,
                            picture: picture,
                            image_hash: image_hash,
                            video_id: video_id,
                            call_to_action_type: call_to_action_type,
                            link_url: link_url,
                            account_id: account_id,
                            instagram_actor_id: instagram_actor_id,
                            v22_enhancements: enable_standard_enhancements,
                            enhancement_features: enhancement_features,
                        },
                        next_steps: [
                            "Use this creative in ad creation",
                            "Preview the creative across different placements",
                            "Test different variations for A/B testing",
                            enable_standard_enhancements
                                ? "Monitor enhancement performance in Meta Ads Manager"
                                : "Consider enabling Standard Enhancements for better performance",
                        ],
                    };
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(response, null, 2),
                                },
                            ],
                        }];
                case 2:
                    error_2 = _c.sent();
                    console.log("=== CREATE AD CREATIVE ERROR (v23.0) ===");
                    console.log("Error object:", error_2);
                    if (error_2 instanceof Error) {
                        console.log("Error message:", error_2.message);
                        // Enhanced error handling for v23.0 specific errors
                        try {
                            errorData = JSON.parse(error_2.message);
                            console.log("Parsed Meta API error:", JSON.stringify(errorData, null, 2));
                            if (errorData.error) {
                                console.log("Meta API Error Details:");
                                console.log("- Message:", errorData.error.message);
                                console.log("- Code:", errorData.error.code);
                                console.log("- Type:", errorData.error.type);
                                console.log("- Error Subcode:", errorData.error.error_subcode);
                                console.log("- FBTrace ID:", errorData.error.fbtrace_id);
                                specificGuidance = "";
                                if (errorData.error.code === 100) {
                                    switch (errorData.error.error_subcode) {
                                        case 33:
                                            specificGuidance =
                                                "Account access issue. Verify your account ID includes 'act_' prefix and you have proper permissions.";
                                            break;
                                        case 1443048:
                                            specificGuidance =
                                                "object_story_spec validation failed. Ensure page_id is correct and all required fields are provided.";
                                            break;
                                        case 3858082:
                                            specificGuidance =
                                                "Standard Enhancements error. For v23.0, use individual feature controls instead of the legacy bundle approach.";
                                            break;
                                        default:
                                            specificGuidance =
                                                "Parameter validation error. Check all required fields and data formats.";
                                    }
                                }
                                if (errorData.error.error_data) {
                                    console.log("- Error Data:", JSON.stringify(errorData.error.error_data, null, 2));
                                }
                                if (errorData.error.error_user_title) {
                                    console.log("- User Title:", errorData.error.error_user_title);
                                }
                                if (errorData.error.error_user_msg) {
                                    console.log("- User Message:", errorData.error.error_user_msg);
                                }
                                if (specificGuidance) {
                                    console.log("- Specific Guidance:", specificGuidance);
                                }
                                enhancedErrorMessage = specificGuidance
                                    ? "".concat(errorData.error.message, "\n\nSpecific Guidance: ").concat(specificGuidance, "\n\nFBTrace ID: ").concat(errorData.error.fbtrace_id)
                                    : errorData.error.message;
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: "text",
                                                text: "Error creating ad creative (Meta API v23.0): ".concat(enhancedErrorMessage),
                                            },
                                        ],
                                        isError: true,
                                    }];
                            }
                        }
                        catch (parseError) {
                            console.log("Could not parse error as JSON, raw message:", error_2.message);
                        }
                    }
                    console.log("===============================");
                    errorMessage = error_2 instanceof Error ? error_2.message : "Unknown error occurred";
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error creating ad creative: ".concat(errorMessage),
                                },
                            ],
                            isError: true,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Validate Creative Setup Tool
    server.tool("validate_creative_setup", "Validate ad creative parameters before creation to catch errors early. Checks required fields, URL validity, and provides object_story_spec preview. Use this before create_ad_creative to avoid API errors.", mcp_tools_js_1.CreateAdCreativeSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var validationResults, validCTATypes, object_story_spec_preview, errorMessage;
        var account_id = _b.account_id, name = _b.name, page_id = _b.page_id, headline = _b.headline, message = _b.message, picture = _b.picture, video_id = _b.video_id, call_to_action_type = _b.call_to_action_type, link_url = _b.link_url, description = _b.description;
        return __generator(this, function (_c) {
            try {
                validationResults = {
                    account_id: account_id,
                    name: name,
                    is_valid: true,
                    issues: [],
                    warnings: [],
                    recommendations: [],
                    requirements_check: {
                        has_media: false,
                        has_page_id: false,
                        has_name: false,
                        has_content: false,
                        call_to_action_valid: true,
                        urls_valid: true,
                    },
                    object_story_spec_preview: {},
                };
                // Check required fields
                if (!page_id) {
                    validationResults.issues.push("Missing page_id: Facebook Page ID is required for object_story_spec");
                    validationResults.is_valid = false;
                }
                else {
                    validationResults.requirements_check.has_page_id = true;
                }
                if (!name || name.trim().length === 0) {
                    validationResults.issues.push("Missing or empty name: Creative name is required");
                    validationResults.is_valid = false;
                }
                else {
                    validationResults.requirements_check.has_name = true;
                }
                // Check media requirements
                if (!picture && !video_id) {
                    validationResults.issues.push("Missing media: Either picture (image URL) or video_id must be provided");
                    validationResults.is_valid = false;
                }
                else {
                    validationResults.requirements_check.has_media = true;
                }
                // Check content
                if (!message && !headline) {
                    validationResults.warnings.push("No content provided: Consider adding headline or message text for better performance");
                }
                else {
                    validationResults.requirements_check.has_content = true;
                }
                // Validate call to action type
                if (call_to_action_type) {
                    validCTATypes = [
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
                        validationResults.issues.push("Invalid call_to_action_type: ".concat(call_to_action_type, ". Must be one of: ").concat(validCTATypes.join(", ")));
                        validationResults.is_valid = false;
                        validationResults.requirements_check.call_to_action_valid = false;
                    }
                }
                // URL validation
                if (picture) {
                    try {
                        new URL(picture);
                    }
                    catch (_d) {
                        validationResults.issues.push("Invalid picture URL: Must be a valid URL");
                        validationResults.is_valid = false;
                        validationResults.requirements_check.urls_valid = false;
                    }
                }
                if (link_url) {
                    try {
                        new URL(link_url);
                    }
                    catch (_e) {
                        validationResults.issues.push("Invalid link_url: Must be a valid URL");
                        validationResults.is_valid = false;
                        validationResults.requirements_check.urls_valid = false;
                    }
                }
                // Add recommendations
                if (!headline && message) {
                    validationResults.recommendations.push("Consider adding a headline for better ad performance");
                }
                if (!call_to_action_type && link_url) {
                    validationResults.recommendations.push("Consider adding a call-to-action button when using a destination URL");
                }
                if (picture && video_id) {
                    validationResults.recommendations.push("Both image and video provided - video will take precedence in creative");
                }
                if (!description && link_url) {
                    validationResults.recommendations.push("Consider adding a description for better user experience");
                }
                object_story_spec_preview = {
                    page_id: page_id,
                };
                if (link_url || picture) {
                    object_story_spec_preview.link_data = {};
                    if (link_url)
                        object_story_spec_preview.link_data.link = link_url;
                    if (picture)
                        object_story_spec_preview.link_data.picture = picture;
                    if (message)
                        object_story_spec_preview.link_data.message = message;
                    if (headline)
                        object_story_spec_preview.link_data.name = headline;
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
                    if (message)
                        object_story_spec_preview.video_data.message = message;
                    if (headline)
                        object_story_spec_preview.video_data.title = headline;
                    if (call_to_action_type) {
                        object_story_spec_preview.video_data.call_to_action = {
                            type: call_to_action_type,
                        };
                    }
                }
                validationResults.object_story_spec_preview = object_story_spec_preview;
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(validationResults, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error validating creative setup: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Preview Ad Tool
    server.tool("preview_ad", "Generate HTML preview of how an ad creative will appear in different placements and formats. Useful for testing creative appearance before launching campaigns.", mcp_tools_js_1.PreviewAdSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var result, response, error_3, errorMessage;
        var creative_id = _b.creative_id, ad_format = _b.ad_format, product_item_ids = _b.product_item_ids;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, metaClient.generateAdPreview(creative_id, ad_format, product_item_ids)];
                case 1:
                    result = _c.sent();
                    response = {
                        success: true,
                        creative_id: creative_id,
                        ad_format: ad_format,
                        preview_html: result.body,
                        product_item_ids: product_item_ids,
                        notes: [
                            "The preview shows how the ad will appear in the selected format",
                            "Different placements may render the creative differently",
                            "Test across multiple formats to ensure optimal display",
                        ],
                    };
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(response, null, 2),
                                },
                            ],
                        }];
                case 2:
                    error_3 = _c.sent();
                    errorMessage = error_3 instanceof Error ? error_3.message : "Unknown error occurred";
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error generating ad preview: ".concat(errorMessage),
                                },
                            ],
                            isError: true,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Upload Creative Asset Tool (simplified - would need actual file upload)
    server.tool("upload_creative_asset", "Get guidance on uploading creative assets (images/videos) to Meta. Provides step-by-step instructions and technical requirements for asset uploads.", mcp_tools_js_1.CreateAdCreativeSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var response, errorMessage;
        var account_id = _b.account_id, name = _b.name;
        return __generator(this, function (_c) {
            try {
                response = {
                    message: "Creative asset upload process",
                    account_id: account_id,
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
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(response, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error with asset upload process: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Setup A/B Test Tool
    server.tool("setup_ab_test", "Get comprehensive guidance on setting up A/B tests for ad creatives. Provides best practices, testing strategies, and metrics to track for creative optimization.", mcp_tools_js_1.CreateAdCreativeSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var response, errorMessage;
        var account_id = _b.account_id, name = _b.name;
        return __generator(this, function (_c) {
            try {
                response = {
                    message: "A/B testing setup for creatives",
                    test_name: name,
                    account_id: account_id,
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
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(response, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error setting up A/B test: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Get Creative Performance Tool
    server.tool("get_creative_performance", "Get guidance on analyzing creative performance metrics. Provides recommended approaches for tracking creative effectiveness and optimization strategies.", mcp_tools_js_1.PreviewAdSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var response, errorMessage;
        var creative_id = _b.creative_id;
        return __generator(this, function (_c) {
            try {
                response = {
                    creative_id: creative_id,
                    performance_note: "Creative performance requires analyzing ads that use this creative",
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
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(response, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error getting creative performance: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Update Creative Tool
    server.tool("update_creative", "Get information about creative update limitations in Meta's system. Provides alternative approaches since creatives cannot be modified after creation.", mcp_tools_js_1.CreateAdCreativeSchema.shape, function (_params) { return __awaiter(_this, void 0, void 0, function () {
        var response, errorMessage;
        return __generator(this, function (_a) {
            // Note: These variables would be used in actual implementation
            // const { name, title, body } = _params;
            try {
                response = {
                    message: "Creative update limitations",
                    important_note: "Ad creatives cannot be modified once created in Meta's system",
                    explanation: "This is by design to maintain ad performance data integrity",
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
                    creative_versioning_tip: "Use descriptive naming conventions to track creative versions",
                };
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(response, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error updating creative: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Delete Creative Tool
    server.tool("delete_creative", "Get guidance on creative deletion process and impact. Provides safety checks and alternative approaches to avoid disrupting active campaigns.", mcp_tools_js_1.PreviewAdSchema.shape, function (params) { return __awaiter(_this, void 0, void 0, function () {
        var creative_id, response, errorMessage;
        return __generator(this, function (_a) {
            creative_id = params.creative_id;
            try {
                response = {
                    creative_id: creative_id,
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
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(response, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error deleting creative: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Enhanced Creative Validation Tool
    server.tool("validate_creative_enhanced", "Enhanced creative validation with comprehensive checks including page permissions, image accessibility, and Meta API compliance. Provides detailed feedback and fix suggestions.", mcp_tools_js_1.CreativeValidationEnhancedSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var validation, url_1, validExtensions, hasValidExtension, validCTATypes, object_story_spec_preview, hasErrors, hasWarnings, errorMessage;
        var account_id = _b.account_id, name = _b.name, page_id = _b.page_id, headline = _b.headline, message = _b.message, picture = _b.picture, video_id = _b.video_id, call_to_action_type = _b.call_to_action_type, link_url = _b.link_url, description = _b.description, instagram_actor_id = _b.instagram_actor_id;
        return __generator(this, function (_c) {
            try {
                validation = {
                    account_id: account_id,
                    name: name,
                    overall_status: "checking",
                    is_ready_for_creation: true,
                    checks: {
                        required_fields: {
                            status: "unknown",
                            issues: [],
                            details: "",
                        },
                        media_validation: {
                            status: "unknown",
                            issues: [],
                            details: "",
                        },
                        url_accessibility: {
                            status: "unknown",
                            issues: [],
                            details: "",
                        },
                        page_permissions: {
                            status: "unknown",
                            issues: [],
                            details: "",
                        },
                        api_compliance: {
                            status: "unknown",
                            issues: [],
                            details: "",
                        },
                    },
                    recommendations: [],
                    warnings: [],
                    object_story_spec_preview: {},
                    fix_suggestions: [],
                };
                // Enhanced required fields check
                if (!page_id || page_id.trim().length === 0) {
                    validation.checks.required_fields.issues.push("page_id is required for object_story_spec");
                    validation.is_ready_for_creation = false;
                }
                if (!name || name.trim().length === 0) {
                    validation.checks.required_fields.issues.push("name is required and cannot be empty");
                    validation.is_ready_for_creation = false;
                }
                validation.checks.required_fields.status =
                    validation.checks.required_fields.issues.length === 0
                        ? "success"
                        : "error";
                validation.checks.required_fields.details =
                    validation.checks.required_fields.issues.length === 0
                        ? "All required fields provided"
                        : "".concat(validation.checks.required_fields.issues.length, " required field issues found");
                // Enhanced media validation
                if (!picture && !video_id) {
                    validation.checks.media_validation.issues.push("Either picture (image URL) or video_id must be provided");
                    validation.is_ready_for_creation = false;
                }
                else if (picture && video_id) {
                    validation.warnings.push("Both image and video provided - video will take precedence");
                }
                // Image URL validation if provided
                if (picture) {
                    try {
                        url_1 = new URL(picture);
                        if (!url_1.protocol.startsWith("http")) {
                            validation.checks.media_validation.issues.push("Image URL must use HTTP or HTTPS protocol");
                            validation.is_ready_for_creation = false;
                        }
                        validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
                        hasValidExtension = validExtensions.some(function (ext) {
                            return url_1.pathname.toLowerCase().includes(ext);
                        });
                        if (!hasValidExtension &&
                            !url_1.pathname.includes("unsplash") &&
                            !url_1.pathname.includes("placeholder")) {
                            validation.warnings.push("Image URL should point to a valid image file (.jpg, .png, .gif, .webp)");
                        }
                    }
                    catch (error) {
                        validation.checks.media_validation.issues.push("Invalid image URL format");
                        validation.is_ready_for_creation = false;
                    }
                }
                validation.checks.media_validation.status =
                    validation.checks.media_validation.issues.length === 0
                        ? "success"
                        : "error";
                validation.checks.media_validation.details =
                    validation.checks.media_validation.issues.length === 0
                        ? "Media requirements met"
                        : "".concat(validation.checks.media_validation.issues.length, " media validation issues found");
                // URL accessibility check
                if (link_url) {
                    try {
                        new URL(link_url);
                        validation.checks.url_accessibility.status = "success";
                        validation.checks.url_accessibility.details =
                            "Destination URL format is valid";
                    }
                    catch (error) {
                        validation.checks.url_accessibility.issues.push("Invalid destination URL format");
                        validation.checks.url_accessibility.status = "error";
                        validation.checks.url_accessibility.details =
                            "Destination URL validation failed";
                        validation.is_ready_for_creation = false;
                    }
                }
                else {
                    validation.checks.url_accessibility.status = "warning";
                    validation.checks.url_accessibility.details =
                        "No destination URL provided - creative will not have click functionality";
                    validation.warnings.push("Consider adding a destination URL for better engagement");
                }
                // Enhanced Call-to-Action validation
                if (call_to_action_type) {
                    validCTATypes = [
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
                        validation.checks.api_compliance.issues.push("Invalid call_to_action_type: ".concat(call_to_action_type, ". Must be one of: ").concat(validCTATypes.join(", ")));
                        validation.is_ready_for_creation = false;
                    }
                }
                // API compliance check
                validation.checks.api_compliance.status =
                    validation.checks.api_compliance.issues.length === 0
                        ? "success"
                        : "error";
                validation.checks.api_compliance.details =
                    validation.checks.api_compliance.issues.length === 0
                        ? "All parameters comply with Meta API requirements"
                        : "".concat(validation.checks.api_compliance.issues.length, " API compliance issues found");
                // Page permissions check (simulated - would require actual API call)
                if (page_id) {
                    validation.checks.page_permissions.status = "warning";
                    validation.checks.page_permissions.details =
                        "Cannot verify page permissions - check manually that you have admin access";
                    validation.recommendations.push("Verify you have admin access to the Facebook Page before creating creative");
                }
                // Content quality recommendations
                if (!headline && !message) {
                    validation.warnings.push("No headline or message provided - creative may have low engagement");
                    validation.recommendations.push("Add compelling headline and message text for better performance");
                }
                if (!description && link_url) {
                    validation.recommendations.push("Add a description to provide more context for users");
                }
                if (!call_to_action_type && link_url) {
                    validation.recommendations.push("Add a call-to-action button to improve click-through rates");
                }
                object_story_spec_preview = { page_id: page_id };
                if (link_url || picture) {
                    object_story_spec_preview.link_data = {};
                    if (link_url)
                        object_story_spec_preview.link_data.link = link_url;
                    if (picture)
                        object_story_spec_preview.link_data.picture = picture;
                    if (message)
                        object_story_spec_preview.link_data.message = message;
                    if (headline)
                        object_story_spec_preview.link_data.name = headline;
                    if (description)
                        object_story_spec_preview.link_data.description = description;
                    if (call_to_action_type) {
                        object_story_spec_preview.link_data.call_to_action = {
                            type: call_to_action_type,
                        };
                    }
                }
                if (video_id) {
                    object_story_spec_preview.video_data = { video_id: video_id };
                    if (message)
                        object_story_spec_preview.video_data.message = message;
                    if (headline)
                        object_story_spec_preview.video_data.title = headline;
                    if (call_to_action_type) {
                        object_story_spec_preview.video_data.call_to_action = {
                            type: call_to_action_type,
                        };
                    }
                }
                if (instagram_actor_id) {
                    object_story_spec_preview.instagram_actor_id = instagram_actor_id;
                }
                validation.object_story_spec_preview = object_story_spec_preview;
                // Generate fix suggestions
                if (!validation.is_ready_for_creation) {
                    validation.fix_suggestions.push("Address all error-level issues before attempting creative creation");
                    if (validation.checks.required_fields.issues.length > 0) {
                        validation.fix_suggestions.push("Provide all required fields: page_id, name, and either picture or video_id");
                    }
                    if (validation.checks.media_validation.issues.length > 0) {
                        validation.fix_suggestions.push("Ensure image URL is accessible and points to a valid image file");
                    }
                    if (validation.checks.api_compliance.issues.length > 0) {
                        validation.fix_suggestions.push("Use valid call-to-action types from Meta's approved list");
                    }
                }
                hasErrors = Object.values(validation.checks).some(function (check) { return check.status === "error"; });
                hasWarnings = Object.values(validation.checks).some(function (check) { return check.status === "warning"; });
                if (hasErrors) {
                    validation.overall_status = "needs_fixes";
                }
                else if (hasWarnings) {
                    validation.overall_status = "ready_with_warnings";
                }
                else {
                    validation.overall_status = "ready";
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(validation, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error in enhanced creative validation: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Creative Best Practices Guide Tool
    server.tool("get_creative_best_practices", "Get comprehensive best practices for creating high-performing ad creatives. Includes platform-specific guidelines, content recommendations, and optimization strategies.", {}, function () { return __awaiter(_this, void 0, void 0, function () {
        var bestPractices;
        return __generator(this, function (_a) {
            bestPractices = {
                image_guidelines: {
                    technical_specs: {
                        recommended_dimensions: "1200x628 pixels (1.91:1 ratio)",
                        minimum_dimensions: "600x315 pixels",
                        maximum_file_size: "30MB",
                        supported_formats: ["JPG", "PNG", "GIF", "WebP"],
                        aspect_ratios: {
                            feed: "1.91:1 (landscape), 1:1 (square)",
                            stories: "9:16 (vertical)",
                            reels: "9:16 (vertical)",
                            marketplace: "1:1 (square)",
                        },
                    },
                    design_best_practices: [
                        "Use high-quality, eye-catching visuals",
                        "Ensure text is readable on mobile devices",
                        "Follow the 20% text rule (minimal text overlay)",
                        "Use contrasting colors for better visibility",
                        "Include your brand elements (logo, colors)",
                        "Show your product or service in action",
                        "Use authentic, diverse imagery",
                    ],
                    content_tips: [
                        "Focus on benefits, not just features",
                        "Create urgency with limited-time offers",
                        "Use social proof (testimonials, reviews)",
                        "Include clear value propositions",
                        "Test different emotional appeals",
                        "Show before/after transformations",
                        "Use lifestyle imagery that resonates with your audience",
                    ],
                },
                video_guidelines: {
                    technical_specs: {
                        recommended_duration: "15-30 seconds for most placements",
                        maximum_duration: "241 seconds",
                        minimum_resolution: "720p",
                        recommended_resolution: "1080p or higher",
                        aspect_ratios: {
                            feed: "16:9 (landscape), 1:1 (square), 4:5 (vertical)",
                            stories: "9:16 (vertical)",
                            reels: "9:16 (vertical)",
                        },
                        file_formats: ["MP4", "MOV", "AVI", "WMV", "FLV", "WebM"],
                    },
                    content_best_practices: [
                        "Hook viewers in the first 3 seconds",
                        "Include captions for sound-off viewing",
                        "Show your product/service early in the video",
                        "Use motion to capture attention",
                        "Include a clear call-to-action",
                        "Test vertical video for mobile placements",
                        "Keep branding subtle but visible",
                    ],
                    optimization_tips: [
                        "Test different video lengths",
                        "Use bright, contrasting visuals",
                        "Include face-to-camera shots for trust",
                        "Show real people using your product",
                        "Use trending music or sounds",
                        "Create versions optimized for different placements",
                        "Include text overlay for key messages",
                    ],
                },
                copy_guidelines: {
                    headline_best_practices: [
                        "Keep headlines under 25 characters for mobile",
                        "Use action words and strong verbs",
                        "Include benefits or value propositions",
                        "Create curiosity or urgency",
                        "Test question-based headlines",
                        "Include numbers when relevant",
                        "Make it specific and concrete",
                    ],
                    body_text_tips: [
                        "Keep primary text under 125 characters",
                        "Front-load the most important information",
                        "Use emojis sparingly for emphasis",
                        "Include social proof or statistics",
                        "Address pain points directly",
                        "Use conversational tone",
                        "End with a clear call-to-action",
                    ],
                    call_to_action_strategy: {
                        traffic_campaigns: ["Learn More", "Shop Now", "Get Quote"],
                        conversion_campaigns: ["Sign Up", "Download", "Apply Now"],
                        engagement_campaigns: ["Watch Video", "Contact Us", "Book Travel"],
                        general_tips: [
                            "Match CTA to campaign objective",
                            "Use action-oriented language",
                            "Create urgency when appropriate",
                            "Test different CTA buttons",
                            "Align CTA with landing page content",
                        ],
                    },
                },
                platform_specific_tips: {
                    facebook_feed: [
                        "Use 1.91:1 aspect ratio for images",
                        "Keep text overlay minimal",
                        "Focus on stopping scroll behavior",
                        "Use authentic, lifestyle imagery",
                    ],
                    instagram_feed: [
                        "Use 1:1 square format",
                        "Maintain consistent visual brand",
                        "Use high-quality, aesthetic imagery",
                        "Include relevant hashtags in copy",
                    ],
                    instagram_stories: [
                        "Use 9:16 vertical format",
                        "Create immersive, full-screen content",
                        "Use interactive elements when possible",
                        "Keep text large and readable",
                    ],
                    instagram_reels: [
                        "Use trending audio or music",
                        "Focus on entertainment value",
                        "Keep content authentic and relatable",
                        "Use vertical 9:16 format",
                    ],
                },
                testing_strategies: {
                    what_to_test: [
                        "Headlines and ad copy",
                        "Images vs videos",
                        "Different call-to-action buttons",
                        "Color schemes and visual styles",
                        "Audience targeting",
                        "Ad placements",
                        "Campaign objectives",
                    ],
                    testing_best_practices: [
                        "Test one variable at a time",
                        "Run tests for at least 3-7 days",
                        "Ensure statistical significance",
                        "Test across different audiences",
                        "Consider seasonal variations",
                        "Document and analyze results",
                        "Implement learnings in future campaigns",
                    ],
                },
                common_mistakes_to_avoid: [
                    "Using low-quality or pixelated images",
                    "Including too much text in images",
                    "Not optimizing for mobile viewing",
                    "Using generic stock photos",
                    "Ignoring brand consistency",
                    "Not testing different creative variations",
                    "Forgetting to include clear call-to-actions",
                    "Using inappropriate or offensive content",
                    "Not considering cultural sensitivity",
                    "Overcomplicating the message",
                ],
            };
            return [2 /*return*/, {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(bestPractices, null, 2),
                        },
                    ],
                }];
        });
    }); });
    // Creative Troubleshooting Tool
    server.tool("troubleshoot_creative_issues", "Diagnose and fix common creative creation and performance issues. Provide an error message or describe your issue to get specific solutions and recommendations.", mcp_tools_js_1.TroubleshootCreativeSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var troubleshooting, issueLower, errorMessage;
        var issue_description = _b.issue_description, creative_type = _b.creative_type;
        return __generator(this, function (_c) {
            try {
                troubleshooting = {
                    issue_description: issue_description,
                    creative_type: creative_type || "unknown",
                    diagnosis: [],
                    solutions: [],
                    prevention_tips: [],
                    related_tools: [],
                };
                issueLower = issue_description.toLowerCase();
                // Image-related issues
                if (issueLower.includes("image") || issueLower.includes("picture")) {
                    if (issueLower.includes("invalid") || issueLower.includes("url")) {
                        troubleshooting.diagnosis.push("Image URL is not accessible or invalid");
                        troubleshooting.solutions.push("Ensure image URL is publicly accessible (not behind login)");
                        troubleshooting.solutions.push("Use HTTPS URLs instead of HTTP");
                        troubleshooting.solutions.push("Try a different image hosting service (Unsplash, direct hosting)");
                        troubleshooting.solutions.push("Verify image URL works in a browser");
                        troubleshooting.related_tools.push("validate_creative_enhanced");
                    }
                    if (issueLower.includes("size") || issueLower.includes("large")) {
                        troubleshooting.diagnosis.push("Image file size or dimensions issue");
                        troubleshooting.solutions.push("Ensure image is under 30MB file size");
                        troubleshooting.solutions.push("Use recommended dimensions: 1200x628 pixels");
                        troubleshooting.solutions.push("Compress image using online tools");
                        troubleshooting.solutions.push("Use WebP format for better compression");
                        troubleshooting.related_tools.push("get_creative_best_practices");
                    }
                }
                // Permission and access issues
                if (issueLower.includes("permission") ||
                    issueLower.includes("access")) {
                    troubleshooting.diagnosis.push("Insufficient permissions for page or account");
                    troubleshooting.solutions.push("Verify you have admin access to the Facebook Page");
                    troubleshooting.solutions.push("Check that page_id is correct and accessible");
                    troubleshooting.solutions.push("Ensure the page is published and active");
                    troubleshooting.solutions.push("Contact page owner to grant admin permissions");
                    troubleshooting.related_tools.push("list_creatives", "validate_creative_enhanced");
                }
                // Call-to-action issues
                if (issueLower.includes("call") ||
                    issueLower.includes("cta") ||
                    issueLower.includes("action")) {
                    troubleshooting.diagnosis.push("Invalid call-to-action type or configuration");
                    troubleshooting.solutions.push("Use valid CTA types: LEARN_MORE, SHOP_NOW, SIGN_UP, etc.");
                    troubleshooting.solutions.push("Match CTA to campaign objective");
                    troubleshooting.solutions.push("Ensure destination URL is provided for click CTAs");
                    troubleshooting.related_tools.push("get_creative_best_practices", "validate_creative_setup");
                }
                // Video-related issues
                if (issueLower.includes("video") && creative_type === "video") {
                    troubleshooting.diagnosis.push("Video creative configuration issue");
                    troubleshooting.solutions.push("Ensure video_id is valid and accessible");
                    troubleshooting.solutions.push("Check video meets Meta's technical requirements");
                    troubleshooting.solutions.push("Verify video is uploaded to Facebook/Instagram");
                    troubleshooting.solutions.push("Use supported video formats (MP4, MOV, AVI)");
                    troubleshooting.related_tools.push("upload_creative_asset", "get_creative_best_practices");
                }
                // Object story spec issues
                if (issueLower.includes("object_story_spec") ||
                    issueLower.includes("spec")) {
                    troubleshooting.diagnosis.push("Object story specification structure issue");
                    troubleshooting.solutions.push("Ensure page_id is provided and valid");
                    troubleshooting.solutions.push("Use either link_data or video_data, not both");
                    troubleshooting.solutions.push("Include required fields: name in link_data for images");
                    troubleshooting.solutions.push("Check that all URLs in spec are valid");
                    troubleshooting.related_tools.push("validate_creative_setup", "validate_creative_enhanced");
                }
                // Performance issues
                if (issueLower.includes("performance") ||
                    issueLower.includes("ctr") ||
                    issueLower.includes("engagement")) {
                    troubleshooting.diagnosis.push("Creative performance optimization needed");
                    troubleshooting.solutions.push("Test different headlines and copy variations");
                    troubleshooting.solutions.push("Use more eye-catching visuals");
                    troubleshooting.solutions.push("Improve call-to-action clarity");
                    troubleshooting.solutions.push("Test different audience segments");
                    troubleshooting.solutions.push("Check creative relevance to target audience");
                    troubleshooting.related_tools.push("setup_ab_test", "get_creative_performance", "get_creative_best_practices");
                }
                // Generic troubleshooting if no specific issues identified
                if (troubleshooting.diagnosis.length === 0) {
                    troubleshooting.diagnosis.push("General creative issue - needs more specific diagnosis");
                    troubleshooting.solutions.push("Run validate_creative_enhanced before creating creatives");
                    troubleshooting.solutions.push("Check that all required fields are provided");
                    troubleshooting.solutions.push("Verify account and page permissions");
                    troubleshooting.solutions.push("Review Meta's creative specifications");
                    troubleshooting.related_tools.push("validate_creative_enhanced", "get_creative_best_practices");
                }
                // Add prevention tips
                troubleshooting.prevention_tips = [
                    "Always validate creatives before creation using validate_creative_enhanced",
                    "Follow Meta's creative best practices and specifications",
                    "Test image URLs in a browser before using them",
                    "Maintain consistent branding across all creatives",
                    "Keep backup versions of high-performing creatives",
                    "Regularly review and update creative content",
                    "Monitor creative performance and refresh underperforming assets",
                ];
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(troubleshooting, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error in creative troubleshooting: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Bulk Creative Analysis Tool
    server.tool("analyze_account_creatives", "Analyze all creatives in an account to identify patterns, performance insights, and optimization opportunities. Provides summary statistics and recommendations.", mcp_tools_js_1.AnalyzeCreativesSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var analysis, result, creatives, ctaCounts, headlineLengths, messageLengths, creativeFormats, _i, creatives_1, creative, cta, headline, message, error_4, errorMessage;
        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        var account_id = _b.account_id, limit = _b.limit;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    _o.trys.push([0, 2, , 3]);
                    analysis = {
                        account_id: account_id,
                        analysis_date: new Date().toISOString(),
                        summary: {
                            total_creatives: 0,
                            image_creatives: 0,
                            video_creatives: 0,
                            link_creatives: 0,
                            most_common_cta: "unknown",
                            avg_headline_length: 0,
                            avg_message_length: 0,
                        },
                        insights: {
                            content_patterns: [],
                            optimization_opportunities: [],
                            performance_recommendations: [],
                        },
                        top_performing_elements: {
                            headlines: [],
                            cta_types: [],
                            creative_formats: [],
                        },
                        recommendations: [],
                    };
                    return [4 /*yield*/, metaClient.getAdCreatives(account_id, {
                            limit: limit || 50,
                        })];
                case 1:
                    result = _o.sent();
                    creatives = result.data;
                    analysis.summary.total_creatives = creatives.length;
                    if (creatives.length === 0) {
                        analysis.insights.optimization_opportunities.push("No creatives found - create your first creative to start advertising");
                        analysis.recommendations.push("Use create_ad_creative to create your first advertising creative");
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify(analysis, null, 2),
                                    },
                                ],
                            }];
                    }
                    ctaCounts = {};
                    headlineLengths = [];
                    messageLengths = [];
                    creativeFormats = {};
                    for (_i = 0, creatives_1 = creatives; _i < creatives_1.length; _i++) {
                        creative = creatives_1[_i];
                        // Count creative types
                        if ((_c = creative.object_story_spec) === null || _c === void 0 ? void 0 : _c.video_data) {
                            analysis.summary.video_creatives++;
                            creativeFormats.video = (creativeFormats.video || 0) + 1;
                        }
                        else if ((_d = creative.object_story_spec) === null || _d === void 0 ? void 0 : _d.link_data) {
                            analysis.summary.image_creatives++;
                            analysis.summary.link_creatives++;
                            creativeFormats.image = (creativeFormats.image || 0) + 1;
                        }
                        cta = ((_e = creative.call_to_action) === null || _e === void 0 ? void 0 : _e.type) ||
                            ((_h = (_g = (_f = creative.object_story_spec) === null || _f === void 0 ? void 0 : _f.link_data) === null || _g === void 0 ? void 0 : _g.call_to_action) === null || _h === void 0 ? void 0 : _h.type);
                        if (cta) {
                            ctaCounts[cta] = (ctaCounts[cta] || 0) + 1;
                        }
                        headline = creative.title || ((_k = (_j = creative.object_story_spec) === null || _j === void 0 ? void 0 : _j.link_data) === null || _k === void 0 ? void 0 : _k.name);
                        message = creative.body || ((_m = (_l = creative.object_story_spec) === null || _l === void 0 ? void 0 : _l.link_data) === null || _m === void 0 ? void 0 : _m.message);
                        if (headline)
                            headlineLengths.push(headline.length);
                        if (message)
                            messageLengths.push(message.length);
                    }
                    // Calculate averages
                    analysis.summary.avg_headline_length =
                        headlineLengths.length > 0
                            ? Math.round(headlineLengths.reduce(function (sum, len) { return sum + len; }, 0) /
                                headlineLengths.length)
                            : 0;
                    analysis.summary.avg_message_length =
                        messageLengths.length > 0
                            ? Math.round(messageLengths.reduce(function (sum, len) { return sum + len; }, 0) /
                                messageLengths.length)
                            : 0;
                    // Find most common CTA
                    if (Object.keys(ctaCounts).length > 0) {
                        analysis.summary.most_common_cta = Object.entries(ctaCounts).sort(function (_a, _b) {
                            var a = _a[1];
                            var b = _b[1];
                            return b - a;
                        })[0][0];
                    }
                    // Generate insights
                    analysis.insights.content_patterns = [
                        "".concat(analysis.summary.image_creatives, " image creatives vs ").concat(analysis.summary.video_creatives, " video creatives"),
                        "Average headline length: ".concat(analysis.summary.avg_headline_length, " characters"),
                        "Average message length: ".concat(analysis.summary.avg_message_length, " characters"),
                        "Most used call-to-action: ".concat(analysis.summary.most_common_cta),
                    ];
                    // Generate optimization opportunities
                    if (analysis.summary.video_creatives <
                        analysis.summary.image_creatives * 0.3) {
                        analysis.insights.optimization_opportunities.push("Consider creating more video creatives - they often perform better");
                    }
                    if (analysis.summary.avg_headline_length > 25) {
                        analysis.insights.optimization_opportunities.push("Headlines are averaging over 25 characters - consider shorter headlines for mobile");
                    }
                    if (analysis.summary.avg_message_length > 125) {
                        analysis.insights.optimization_opportunities.push("Message text is long - consider shorter copy for better mobile experience");
                    }
                    if (Object.keys(ctaCounts).length < 3) {
                        analysis.insights.optimization_opportunities.push("Limited call-to-action variety - test different CTA types");
                    }
                    // Performance recommendations
                    analysis.insights.performance_recommendations = [
                        "Test video creatives against your top-performing image creatives",
                        "Create A/B tests for different headline lengths",
                        "Experiment with different call-to-action buttons",
                        "Analyze creative performance using get_insights tool",
                        "Consider seasonal or trending content updates",
                    ];
                    // Top performing elements (simulated - would need actual performance data)
                    analysis.top_performing_elements = {
                        headlines: [
                            "Limited examples available - analyze with performance data",
                        ],
                        cta_types: Object.keys(ctaCounts).slice(0, 3),
                        creative_formats: Object.keys(creativeFormats),
                    };
                    // Generate actionable recommendations
                    analysis.recommendations = [
                        "Use setup_ab_test to systematically test creative variations",
                        "Create video versions of your best-performing image creatives",
                        "Implement get_creative_best_practices guidelines in new creatives",
                        "Use validate_creative_enhanced before creating new creatives",
                        "Regularly refresh creative content to prevent ad fatigue",
                    ];
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(analysis, null, 2),
                                },
                            ],
                        }];
                case 2:
                    error_4 = _o.sent();
                    errorMessage = error_4 instanceof Error ? error_4.message : "Unknown error occurred";
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error analyzing account creatives: ".concat(errorMessage),
                                },
                            ],
                            isError: true,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // v23.0 Image Upload from URL Tool - FUNCTIONAL
    server.tool("upload_image_from_url", "Upload an image from a URL to Meta and get the image_hash for v23.0 API compliance. Downloads the image from the provided URL and uploads it to Meta's servers, returning the hash required for ad creatives.", mcp_tools_js_1.UploadImageFromUrlSchema.shape, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var uploadResult, response, error_5, errorMessage;
        var account_id = _b.account_id, image_url = _b.image_url, image_name = _b.image_name;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    // Validate account ID format
                    if (!account_id.startsWith("act_")) {
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: "Error: Account ID must include \"act_\" prefix. Use \"act_".concat(account_id, "\" instead."),
                                    },
                                ],
                                isError: true,
                            }];
                    }
                    // Validate image URL
                    try {
                        new URL(image_url);
                    }
                    catch (error) {
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: "text",
                                        text: "Error: Invalid image URL format: ".concat(image_url),
                                    },
                                ],
                                isError: true,
                            }];
                    }
                    console.log("=== UPLOAD IMAGE FROM URL ===");
                    console.log("Account ID:", account_id);
                    console.log("Image URL:", image_url);
                    console.log("Image Name:", image_name);
                    return [4 /*yield*/, metaClient.uploadImageFromUrl(account_id, image_url, image_name)];
                case 1:
                    uploadResult = _c.sent();
                    response = {
                        success: true,
                        message: "Image uploaded successfully to Meta",
                        api_version: "v23.0",
                        upload_details: {
                            account_id: account_id,
                            original_url: image_url,
                            uploaded_name: uploadResult.name,
                            image_hash: uploadResult.hash,
                            meta_url: uploadResult.url,
                        },
                        technical_specs: {
                            max_file_size: "30MB uploaded successfully",
                            supported_formats: ["JPG", "PNG", "GIF", "WebP"],
                            upload_endpoint: "https://graph.facebook.com/v23.0/".concat(account_id, "/adimages"),
                            api_version: "v23.0",
                        },
                        usage_examples: {
                            single_image_ads: {
                                description: "Use the returned hash in create_ad_creative",
                                example: {
                                    account_id: account_id,
                                    name: "My Creative",
                                    page_id: "YOUR_PAGE_ID",
                                    image_hash: uploadResult.hash,
                                    message: "Your ad text",
                                    headline: "Your headline",
                                    link_url: "https://your-website.com",
                                    call_to_action_type: "SHOP_NOW",
                                },
                            },
                            carousel_ads: {
                                description: "Image hash is required for carousel ads",
                                note: "External URLs are not supported for carousel attachments",
                            },
                        },
                        next_steps: [
                            "Use the image_hash \"".concat(uploadResult.hash, "\" in create_ad_creative"),
                            "The image is now stored in your Meta ad account library",
                            "Test the creative with validate_creative_enhanced",
                            "Create your ad creative using the hash instead of external URL",
                        ],
                    };
                    console.log("Upload successful!");
                    console.log("===========================");
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(response, null, 2),
                                },
                            ],
                        }];
                case 2:
                    error_5 = _c.sent();
                    console.log("=== IMAGE UPLOAD ERROR ===");
                    console.log("Error:", error_5);
                    console.log("=========================");
                    errorMessage = error_5 instanceof Error ? error_5.message : "Unknown error occurred";
                    return [2 /*return*/, {
                            content: [
                                {
                                    type: "text",
                                    text: "Error uploading image from URL: ".concat(errorMessage),
                                },
                            ],
                            isError: true,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Meta Marketing API v23.0 Compliance Checker
    server.tool("check_api_v23_compliance", "Check if your creative parameters are compliant with Meta Marketing API v23.0 requirements. Identifies deprecated features and recommends v23.0 best practices.", mcp_tools_js_1.CreateAdCreativeSchema.shape, function (params) { return __awaiter(_this, void 0, void 0, function () {
        var complianceCheck, v22CTATypes, errorMessage;
        return __generator(this, function (_a) {
            try {
                complianceCheck = {
                    api_version: "v23.0",
                    check_date: new Date().toISOString(),
                    overall_compliance: "checking",
                    critical_issues: [],
                    warnings: [],
                    recommendations: [],
                    v22_features: {
                        standard_enhancements: {
                            status: "unknown",
                            details: "",
                        },
                        enhanced_cta: {
                            status: "unknown",
                            details: "",
                        },
                        image_handling: {
                            status: "unknown",
                            details: "",
                        },
                        account_format: {
                            status: "unknown",
                            details: "",
                        },
                    },
                    migration_timeline: {
                        current_status: "v23.0 active since April 21, 2025",
                        deprecation_warning: "Legacy Standard Enhancements deprecated",
                        grace_period_end: "April 22, 2025 (estimated)",
                        action_required: "Migrate to individual enhancement features",
                    },
                };
                // Check account ID format
                if (!params.account_id.startsWith("act_")) {
                    complianceCheck.critical_issues.push("Account ID missing 'act_' prefix - will cause Error Code 100, Subcode 33");
                    complianceCheck.v22_features.account_format.status = "error";
                    complianceCheck.v22_features.account_format.details =
                        "Must use 'act_XXXXXXXXX' format";
                }
                else {
                    complianceCheck.v22_features.account_format.status = "compliant";
                    complianceCheck.v22_features.account_format.details =
                        "Correct account ID format";
                }
                // Check Standard Enhancements usage
                if (params.enable_standard_enhancements) {
                    complianceCheck.v22_features.standard_enhancements.status =
                        "compliant";
                    complianceCheck.v22_features.standard_enhancements.details =
                        "Using v23.0 individual feature controls";
                    complianceCheck.recommendations.push("Monitor enhancement performance in Meta Ads Manager");
                }
                else {
                    complianceCheck.v22_features.standard_enhancements.status = "unused";
                    complianceCheck.v22_features.standard_enhancements.details =
                        "Standard Enhancements not enabled";
                    complianceCheck.recommendations.push("Consider enabling Standard Enhancements for better creative performance");
                }
                // Check call-to-action compliance
                if (params.call_to_action_type) {
                    v22CTATypes = [
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
                    ];
                    if (v22CTATypes.includes(params.call_to_action_type)) {
                        complianceCheck.v22_features.enhanced_cta.status = "compliant";
                        complianceCheck.v22_features.enhanced_cta.details =
                            "Using supported v23.0 CTA type";
                    }
                    else {
                        complianceCheck.warnings.push("CTA type '".concat(params.call_to_action_type, "' may not be supported in v23.0"));
                        complianceCheck.v22_features.enhanced_cta.status = "warning";
                        complianceCheck.v22_features.enhanced_cta.details =
                            "CTA type compatibility uncertain";
                    }
                }
                // Check image handling method
                if (params.picture && params.image_hash) {
                    complianceCheck.critical_issues.push("Cannot use both picture URL and image_hash - choose one method");
                    complianceCheck.v22_features.image_handling.status = "error";
                    complianceCheck.v22_features.image_handling.details =
                        "Conflicting image methods";
                }
                else if (params.image_hash) {
                    complianceCheck.v22_features.image_handling.status = "optimal";
                    complianceCheck.v22_features.image_handling.details =
                        "Using image_hash for better performance and carousel compatibility";
                    complianceCheck.recommendations.push("Image hash method provides better caching and is required for carousel ads");
                }
                else if (params.picture) {
                    complianceCheck.v22_features.image_handling.status = "acceptable";
                    complianceCheck.v22_features.image_handling.details =
                        "Using external URL (8MB limit, not suitable for carousels)";
                    complianceCheck.recommendations.push("Consider using image_hash method for better performance and carousel compatibility");
                }
                // Determine overall compliance
                if (complianceCheck.critical_issues.length > 0) {
                    complianceCheck.overall_compliance = "non-compliant";
                }
                else if (complianceCheck.warnings.length > 0) {
                    complianceCheck.overall_compliance = "compliant-with-warnings";
                }
                else {
                    complianceCheck.overall_compliance = "fully-compliant";
                }
                // Add general v23.0 recommendations
                complianceCheck.recommendations.push("Test creatives in Graph API Explorer before production deployment", "Monitor Meta's developer changelog for quarterly API updates", "Implement comprehensive error handling for specific subcodes", "Use validate_creative_enhanced before creating creatives");
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(complianceCheck, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error checking v23.0 compliance: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
    // Enhanced Error Code Reference Tool
    server.tool("get_meta_error_codes", "Get detailed reference for Meta Marketing API error codes, subcodes, and specific solutions. Essential for troubleshooting v23.0 API integration issues.", {
        error_code: {
            type: "string",
            description: "Specific error code to look up (optional - returns all if not provided)",
            optional: true,
        },
        error_subcode: {
            type: "string",
            description: "Specific error subcode for detailed guidance (optional)",
            optional: true,
        },
    }, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var errorReference, filteredResponse, commonErrors, errorDetails, errorMessage;
        var _c;
        var error_code = _b.error_code, error_subcode = _b.error_subcode;
        return __generator(this, function (_d) {
            try {
                errorReference = {
                    api_version: "v23.0",
                    lookup_date: new Date().toISOString(),
                    requested_code: error_code,
                    requested_subcode: error_subcode,
                    common_errors: {
                        "100": {
                            description: "Invalid parameter errors - most common creative API error",
                            subcodes: {
                                "33": {
                                    description: "Object access issues, typically account ID format",
                                    common_causes: [
                                        "Account ID missing 'act_' prefix",
                                        "Invalid or inaccessible account ID",
                                        "Insufficient permissions for the account",
                                    ],
                                    solutions: [
                                        "Ensure account ID includes 'act_' prefix (e.g., 'act_123456789')",
                                        "Verify you have admin access to the ad account",
                                        "Check that access token includes ads_management permission",
                                        "Confirm account is active and not disabled",
                                    ],
                                    example_fix: "Change '123456789' to 'act_123456789'",
                                },
                                "1443048": {
                                    description: "object_story_spec validation failed",
                                    common_causes: [
                                        "Missing required page_id in object_story_spec",
                                        "Invalid Facebook Page ID",
                                        "Malformed link_data or video_data structure",
                                        "Missing required fields for creative type",
                                    ],
                                    solutions: [
                                        "Ensure page_id is provided and valid",
                                        "Verify you have admin access to the Facebook Page",
                                        "Check object_story_spec structure matches Meta documentation",
                                        "Validate all URLs in the creative specification",
                                    ],
                                    example_fix: "Add valid page_id to object_story_spec",
                                },
                                "3858082": {
                                    description: "Standard Enhancements requirement (v23.0 specific)",
                                    common_causes: [
                                        "Using deprecated standard_enhancements bundle",
                                        "Invalid enhancement feature configuration",
                                        "Missing required enroll_status values",
                                    ],
                                    solutions: [
                                        "Replace standard_enhancements with individual features",
                                        "Use degrees_of_freedom_spec with creative_features_spec",
                                        "Set enroll_status to 'OPT_IN' for each feature",
                                        "Remove legacy enhancement parameters",
                                    ],
                                    v22_example: {
                                        deprecated: "{\"standard_enhancements\": {\"enroll_status\": \"OPT_IN\"}}",
                                        correct: "{\n  \"degrees_of_freedom_spec\": {\n    \"creative_features_spec\": {\n      \"enhance_cta\": {\"enroll_status\": \"OPT_IN\"},\n      \"image_brightness_and_contrast\": {\"enroll_status\": \"OPT_IN\"},\n      \"text_improvements\": {\"enroll_status\": \"OPT_IN\"}\n    }\n  }\n}",
                                    },
                                },
                            },
                        },
                        "200": {
                            description: "Permissions errors",
                            common_causes: [
                                "Insufficient permissions for the operation",
                                "Token does not have required scopes",
                                "User not admin of the page or account",
                            ],
                            solutions: [
                                "Request ads_management permission",
                                "Ensure user has admin role on Facebook Page",
                                "Verify business verification is complete",
                                "Check if account is under review or restricted",
                            ],
                        },
                        "190": {
                            description: "Access token errors",
                            common_causes: [
                                "Expired access token",
                                "Invalid access token format",
                                "Revoked or deauthorized token",
                            ],
                            solutions: [
                                "Refresh the access token",
                                "Regenerate long-lived token",
                                "Check app is still authorized",
                                "Verify token has not been manually revoked",
                            ],
                        },
                        "4": {
                            description: "Rate limiting errors",
                            common_causes: [
                                "Too many API calls in short time period",
                                "Exceeded account-level rate limits",
                                "Concurrent request limits reached",
                            ],
                            solutions: [
                                "Implement exponential backoff retry logic",
                                "Reduce API call frequency",
                                "Use batch requests where possible",
                                "Monitor rate limit headers in responses",
                            ],
                        },
                    },
                    debugging_tips: [
                        "Always check the fbtrace_id for Meta support",
                        "Look for error_user_msg for user-friendly explanations",
                        "Check error_data for additional context",
                        "Use Graph API Explorer to test parameters",
                        "Enable debug mode for detailed error information",
                    ],
                    v22_specific_guidance: [
                        "Use individual enhancement features instead of bundles",
                        "Ensure account ID includes 'act_' prefix",
                        "Test with image_hash method for better compatibility",
                        "Implement proper error handling for subcode-specific guidance",
                        "Monitor Meta's changelog for quarterly API updates",
                    ],
                };
                filteredResponse = errorReference;
                commonErrors = errorReference.common_errors;
                if (error_code && commonErrors[error_code]) {
                    errorDetails = commonErrors[error_code];
                    filteredResponse = __assign(__assign({}, errorReference), { filtered_result: {
                            code: error_code,
                            details: errorDetails,
                        } });
                    if (error_subcode && ((_c = errorDetails.subcodes) === null || _c === void 0 ? void 0 : _c[error_subcode])) {
                        filteredResponse.filtered_result.subcode_details =
                            errorDetails.subcodes[error_subcode];
                    }
                }
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(filteredResponse, null, 2),
                            },
                        ],
                    }];
            }
            catch (error) {
                errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: "Error retrieving error code reference: ".concat(errorMessage),
                            },
                        ],
                        isError: true,
                    }];
            }
            return [2 /*return*/];
        });
    }); });
}
