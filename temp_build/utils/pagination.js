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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationHelper = void 0;
var PaginationHelper = /** @class */ (function () {
    function PaginationHelper() {
    }
    PaginationHelper.buildPaginationParams = function (params) {
        var urlParams = new URLSearchParams();
        if (params.limit !== undefined && params.limit > 0) {
            urlParams.set("limit", params.limit.toString());
        }
        if (params.after) {
            urlParams.set("after", params.after);
        }
        if (params.before) {
            urlParams.set("before", params.before);
        }
        return urlParams;
    };
    PaginationHelper.parsePaginatedResponse = function (response) {
        var _a, _b, _c, _d, _e, _f;
        var hasNextPage = Boolean(((_a = response.paging) === null || _a === void 0 ? void 0 : _a.next) || ((_c = (_b = response.paging) === null || _b === void 0 ? void 0 : _b.cursors) === null || _c === void 0 ? void 0 : _c.after));
        var hasPreviousPage = Boolean(((_d = response.paging) === null || _d === void 0 ? void 0 : _d.previous) || ((_f = (_e = response.paging) === null || _e === void 0 ? void 0 : _e.cursors) === null || _f === void 0 ? void 0 : _f.before));
        return {
            data: response.data || [],
            paging: response.paging,
            hasNextPage: hasNextPage,
            hasPreviousPage: hasPreviousPage,
        };
    };
    PaginationHelper.getNextPageParams = function (result, currentLimit) {
        var _a, _b;
        if (!result.hasNextPage || !((_b = (_a = result.paging) === null || _a === void 0 ? void 0 : _a.cursors) === null || _b === void 0 ? void 0 : _b.after)) {
            return null;
        }
        return {
            after: result.paging.cursors.after,
            limit: currentLimit,
        };
    };
    PaginationHelper.getPreviousPageParams = function (result, currentLimit) {
        var _a, _b;
        if (!result.hasPreviousPage || !((_b = (_a = result.paging) === null || _a === void 0 ? void 0 : _a.cursors) === null || _b === void 0 ? void 0 : _b.before)) {
            return null;
        }
        return {
            before: result.paging.cursors.before,
            limit: currentLimit,
        };
    };
    PaginationHelper.fetchAllPages = function (fetchPage_1) {
        return __asyncGenerator(this, arguments, function fetchAllPages_1(fetchPage, initialParams, maxPages) {
            var currentParams, pageCount, result, nextParams;
            if (initialParams === void 0) { initialParams = {}; }
            if (maxPages === void 0) { maxPages = 100; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentParams = __assign({}, initialParams);
                        pageCount = 0;
                        _a.label = 1;
                    case 1:
                        if (!(pageCount < maxPages)) return [3 /*break*/, 5];
                        return [4 /*yield*/, __await(fetchPage(currentParams))];
                    case 2:
                        result = _a.sent();
                        return [4 /*yield*/, __await(result.data)];
                    case 3: return [4 /*yield*/, _a.sent()];
                    case 4:
                        _a.sent();
                        pageCount++;
                        if (!result.hasNextPage) {
                            return [3 /*break*/, 5];
                        }
                        nextParams = this.getNextPageParams(result, currentParams.limit);
                        if (!nextParams) {
                            return [3 /*break*/, 5];
                        }
                        currentParams = __assign(__assign({}, currentParams), nextParams);
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PaginationHelper.collectAllPages = function (fetchPage_1) {
        return __awaiter(this, arguments, void 0, function (fetchPage, initialParams, maxPages, maxItems) {
            var allItems, _a, _b, _c, pageData, e_1_1;
            var _d, e_1, _e, _f;
            if (initialParams === void 0) { initialParams = {}; }
            if (maxPages === void 0) { maxPages = 50; }
            if (maxItems === void 0) { maxItems = 5000; }
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        allItems = [];
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 6, 7, 12]);
                        _a = true, _b = __asyncValues(this.fetchAllPages(fetchPage, initialParams, maxPages));
                        _g.label = 2;
                    case 2: return [4 /*yield*/, _b.next()];
                    case 3:
                        if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 5];
                        _f = _c.value;
                        _a = false;
                        pageData = _f;
                        allItems.push.apply(allItems, pageData);
                        if (allItems.length >= maxItems) {
                            allItems.splice(maxItems); // Trim to max items
                            return [3 /*break*/, 5];
                        }
                        _g.label = 4;
                    case 4:
                        _a = true;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_1_1 = _g.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _g.trys.push([7, , 10, 11]);
                        if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _e.call(_b)];
                    case 8:
                        _g.sent();
                        _g.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [2 /*return*/, allItems];
                }
            });
        });
    };
    PaginationHelper.createBatchedRequests = function (items, batchSize) {
        if (batchSize === void 0) { batchSize = 50; }
        var batches = [];
        for (var i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    };
    PaginationHelper.processBatchedRequests = function (items_1, processor_1) {
        return __awaiter(this, arguments, void 0, function (items, processor, batchSize, delayMs) {
            var batches, results, i, batch, batchResults, error_1;
            if (batchSize === void 0) { batchSize = 50; }
            if (delayMs === void 0) { delayMs = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        batches = this.createBatchedRequests(items, batchSize);
                        results = [];
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < batches.length)) return [3 /*break*/, 8];
                        batch = batches[i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, processor(batch)];
                    case 3:
                        batchResults = _a.sent();
                        results.push.apply(results, batchResults);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Batch ".concat(i + 1, "/").concat(batches.length, " failed:"), error_1);
                        throw error_1;
                    case 5:
                        if (!(i < batches.length - 1 && delayMs > 0)) return [3 /*break*/, 7];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayMs); })];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        i++;
                        return [3 /*break*/, 1];
                    case 8: return [2 /*return*/, results];
                }
            });
        });
    };
    PaginationHelper.extractCursorFromUrl = function (url) {
        if (!url)
            return undefined;
        try {
            var urlObj = new URL(url);
            return (urlObj.searchParams.get("after") ||
                urlObj.searchParams.get("before") ||
                undefined);
        }
        catch (_a) {
            return undefined;
        }
    };
    PaginationHelper.buildPageInfo = function (result) {
        var _a, _b, _c, _d;
        return {
            hasNextPage: result.hasNextPage,
            hasPreviousPage: result.hasPreviousPage,
            startCursor: (_b = (_a = result.paging) === null || _a === void 0 ? void 0 : _a.cursors) === null || _b === void 0 ? void 0 : _b.before,
            endCursor: (_d = (_c = result.paging) === null || _c === void 0 ? void 0 : _c.cursors) === null || _d === void 0 ? void 0 : _d.after,
            totalCount: result.totalCount,
        };
    };
    return PaginationHelper;
}());
exports.PaginationHelper = PaginationHelper;
