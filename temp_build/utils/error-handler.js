"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.MetaUserLimitError = exports.MetaApplicationLimitError = exports.MetaValidationError = exports.MetaPermissionError = exports.MetaAuthError = exports.MetaApiProcessingError = exports.MetaApiErrorHandler = void 0;
exports.retryWithBackoff = retryWithBackoff;
var rate_limiter_js_1 = require("./rate-limiter.js");
var MetaApiErrorHandler = /** @class */ (function () {
    function MetaApiErrorHandler() {
    }
    MetaApiErrorHandler.isMetaApiError = function (error) {
        return error && error.error && typeof error.error.code === "number";
    };
    MetaApiErrorHandler.handleResponse = function (response) {
        return __awaiter(this, void 0, void 0, function () {
            var responseText, errorData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, response.text()];
                    case 1:
                        responseText = _a.sent();
                        if (!response.ok) {
                            errorData = void 0;
                            try {
                                errorData = JSON.parse(responseText);
                            }
                            catch (_b) {
                                throw new MetaApiProcessingError("HTTP ".concat(response.status, ": ").concat(responseText), response.status);
                            }
                            if (this.isMetaApiError(errorData)) {
                                throw this.createSpecificError(errorData, response.status);
                            }
                            throw new MetaApiProcessingError("HTTP ".concat(response.status, ": ").concat(responseText), response.status);
                        }
                        try {
                            return [2 /*return*/, JSON.parse(responseText)];
                        }
                        catch (_c) {
                            return [2 /*return*/, responseText];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    MetaApiErrorHandler.createSpecificError = function (errorData, _httpStatus) {
        var error = errorData.error;
        var code = error.code, error_subcode = error.error_subcode, message = error.message, type = error.type;
        // Rate limiting errors
        if (code === 17 && error_subcode === 2446079) {
            return new rate_limiter_js_1.RateLimitError(message, 300000); // 5 minutes
        }
        if (code === 613 && error_subcode === 1487742) {
            return new rate_limiter_js_1.RateLimitError(message, 60000); // 1 minute
        }
        if (code === 4 &&
            (error_subcode === 1504022 || error_subcode === 1504039)) {
            return new rate_limiter_js_1.RateLimitError(message, 300000); // 5 minutes
        }
        // Authentication errors
        if (code === 190) {
            return new MetaAuthError(message, code, error_subcode);
        }
        // Permission errors
        if (code === 200 || code === 10) {
            return new MetaPermissionError(message, code, error_subcode);
        }
        // Validation errors
        if (code === 100) {
            return new MetaValidationError(message, code, error_subcode);
        }
        // Application request limit
        if (code === 4) {
            return new MetaApplicationLimitError(message, code, error_subcode);
        }
        // User request limit
        if (code === 17) {
            return new MetaUserLimitError(message, code, error_subcode);
        }
        // Generic Meta API error
        return new MetaApiProcessingError(message, undefined, code, error_subcode, type);
    };
    MetaApiErrorHandler.shouldRetry = function (error) {
        if (error instanceof rate_limiter_js_1.RateLimitError)
            return true;
        if (error instanceof MetaApplicationLimitError)
            return true;
        if (error instanceof MetaUserLimitError)
            return true;
        if (error instanceof MetaApiProcessingError) {
            // Retry on server errors
            return (error.httpStatus || 0) >= 500;
        }
        return false;
    };
    MetaApiErrorHandler.getRetryDelay = function (error, attempt) {
        if (error instanceof rate_limiter_js_1.RateLimitError) {
            return error.retryAfterMs;
        }
        // Exponential backoff with jitter
        var baseDelay = Math.min(1000 * Math.pow(2, attempt), 60000); // Cap at 1 minute
        var jitter = Math.random() * 1000; // Add up to 1 second of jitter
        return baseDelay + jitter;
    };
    MetaApiErrorHandler.getMaxRetries = function (error) {
        if (error instanceof rate_limiter_js_1.RateLimitError)
            return 3;
        if (error instanceof MetaApplicationLimitError)
            return 2;
        if (error instanceof MetaUserLimitError)
            return 2;
        if (error instanceof MetaApiProcessingError &&
            (error.httpStatus || 0) >= 500)
            return 3;
        return 0; // No retry for other errors
    };
    return MetaApiErrorHandler;
}());
exports.MetaApiErrorHandler = MetaApiErrorHandler;
var MetaApiProcessingError = /** @class */ (function (_super) {
    __extends(MetaApiProcessingError, _super);
    function MetaApiProcessingError(message, httpStatus, errorCode, errorSubcode, errorType) {
        var _this = _super.call(this, message) || this;
        _this.httpStatus = httpStatus;
        _this.errorCode = errorCode;
        _this.errorSubcode = errorSubcode;
        _this.errorType = errorType;
        _this.name = "MetaApiError";
        return _this;
    }
    MetaApiProcessingError.prototype.toJSON = function () {
        return {
            name: this.name,
            message: this.message,
            httpStatus: this.httpStatus,
            errorCode: this.errorCode,
            errorSubcode: this.errorSubcode,
            errorType: this.errorType,
        };
    };
    return MetaApiProcessingError;
}(Error));
exports.MetaApiProcessingError = MetaApiProcessingError;
var MetaAuthError = /** @class */ (function (_super) {
    __extends(MetaAuthError, _super);
    function MetaAuthError(message, errorCode, errorSubcode) {
        var _this = _super.call(this, message, 401, errorCode, errorSubcode, "OAuthException") || this;
        _this.name = "MetaAuthError";
        return _this;
    }
    return MetaAuthError;
}(MetaApiProcessingError));
exports.MetaAuthError = MetaAuthError;
var MetaPermissionError = /** @class */ (function (_super) {
    __extends(MetaPermissionError, _super);
    function MetaPermissionError(message, errorCode, errorSubcode) {
        var _this = _super.call(this, message, 403, errorCode, errorSubcode, "FacebookApiException") || this;
        _this.name = "MetaPermissionError";
        return _this;
    }
    return MetaPermissionError;
}(MetaApiProcessingError));
exports.MetaPermissionError = MetaPermissionError;
var MetaValidationError = /** @class */ (function (_super) {
    __extends(MetaValidationError, _super);
    function MetaValidationError(message, errorCode, errorSubcode) {
        var _this = _super.call(this, message, 400, errorCode, errorSubcode, "FacebookApiException") || this;
        _this.name = "MetaValidationError";
        return _this;
    }
    return MetaValidationError;
}(MetaApiProcessingError));
exports.MetaValidationError = MetaValidationError;
var MetaApplicationLimitError = /** @class */ (function (_super) {
    __extends(MetaApplicationLimitError, _super);
    function MetaApplicationLimitError(message, errorCode, errorSubcode) {
        var _this = _super.call(this, message, 429, errorCode, errorSubcode, "ApplicationRequestLimitReached") || this;
        _this.name = "MetaApplicationLimitError";
        return _this;
    }
    return MetaApplicationLimitError;
}(MetaApiProcessingError));
exports.MetaApplicationLimitError = MetaApplicationLimitError;
var MetaUserLimitError = /** @class */ (function (_super) {
    __extends(MetaUserLimitError, _super);
    function MetaUserLimitError(message, errorCode, errorSubcode) {
        var _this = _super.call(this, message, 429, errorCode, errorSubcode, "UserRequestLimitReached") || this;
        _this.name = "MetaUserLimitError";
        return _this;
    }
    return MetaUserLimitError;
}(MetaApiProcessingError));
exports.MetaUserLimitError = MetaUserLimitError;
function retryWithBackoff(operation_1) {
    return __awaiter(this, arguments, void 0, function (operation, context) {
        var lastError, attempt, maxRetries, _loop_1, state_1;
        if (context === void 0) { context = "operation"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attempt = 0;
                    maxRetries = 3;
                    _loop_1 = function () {
                        var _b, error_1, maxRetriesForError, delay_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 4]);
                                    _b = {};
                                    return [4 /*yield*/, operation()];
                                case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                case 2:
                                    error_1 = _c.sent();
                                    lastError = error_1;
                                    attempt++;
                                    if (!MetaApiErrorHandler.shouldRetry(lastError)) {
                                        throw lastError;
                                    }
                                    maxRetriesForError = MetaApiErrorHandler.getMaxRetries(lastError);
                                    if (attempt > maxRetriesForError) {
                                        throw new Error("".concat(context, " failed after ").concat(maxRetriesForError, " retries. Last error: ").concat(lastError.message));
                                    }
                                    delay_1 = MetaApiErrorHandler.getRetryDelay(lastError, attempt);
                                    console.warn("".concat(context, " failed (attempt ").concat(attempt, "/").concat(maxRetriesForError, "), retrying in ").concat(delay_1, "ms: ").concat(lastError.message));
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                case 3:
                                    _c.sent();
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxRetries)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    return [3 /*break*/, 1];
                case 3: 
                // This should never be reached, but TypeScript requires it
                throw lastError || new Error("".concat(context, " failed after exhausting all retries"));
            }
        });
    });
}
