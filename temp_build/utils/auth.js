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
exports.AuthManager = void 0;
var AuthManager = /** @class */ (function () {
    function AuthManager(config) {
        this.config = config;
        this.validateConfig();
    }
    AuthManager.prototype.validateConfig = function () {
        if (!this.config.accessToken) {
            throw new Error("Meta access token is required. Set META_ACCESS_TOKEN environment variable.");
        }
        if (this.config.accessToken.length < 10) {
            throw new Error("Invalid Meta access token format.");
        }
    };
    AuthManager.prototype.getAccessToken = function () {
        return this.config.accessToken;
    };
    AuthManager.prototype.getApiVersion = function () {
        return this.config.apiVersion || "v23.0";
    };
    AuthManager.prototype.getBaseUrl = function () {
        return this.config.baseUrl || "https://graph.facebook.com";
    };
    AuthManager.prototype.getAuthHeaders = function () {
        return {
            Authorization: "Bearer ".concat(this.getAccessToken()),
            "Content-Type": "application/json",
            "User-Agent": "meta-ads-mcp/1.0.0",
        };
    };
    AuthManager.prototype.validateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.getBaseUrl(), "/").concat(this.getApiVersion(), "/me?access_token=").concat(this.getAccessToken()))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.ok];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Token validation failed:", error_1);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuthManager.fromEnvironment = function () {
        var config = {
            accessToken: process.env.META_ACCESS_TOKEN || "",
            appId: process.env.META_APP_ID,
            appSecret: process.env.META_APP_SECRET,
            businessId: process.env.META_BUSINESS_ID,
            apiVersion: process.env.META_API_VERSION,
            baseUrl: process.env.META_BASE_URL,
            // OAuth configuration
            redirectUri: process.env.META_REDIRECT_URI,
            refreshToken: process.env.META_REFRESH_TOKEN,
            autoRefresh: process.env.META_AUTO_REFRESH === "true",
        };
        return new AuthManager(config);
    };
    AuthManager.prototype.refreshTokenIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2, isValid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.autoRefresh) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.autoRefreshToken()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        console.warn("Auto-refresh failed, falling back to validation:", error_2);
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, this.validateToken()];
                    case 5:
                        isValid = _a.sent();
                        if (!isValid) {
                            throw new Error("Access token is invalid or expired. Please generate a new token or enable auto-refresh.");
                        }
                        return [2 /*return*/, this.config.accessToken];
                }
            });
        });
    };
    AuthManager.prototype.getAccountId = function (accountIdOrNumber) {
        if (accountIdOrNumber.startsWith("act_")) {
            return accountIdOrNumber;
        }
        return "act_".concat(accountIdOrNumber);
    };
    AuthManager.prototype.extractAccountNumber = function (accountId) {
        if (accountId.startsWith("act_")) {
            return accountId.substring(4);
        }
        return accountId;
    };
    // OAuth Methods
    /**
     * Generate OAuth authorization URL for user consent
     */
    AuthManager.prototype.generateAuthUrl = function (scopes, state) {
        if (scopes === void 0) { scopes = ["ads_management"]; }
        if (!this.config.appId || !this.config.redirectUri) {
            throw new Error("App ID and redirect URI are required for OAuth flow");
        }
        var params = new URLSearchParams(__assign({ client_id: this.config.appId, redirect_uri: this.config.redirectUri, scope: scopes.join(","), response_type: "code" }, (state && { state: state })));
        return "https://www.facebook.com/v".concat(this.getApiVersion(), "/dialog/oauth?").concat(params.toString());
    };
    /**
     * Exchange authorization code for access token
     */
    AuthManager.prototype.exchangeCodeForToken = function (code) {
        return __awaiter(this, void 0, void 0, function () {
            var params, response, error, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.appId || !this.config.appSecret || !this.config.redirectUri) {
                            throw new Error("App ID, app secret, and redirect URI are required for token exchange");
                        }
                        params = new URLSearchParams({
                            client_id: this.config.appId,
                            client_secret: this.config.appSecret,
                            redirect_uri: this.config.redirectUri,
                            code: code,
                        });
                        return [4 /*yield*/, fetch("".concat(this.getBaseUrl(), "/").concat(this.getApiVersion(), "/oauth/access_token"), {
                                method: "POST",
                                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                body: params.toString(),
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        error = _a.sent();
                        throw new Error("Token exchange failed: ".concat(error));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        // Update config with new token
                        this.config.accessToken = data.access_token;
                        if (data.expires_in) {
                            this.config.tokenExpiration = new Date(Date.now() + data.expires_in * 1000);
                        }
                        return [2 /*return*/, {
                                accessToken: data.access_token,
                                tokenType: data.token_type || "bearer",
                                expiresIn: data.expires_in,
                            }];
                }
            });
        });
    };
    /**
     * Exchange short-lived token for long-lived token
     */
    AuthManager.prototype.exchangeForLongLivedToken = function (shortLivedToken) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenToExchange, params, response, error, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.appId || !this.config.appSecret) {
                            throw new Error("App ID and app secret are required for long-lived token exchange");
                        }
                        tokenToExchange = shortLivedToken || this.config.accessToken;
                        if (!tokenToExchange) {
                            throw new Error("No access token available for exchange");
                        }
                        params = new URLSearchParams({
                            grant_type: "fb_exchange_token",
                            client_id: this.config.appId,
                            client_secret: this.config.appSecret,
                            fb_exchange_token: tokenToExchange,
                        });
                        return [4 /*yield*/, fetch("".concat(this.getBaseUrl(), "/").concat(this.getApiVersion(), "/oauth/access_token?").concat(params.toString()))];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        error = _a.sent();
                        throw new Error("Long-lived token exchange failed: ".concat(error));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        // Update config with new long-lived token
                        this.config.accessToken = data.access_token;
                        this.config.tokenExpiration = new Date(Date.now() + data.expires_in * 1000);
                        return [2 /*return*/, {
                                accessToken: data.access_token,
                                tokenType: data.token_type || "bearer",
                                expiresIn: data.expires_in,
                            }];
                }
            });
        });
    };
    /**
     * Check if token is expired or will expire soon
     */
    AuthManager.prototype.isTokenExpiring = function (bufferMinutes) {
        if (bufferMinutes === void 0) { bufferMinutes = 5; }
        if (!this.config.tokenExpiration) {
            return false; // No expiration set, assume it's valid
        }
        var bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds
        var expirationWithBuffer = new Date(this.config.tokenExpiration.getTime() - bufferTime);
        return new Date() >= expirationWithBuffer;
    };
    /**
     * Automatically refresh token if needed
     */
    AuthManager.prototype.autoRefreshToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.autoRefresh) {
                            return [2 /*return*/, this.config.accessToken];
                        }
                        if (!this.isTokenExpiring()) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log("Token is expiring, attempting refresh...");
                        return [4 /*yield*/, this.exchangeForLongLivedToken()];
                    case 2:
                        result = _a.sent();
                        console.log("Token refreshed successfully");
                        return [2 /*return*/, result.accessToken];
                    case 3:
                        error_3 = _a.sent();
                        console.error("Auto-refresh failed:", error_3);
                        throw new Error("Token expired and auto-refresh failed. Please re-authenticate.");
                    case 4: return [2 /*return*/, this.config.accessToken];
                }
            });
        });
    };
    /**
     * Generate system user access token (for server-to-server apps)
     */
    AuthManager.prototype.generateSystemUserToken = function (systemUserId_1) {
        return __awaiter(this, arguments, void 0, function (systemUserId, scopes, expiringToken) {
            var crypto, appSecretProof, params, response, error, data;
            if (scopes === void 0) { scopes = ["ads_management"]; }
            if (expiringToken === void 0) { expiringToken = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.appId || !this.config.appSecret) {
                            throw new Error("App ID and app secret are required for system user token");
                        }
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("crypto"); })];
                    case 1:
                        crypto = _a.sent();
                        appSecretProof = crypto
                            .createHmac("sha256", this.config.appSecret)
                            .update(this.config.accessToken)
                            .digest("hex");
                        params = new URLSearchParams(__assign({ business_app: this.config.appId, scope: scopes.join(","), appsecret_proof: appSecretProof, access_token: this.config.accessToken }, (expiringToken && { set_token_expires_in_60_days: "true" })));
                        return [4 /*yield*/, fetch("".concat(this.getBaseUrl(), "/").concat(this.getApiVersion(), "/").concat(systemUserId, "/access_tokens"), {
                                method: "POST",
                                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                body: params.toString(),
                            })];
                    case 2:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        error = _a.sent();
                        throw new Error("System user token generation failed: ".concat(error));
                    case 4: return [4 /*yield*/, response.json()];
                    case 5:
                        data = _a.sent();
                        return [2 /*return*/, {
                                accessToken: data.access_token,
                                tokenType: "bearer",
                                expiresIn: data.expires_in,
                            }];
                }
            });
        });
    };
    /**
     * Get token info and validation details
     */
    AuthManager.prototype.getTokenInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, data, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.getBaseUrl(), "/").concat(this.getApiVersion(), "/debug_token?input_token=").concat(this.getAccessToken(), "&access_token=").concat(this.getAccessToken()))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to get token info");
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        data = result.data;
                        return [2 /*return*/, {
                                appId: data.app_id,
                                userId: data.user_id,
                                scopes: data.scopes || [],
                                expiresAt: data.expires_at ? new Date(data.expires_at * 1000) : undefined,
                                isValid: data.is_valid || false,
                            }];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Token info retrieval failed:", error_4);
                        return [2 /*return*/, {
                                appId: "",
                                scopes: [],
                                isValid: false,
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AuthManager;
}());
exports.AuthManager = AuthManager;
