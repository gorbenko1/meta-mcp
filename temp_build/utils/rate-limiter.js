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
exports.globalRateLimiter = exports.RateLimitError = exports.RateLimiter = void 0;
var RateLimiter = /** @class */ (function () {
    function RateLimiter(isDevelopmentTier) {
        if (isDevelopmentTier === void 0) { isDevelopmentTier = false; }
        this.accountStates = new Map();
        this.config = isDevelopmentTier
            ? {
                maxScore: 60,
                decayTimeMs: 300000, // 5 minutes
                blockTimeMs: 300000, // 5 minutes
                readCallScore: 1,
                writeCallScore: 3,
            }
            : {
                maxScore: 9000,
                decayTimeMs: 300000, // 5 minutes
                blockTimeMs: 60000, // 1 minute
                readCallScore: 1,
                writeCallScore: 3,
            };
    }
    RateLimiter.prototype.getAccountState = function (accountId) {
        if (!this.accountStates.has(accountId)) {
            this.accountStates.set(accountId, {
                currentScore: 0,
                lastDecayTime: Date.now(),
                isBlocked: false,
                blockUntil: 0,
            });
        }
        return this.accountStates.get(accountId);
    };
    RateLimiter.prototype.updateScore = function (accountId) {
        var state = this.getAccountState(accountId);
        var now = Date.now();
        // Calculate decay since last update
        var timeSinceLastDecay = now - state.lastDecayTime;
        var decayPeriods = Math.floor(timeSinceLastDecay / this.config.decayTimeMs);
        if (decayPeriods > 0) {
            // Apply exponential decay
            state.currentScore = Math.max(0, state.currentScore * Math.pow(0.5, decayPeriods));
            state.lastDecayTime = now;
        }
        // Check if block period has expired
        if (state.isBlocked && now >= state.blockUntil) {
            state.isBlocked = false;
            state.blockUntil = 0;
        }
    };
    RateLimiter.prototype.checkRateLimit = function (accountId_1) {
        return __awaiter(this, arguments, void 0, function (accountId, isWriteCall) {
            var state, waitTime, callScore;
            if (isWriteCall === void 0) { isWriteCall = false; }
            return __generator(this, function (_a) {
                this.updateScore(accountId);
                state = this.getAccountState(accountId);
                if (state.isBlocked) {
                    waitTime = Math.max(0, state.blockUntil - Date.now());
                    throw new RateLimitError("Rate limit exceeded for account ".concat(accountId, ". Please wait ").concat(Math.ceil(waitTime / 1000), " seconds."), waitTime);
                }
                callScore = isWriteCall
                    ? this.config.writeCallScore
                    : this.config.readCallScore;
                if (state.currentScore + callScore > this.config.maxScore) {
                    // Block the account
                    state.isBlocked = true;
                    state.blockUntil = Date.now() + this.config.blockTimeMs;
                    throw new RateLimitError("Rate limit exceeded for account ".concat(accountId, ". Blocked for ").concat(this.config.blockTimeMs / 1000, " seconds."), this.config.blockTimeMs);
                }
                // Add the score for this call
                state.currentScore += callScore;
                return [2 /*return*/];
            });
        });
    };
    RateLimiter.prototype.getCurrentScore = function (accountId) {
        this.updateScore(accountId);
        return this.getAccountState(accountId).currentScore;
    };
    RateLimiter.prototype.getRemainingCapacity = function (accountId) {
        this.updateScore(accountId);
        var state = this.getAccountState(accountId);
        return Math.max(0, this.config.maxScore - state.currentScore);
    };
    RateLimiter.prototype.isAccountBlocked = function (accountId) {
        this.updateScore(accountId);
        return this.getAccountState(accountId).isBlocked;
    };
    RateLimiter.prototype.getBlockTimeRemaining = function (accountId) {
        this.updateScore(accountId);
        var state = this.getAccountState(accountId);
        if (!state.isBlocked)
            return 0;
        return Math.max(0, state.blockUntil - Date.now());
    };
    RateLimiter.prototype.waitForCapacity = function (accountId_1) {
        return __awaiter(this, arguments, void 0, function (accountId, requiredScore) {
            var maxWaitTime, pollInterval, waitTime, state, blockTimeRemaining;
            if (requiredScore === void 0) { requiredScore = 1; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        maxWaitTime = 60000;
                        pollInterval = 1000;
                        waitTime = 0;
                        _a.label = 1;
                    case 1:
                        if (!(waitTime < maxWaitTime)) return [3 /*break*/, 3];
                        this.updateScore(accountId);
                        state = this.getAccountState(accountId);
                        if (!state.isBlocked &&
                            state.currentScore + requiredScore <= this.config.maxScore) {
                            return [2 /*return*/]; // Capacity available
                        }
                        if (state.isBlocked) {
                            blockTimeRemaining = this.getBlockTimeRemaining(accountId);
                            if (blockTimeRemaining > maxWaitTime - waitTime) {
                                throw new RateLimitError("Rate limit block time (".concat(Math.ceil(blockTimeRemaining / 1000), "s) exceeds maximum wait time"), blockTimeRemaining);
                            }
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, pollInterval); })];
                    case 2:
                        _a.sent();
                        waitTime += pollInterval;
                        return [3 /*break*/, 1];
                    case 3: throw new RateLimitError("Could not acquire rate limit capacity after ".concat(maxWaitTime / 1000, " seconds"), 0);
                }
            });
        });
    };
    return RateLimiter;
}());
exports.RateLimiter = RateLimiter;
var RateLimitError = /** @class */ (function (_super) {
    __extends(RateLimitError, _super);
    function RateLimitError(message, retryAfterMs) {
        var _this = _super.call(this, message) || this;
        _this.retryAfterMs = retryAfterMs;
        _this.name = "RateLimitError";
        return _this;
    }
    return RateLimitError;
}(Error));
exports.RateLimitError = RateLimitError;
// Singleton instance for global rate limiting
exports.globalRateLimiter = new RateLimiter(process.env.META_API_TIER === "development");
