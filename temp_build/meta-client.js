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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaApiClient = void 0;
var node_fetch_1 = require("node-fetch");
var auth_js_1 = require("./utils/auth.js");
var rate_limiter_js_1 = require("./utils/rate-limiter.js");
var error_handler_js_1 = require("./utils/error-handler.js");
var pagination_js_1 = require("./utils/pagination.js");
var MetaApiClient = /** @class */ (function () {
    function MetaApiClient(auth) {
        this.auth = auth || auth_js_1.AuthManager.fromEnvironment();
    }
    Object.defineProperty(MetaApiClient.prototype, "authManager", {
        get: function () {
            return this.auth;
        },
        enumerable: false,
        configurable: true
    });
    MetaApiClient.prototype.makeRequest = function (endpoint_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, method, body, accountId, isWriteCall) {
            var url;
            var _this = this;
            if (method === void 0) { method = "GET"; }
            if (isWriteCall === void 0) { isWriteCall = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.auth.getBaseUrl(), "/").concat(this.auth.getApiVersion(), "/").concat(endpoint);
                        if (!accountId) return [3 /*break*/, 2];
                        return [4 /*yield*/, rate_limiter_js_1.globalRateLimiter.checkRateLimit(accountId, isWriteCall)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, (0, error_handler_js_1.retryWithBackoff)(function () { return __awaiter(_this, void 0, void 0, function () {
                            var headers, requestOptions, response;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        headers = this.auth.getAuthHeaders();
                                        requestOptions = {
                                            method: method,
                                            headers: headers,
                                        };
                                        if (body && method !== "GET") {
                                            if (typeof body === "string") {
                                                requestOptions.body = body;
                                                headers["Content-Type"] = "application/x-www-form-urlencoded";
                                            }
                                            else {
                                                requestOptions.body = JSON.stringify(body);
                                                headers["Content-Type"] = "application/json";
                                            }
                                        }
                                        return [4 /*yield*/, (0, node_fetch_1.default)(url, requestOptions)];
                                    case 1:
                                        response = _a.sent();
                                        return [2 /*return*/, error_handler_js_1.MetaApiErrorHandler.handleResponse(response)];
                                }
                            });
                        }); }, "".concat(method, " ").concat(endpoint))];
                }
            });
        });
    };
    MetaApiClient.prototype.buildQueryString = function (params) {
        var urlParams = new URLSearchParams();
        for (var _i = 0, _a = Object.entries(params); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    urlParams.set(key, JSON.stringify(value));
                }
                else if (typeof value === "object") {
                    urlParams.set(key, JSON.stringify(value));
                }
                else {
                    urlParams.set(key, String(value));
                }
            }
        }
        return urlParams.toString();
    };
    // Account Methods
    MetaApiClient.prototype.getAdAccounts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.makeRequest("me/adaccounts?fields=id,name,account_status,balance,currency,timezone_name,business")];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    // Campaign Methods
    MetaApiClient.prototype.getCampaigns = function (accountId_1) {
        return __awaiter(this, arguments, void 0, function (accountId, params) {
            var formattedAccountId, status, fields, paginationParams, queryParams, query, response;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formattedAccountId = this.auth.getAccountId(accountId);
                        status = params.status, fields = params.fields, paginationParams = __rest(params, ["status", "fields"]);
                        queryParams = __assign({ fields: (fields === null || fields === void 0 ? void 0 : fields.join(",")) ||
                                "id,name,objective,status,effective_status,created_time,updated_time,start_time,stop_time,budget_remaining,daily_budget,lifetime_budget" }, paginationParams);
                        if (status) {
                            queryParams.effective_status = JSON.stringify([status]);
                        }
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(formattedAccountId, "/campaigns?").concat(query), "GET", null, formattedAccountId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(response)];
                }
            });
        });
    };
    MetaApiClient.prototype.getCampaign = function (campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.makeRequest("".concat(campaignId, "?fields=id,name,objective,status,effective_status,created_time,updated_time,start_time,stop_time,budget_remaining,daily_budget,lifetime_budget,account_id"))];
            });
        });
    };
    MetaApiClient.prototype.createCampaign = function (accountId, campaignData) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, body;
            return __generator(this, function (_a) {
                formattedAccountId = this.auth.getAccountId(accountId);
                body = this.buildQueryString(campaignData);
                return [2 /*return*/, this.makeRequest("".concat(formattedAccountId, "/campaigns"), "POST", body, formattedAccountId, true)];
            });
        });
    };
    MetaApiClient.prototype.updateCampaign = function (campaignId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var body;
            return __generator(this, function (_a) {
                body = this.buildQueryString(updates);
                return [2 /*return*/, this.makeRequest(campaignId, "POST", body, undefined, true)];
            });
        });
    };
    MetaApiClient.prototype.deleteCampaign = function (campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.makeRequest(campaignId, "DELETE", null, undefined, true)];
            });
        });
    };
    // Ad Set Methods
    MetaApiClient.prototype.getAdSets = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var campaignId, accountId, status, fields, paginationParams, endpoint, formattedAccountId, queryParams, query, response;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        campaignId = params.campaignId, accountId = params.accountId, status = params.status, fields = params.fields, paginationParams = __rest(params, ["campaignId", "accountId", "status", "fields"]);
                        if (campaignId) {
                            endpoint = "".concat(campaignId, "/adsets");
                        }
                        else if (accountId) {
                            formattedAccountId = this.auth.getAccountId(accountId);
                            endpoint = "".concat(formattedAccountId, "/adsets");
                        }
                        else {
                            throw new Error("Either campaignId or accountId must be provided");
                        }
                        queryParams = __assign({ fields: (fields === null || fields === void 0 ? void 0 : fields.join(",")) ||
                                "id,name,campaign_id,status,effective_status,created_time,updated_time,start_time,end_time,daily_budget,lifetime_budget,bid_amount,billing_event,optimization_goal" }, paginationParams);
                        if (status) {
                            queryParams.effective_status = JSON.stringify([status]);
                        }
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(endpoint, "?").concat(query), "GET", null, accountId ? this.auth.getAccountId(accountId) : undefined)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(response)];
                }
            });
        });
    };
    MetaApiClient.prototype.createAdSet = function (campaignId, adSetData) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign, accountId, formattedAccountId, requestData, body, result, error_1, errorData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCampaign(campaignId)];
                    case 1:
                        campaign = _a.sent();
                        accountId = campaign.account_id;
                        if (!accountId) {
                            throw new Error("Unable to determine account ID from campaign");
                        }
                        formattedAccountId = this.auth.getAccountId(accountId);
                        requestData = __assign(__assign({}, adSetData), { campaign_id: campaignId });
                        body = this.buildQueryString(requestData);
                        // Enhanced debugging for ad set creation
                        console.log("=== AD SET CREATION DEBUG ===");
                        console.log("Campaign ID:", campaignId);
                        console.log("Account ID:", accountId);
                        console.log("Formatted Account ID:", formattedAccountId);
                        console.log("Request Data Object:", JSON.stringify(requestData, null, 2));
                        console.log("Request Body (URL-encoded):", body);
                        console.log("API Endpoint:", "".concat(formattedAccountId, "/adsets"));
                        console.log("===========================");
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.makeRequest("".concat(formattedAccountId, "/adsets"), "POST", body, formattedAccountId, true)];
                    case 3:
                        result = _a.sent();
                        console.log("=== AD SET CREATION SUCCESS ===");
                        console.log("Created Ad Set ID:", result.id);
                        console.log("==============================");
                        return [2 /*return*/, result];
                    case 4:
                        error_1 = _a.sent();
                        console.log("=== AD SET CREATION ERROR ===");
                        console.log("Error object:", error_1);
                        if (error_1 instanceof Error) {
                            console.log("Error message:", error_1.message);
                            // Try to parse error response if it's JSON
                            try {
                                errorData = JSON.parse(error_1.message);
                                console.log("Parsed error data:", JSON.stringify(errorData, null, 2));
                                if (errorData.error) {
                                    console.log("Meta API Error Details:");
                                    console.log("- Message:", errorData.error.message);
                                    console.log("- Code:", errorData.error.code);
                                    console.log("- Type:", errorData.error.type);
                                    console.log("- Error Subcode:", errorData.error.error_subcode);
                                    console.log("- FBTrace ID:", errorData.error.fbtrace_id);
                                    if (errorData.error.error_data) {
                                        console.log("- Error Data:", JSON.stringify(errorData.error.error_data, null, 2));
                                    }
                                    if (errorData.error.error_user_title) {
                                        console.log("- User Title:", errorData.error.error_user_title);
                                    }
                                    if (errorData.error.error_user_msg) {
                                        console.log("- User Message:", errorData.error.error_user_msg);
                                    }
                                }
                            }
                            catch (parseError) {
                                console.log("Could not parse error as JSON, raw message:", error_1.message);
                            }
                        }
                        console.log("============================");
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Insights Methods
    MetaApiClient.prototype.getInsights = function (objectId_1) {
        return __awaiter(this, arguments, void 0, function (objectId, params) {
            var queryParams, query, response;
            var _a;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryParams = __assign({ fields: ((_a = params.fields) === null || _a === void 0 ? void 0 : _a.join(",")) ||
                                "impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,actions,cost_per_action_type" }, params);
                        if (params.time_range) {
                            queryParams.time_range = params.time_range;
                        }
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(objectId, "/insights?").concat(query))];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(response)];
                }
            });
        });
    };
    // Custom Audience Methods
    MetaApiClient.prototype.getCustomAudiences = function (accountId_1) {
        return __awaiter(this, arguments, void 0, function (accountId, params) {
            var formattedAccountId, fields, paginationParams, queryParams, query, response;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formattedAccountId = this.auth.getAccountId(accountId);
                        fields = params.fields, paginationParams = __rest(params, ["fields"]);
                        queryParams = __assign({ fields: (fields === null || fields === void 0 ? void 0 : fields.join(",")) ||
                                "id,name,description,subtype,approximate_count,data_source,retention_days,creation_time,operation_status" }, paginationParams);
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(formattedAccountId, "/customaudiences?").concat(query), "GET", null, formattedAccountId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(response)];
                }
            });
        });
    };
    MetaApiClient.prototype.createCustomAudience = function (accountId, audienceData) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, body;
            return __generator(this, function (_a) {
                formattedAccountId = this.auth.getAccountId(accountId);
                body = this.buildQueryString(audienceData);
                return [2 /*return*/, this.makeRequest("".concat(formattedAccountId, "/customaudiences"), "POST", body, formattedAccountId, true)];
            });
        });
    };
    MetaApiClient.prototype.createLookalikeAudience = function (accountId, audienceData) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, body;
            return __generator(this, function (_a) {
                formattedAccountId = this.auth.getAccountId(accountId);
                body = this.buildQueryString(__assign(__assign({}, audienceData), { subtype: "LOOKALIKE", lookalike_spec: {
                        ratio: audienceData.ratio,
                        country: audienceData.country,
                        type: "similarity",
                    } }));
                return [2 /*return*/, this.makeRequest("".concat(formattedAccountId, "/customaudiences"), "POST", body, formattedAccountId, true)];
            });
        });
    };
    // Creative Methods
    MetaApiClient.prototype.getAdCreatives = function (accountId_1) {
        return __awaiter(this, arguments, void 0, function (accountId, params) {
            var formattedAccountId, fields, paginationParams, queryParams, query, response;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formattedAccountId = this.auth.getAccountId(accountId);
                        fields = params.fields, paginationParams = __rest(params, ["fields"]);
                        queryParams = __assign({ fields: (fields === null || fields === void 0 ? void 0 : fields.join(",")) ||
                                "id,name,title,body,image_url,video_id,call_to_action,object_story_spec" }, paginationParams);
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(formattedAccountId, "/adcreatives?").concat(query), "GET", null, formattedAccountId)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(response)];
                }
            });
        });
    };
    MetaApiClient.prototype.createAdCreative = function (accountId, creativeData) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, body;
            return __generator(this, function (_a) {
                formattedAccountId = this.auth.getAccountId(accountId);
                body = this.buildQueryString(creativeData);
                return [2 /*return*/, this.makeRequest("".concat(formattedAccountId, "/adcreatives"), "POST", body, formattedAccountId, true)];
            });
        });
    };
    // Ad Management
    MetaApiClient.prototype.createAd = function (adSetId, adData) {
        return __awaiter(this, void 0, void 0, function () {
            var body, result, error_2, errorData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("=== CREATE AD DEBUG ===");
                        console.log("Ad Set ID:", adSetId);
                        console.log("Ad Data:", JSON.stringify(adData, null, 2));
                        body = this.buildQueryString(adData);
                        console.log("Request body:", body);
                        console.log("API endpoint:", "".concat(adSetId, "/ads"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest("".concat(adSetId, "/ads"), "POST", body, undefined, // Don't pass account ID for rate limiting since we don't have it
                            true)];
                    case 2:
                        result = _a.sent();
                        console.log("Create ad success:", JSON.stringify(result, null, 2));
                        console.log("=====================");
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _a.sent();
                        console.log("=== CREATE AD ERROR ===");
                        console.log("Error object:", error_2);
                        if (error_2 instanceof Error) {
                            console.log("Error message:", error_2.message);
                            // Try to parse Meta API error response
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
                                }
                            }
                            catch (parseError) {
                                console.log("Could not parse error as JSON, raw message:", error_2.message);
                            }
                        }
                        console.log("=====================");
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Ad Methods
    MetaApiClient.prototype.getAds = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var adsetId, campaignId, accountId, status, fields, paginationParams, endpoint, formattedAccountId, queryParams, query, response;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        adsetId = params.adsetId, campaignId = params.campaignId, accountId = params.accountId, status = params.status, fields = params.fields, paginationParams = __rest(params, ["adsetId", "campaignId", "accountId", "status", "fields"]);
                        if (adsetId) {
                            endpoint = "".concat(adsetId, "/ads");
                        }
                        else if (campaignId) {
                            endpoint = "".concat(campaignId, "/ads");
                        }
                        else if (accountId) {
                            formattedAccountId = this.auth.getAccountId(accountId);
                            endpoint = "".concat(formattedAccountId, "/ads");
                        }
                        else {
                            throw new Error("Either adsetId, campaignId, or accountId must be provided");
                        }
                        queryParams = __assign({ fields: (fields === null || fields === void 0 ? void 0 : fields.join(",")) ||
                                "id,name,adset_id,campaign_id,status,effective_status,created_time,updated_time,creative" }, paginationParams);
                        if (status) {
                            queryParams.effective_status = JSON.stringify([status]);
                        }
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(endpoint, "?").concat(query), "GET", null, accountId ? this.auth.getAccountId(accountId) : undefined)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(response)];
                }
            });
        });
    };
    MetaApiClient.prototype.getAdsByCampaign = function (campaignId_1) {
        return __awaiter(this, arguments, void 0, function (campaignId, params) {
            var queryParams, query, result;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryParams = {
                            fields: "id,name,status,effective_status,created_time,adset_id,creative",
                            limit: params.limit || 25,
                            after: params.after,
                            before: params.before,
                        };
                        if (params.status) {
                            queryParams.status = JSON.stringify(params.status);
                        }
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(campaignId, "/ads?").concat(query), "GET", undefined, undefined)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(result)];
                }
            });
        });
    };
    MetaApiClient.prototype.getAdsByAccount = function (accountId_1) {
        return __awaiter(this, arguments, void 0, function (accountId, params) {
            var formattedAccountId, queryParams, query, result;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formattedAccountId = this.auth.getAccountId(accountId);
                        queryParams = {
                            fields: "id,name,status,effective_status,created_time,adset_id,creative",
                            limit: params.limit || 25,
                            after: params.after,
                            before: params.before,
                        };
                        if (params.status) {
                            queryParams.status = JSON.stringify(params.status);
                        }
                        query = this.buildQueryString(queryParams);
                        return [4 /*yield*/, this.makeRequest("".concat(formattedAccountId, "/ads?").concat(query), "GET", undefined, formattedAccountId)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, pagination_js_1.PaginationHelper.parsePaginatedResponse(result)];
                }
            });
        });
    };
    // Account and Business Methods
    MetaApiClient.prototype.getAdAccount = function (accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, queryParams, query;
            return __generator(this, function (_a) {
                formattedAccountId = this.auth.getAccountId(accountId);
                queryParams = {
                    fields: "id,name,account_status,currency,timezone_name,funding_source_details,business",
                };
                query = this.buildQueryString(queryParams);
                return [2 /*return*/, this.makeRequest("".concat(formattedAccountId, "?").concat(query), "GET", undefined, formattedAccountId)];
            });
        });
    };
    MetaApiClient.prototype.getFundingSources = function (accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formattedAccountId = this.auth.getAccountId(accountId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest("".concat(formattedAccountId, "/funding_source_details"), "GET", undefined, formattedAccountId)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data || []];
                    case 3:
                        error_3 = _a.sent();
                        // Return empty array if no permission to access funding sources
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MetaApiClient.prototype.getAccountBusiness = function (accountId) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formattedAccountId = this.auth.getAccountId(accountId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest("".concat(formattedAccountId, "/business"), "GET", undefined, formattedAccountId)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        // Return empty object if no business info available
                        return [2 /*return*/, {}];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MetaApiClient.prototype.getCustomAudience = function (audienceId) {
        return __awaiter(this, void 0, void 0, function () {
            var queryParams, query;
            return __generator(this, function (_a) {
                queryParams = {
                    fields: "id,name,description,approximate_count,delivery_status,operation_status",
                };
                query = this.buildQueryString(queryParams);
                return [2 /*return*/, this.makeRequest("".concat(audienceId, "?").concat(query), "GET")];
            });
        });
    };
    // Batch Operations
    MetaApiClient.prototype.batchRequest = function (requests) {
        return __awaiter(this, void 0, void 0, function () {
            var body;
            return __generator(this, function (_a) {
                body = this.buildQueryString({
                    batch: JSON.stringify(requests),
                });
                return [2 /*return*/, this.makeRequest("", "POST", body, undefined, true)];
            });
        });
    };
    // Utility Methods
    MetaApiClient.prototype.estimateAudienceSize = function (accountId, targeting, optimizationGoal) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, queryParams, query;
            return __generator(this, function (_a) {
                formattedAccountId = this.auth.getAccountId(accountId);
                queryParams = {
                    targeting_spec: targeting,
                    optimization_goal: optimizationGoal,
                };
                query = this.buildQueryString(queryParams);
                return [2 /*return*/, this.makeRequest("".concat(formattedAccountId, "/delivery_estimate?").concat(query), "GET", null, formattedAccountId)];
            });
        });
    };
    MetaApiClient.prototype.generateAdPreview = function (creativeId, adFormat, productItemIds) {
        return __awaiter(this, void 0, void 0, function () {
            var queryParams, query;
            return __generator(this, function (_a) {
                queryParams = {
                    ad_format: adFormat,
                };
                if (productItemIds && productItemIds.length > 0) {
                    queryParams.product_item_ids = productItemIds;
                }
                query = this.buildQueryString(queryParams);
                return [2 /*return*/, this.makeRequest("".concat(creativeId, "/previews?").concat(query))];
            });
        });
    };
    // Helper method to get account ID for rate limiting
    MetaApiClient.prototype.extractAccountIdFromObjectId = function (objectId) {
        // Try to extract account ID from campaign/adset/ad ID patterns
        var campaign = objectId.match(/^(\d+)$/);
        if (campaign) {
            // For direct campaign/adset/ad IDs, we can't determine the account
            // This would need to be provided by the caller or cached
            return undefined;
        }
        // If it's already a formatted account ID
        if (objectId.startsWith("act_")) {
            return objectId;
        }
        return undefined;
    };
    // Image Upload for v23.0 compliance
    MetaApiClient.prototype.uploadImageFromUrl = function (accountId, imageUrl, imageName) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAccountId, imageResponse, imageBuffer, imageBlob, filename, formData, uploadResponse, uploadResult, images, imageKey, imageResult, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        formattedAccountId = this.auth.getAccountId(accountId);
                        console.log("=== IMAGE UPLOAD FROM URL DEBUG ===");
                        console.log("Account ID:", formattedAccountId);
                        console.log("Image URL:", imageUrl);
                        console.log("Image Name:", imageName);
                        // Download the image from the URL
                        console.log("Downloading image from URL...");
                        return [4 /*yield*/, (0, node_fetch_1.default)(imageUrl)];
                    case 1:
                        imageResponse = _a.sent();
                        if (!imageResponse.ok) {
                            throw new Error("Failed to download image: ".concat(imageResponse.status, " ").concat(imageResponse.statusText));
                        }
                        return [4 /*yield*/, imageResponse.arrayBuffer()];
                    case 2:
                        imageBuffer = _a.sent();
                        imageBlob = new Blob([imageBuffer], {
                            type: imageResponse.headers.get("content-type") || "image/jpeg",
                        });
                        console.log("Image downloaded, size:", imageBuffer.byteLength, "bytes");
                        console.log("Content type:", imageResponse.headers.get("content-type"));
                        filename = imageName || "uploaded_image_".concat(Date.now(), ".jpg");
                        formData = new FormData();
                        formData.append("filename", imageBlob, filename);
                        formData.append("access_token", this.auth.getAccessToken());
                        console.log("Uploading to Meta API...");
                        console.log("Endpoint:", "https://graph.facebook.com/v22.0/".concat(formattedAccountId, "/adimages"));
                        return [4 /*yield*/, (0, node_fetch_1.default)("https://graph.facebook.com/v23.0/".concat(formattedAccountId, "/adimages"), {
                                method: "POST",
                                body: formData,
                            })];
                    case 3:
                        uploadResponse = _a.sent();
                        return [4 /*yield*/, uploadResponse.json()];
                    case 4:
                        uploadResult = (_a.sent());
                        console.log("Upload response:", JSON.stringify(uploadResult, null, 2));
                        if (!uploadResponse.ok) {
                            console.log("Upload failed with status:", uploadResponse.status);
                            throw new Error("Image upload failed: ".concat(JSON.stringify(uploadResult)));
                        }
                        images = uploadResult.images;
                        if (!images || Object.keys(images).length === 0) {
                            throw new Error("No image hash returned from Meta API");
                        }
                        imageKey = Object.keys(images)[0];
                        imageResult = images[imageKey];
                        if (!imageResult.hash) {
                            throw new Error("No hash found in image upload response");
                        }
                        console.log("Image uploaded successfully!");
                        console.log("Image hash:", imageResult.hash);
                        console.log("Image URL:", imageResult.url);
                        console.log("===================================");
                        return [2 /*return*/, {
                                hash: imageResult.hash,
                                url: imageResult.url || imageUrl,
                                name: filename,
                            }];
                    case 5:
                        error_5 = _a.sent();
                        console.log("=== IMAGE UPLOAD ERROR ===");
                        console.log("Error:", error_5);
                        console.log("=========================");
                        throw error_5;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return MetaApiClient;
}());
exports.MetaApiClient = MetaApiClient;
