/**
 * Mock implementation of MetaApiClient for testing
 * Provides comprehensive mocking with call tracking and response simulation
 */

import type {
  Campaign,
  AdSet,
  Ad,
  AdCreative,
  AdInsights,
  CustomAudience,
  AdAccount,
  MetaApiResponse,
  BatchRequest,
  BatchResponse,
  MetaApiError,
} from "../../src/types/meta-api.js";
import type { PaginatedResult } from "../../src/utils/pagination.js";
import { FixtureLoader } from "./fixture-loader.js";
import { MockResponseManager } from "./mock-response-manager.js";

export interface MockCall {
  method: string;
  endpoint: string;
  params: any;
  body?: any;
  timestamp: Date;
  response?: any;
  error?: Error;
  accountId?: string;
}

export interface MockResponse {
  data?: any;
  error?: MetaApiError;
  delay?: number;
  shouldFail?: boolean;
}

export interface MockClientConfig {
  defaultDelay?: number;
  enableCallTracking?: boolean;
  autoGenerateResponses?: boolean;
  strictMode?: boolean;
}

/**
 * Mock MetaApiClient that simulates real Meta API behavior
 * Supports response simulation, error injection, and call tracking
 */
export class MockMetaApiClient {
  private callHistory: MockCall[] = [];
  private config: MockClientConfig;
  private fixtureLoader: FixtureLoader;
  private responseManager: MockResponseManager;

  constructor(config: MockClientConfig = {}) {
    this.config = {
      defaultDelay: 0,
      enableCallTracking: true,
      autoGenerateResponses: true,
      strictMode: false,
      ...config,
    };
    this.fixtureLoader = new FixtureLoader();
    this.responseManager = new MockResponseManager();

    // Setup common patterns if auto-generate is enabled
    if (this.config.autoGenerateResponses) {
      this.responseManager.setupCommonPatterns();
    }
  }

  // Configuration methods
  setMockResponse(methodKey: string, response: MockResponse): void {
    this.responseManager.setResponse(methodKey, {
      data: response.data,
      error: response.error,
      delay: response.delay,
      shouldFail: response.shouldFail,
    });
  }

  setMockError(methodKey: string, error: MetaApiError, delay?: number): void {
    this.responseManager.setError(methodKey, error, delay);
  }

  resetMocks(): void {
    this.responseManager.reset();
    this.callHistory = [];
  }

  // Additional response manager methods
  activateErrorScenario(scenarioName: string): void {
    this.responseManager.activateErrorScenario(scenarioName);
  }

  getResponseManager(): MockResponseManager {
    return this.responseManager;
  }

  getCallHistory(): MockCall[] {
    return [...this.callHistory];
  }

  getLastCall(): MockCall | undefined {
    return this.callHistory[this.callHistory.length - 1];
  }

  getCallsForMethod(method: string): MockCall[] {
    return this.callHistory.filter((call) => call.method === method);
  }

  // Private helper methods
  private async simulateDelay(delay?: number): Promise<void> {
    const actualDelay = delay ?? this.config.defaultDelay ?? 0;
    if (actualDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  private trackCall(
    method: string,
    endpoint: string,
    params: any,
    body?: any,
    accountId?: string
  ): void {
    if (this.config.enableCallTracking) {
      this.callHistory.push({
        method,
        endpoint,
        params,
        body,
        timestamp: new Date(),
        accountId,
      });
    }
  }

  private async executeCall<T>(
    methodKey: string,
    method: string,
    endpoint: string,
    params: any,
    body?: any,
    accountId?: string,
    defaultResponse?: () => T
  ): Promise<T> {
    this.trackCall(method, endpoint, params, body, accountId);

    // Get response configuration from response manager
    const mockResponse = this.responseManager.getResponse(methodKey, params);

    if (mockResponse) {
      await this.simulateDelay(mockResponse.delay);

      if (mockResponse.shouldFail && mockResponse.error) {
        throw new Error(JSON.stringify(mockResponse.error));
      }

      // Handle function responses
      if (typeof mockResponse.data === "function") {
        return mockResponse.data() as T;
      }

      return mockResponse.data as T;
    }

    // Auto-generate response if enabled and default response provided
    if (this.config.autoGenerateResponses && defaultResponse) {
      await this.simulateDelay();
      return defaultResponse();
    }

    // Strict mode throws error if no mock response configured
    if (this.config.strictMode) {
      throw new Error(`No mock response configured for method: ${methodKey}`);
    }

    // Default fallback
    await this.simulateDelay();
    return defaultResponse ? defaultResponse() : ({} as T);
  }

  // Account Methods
  async getAdAccounts(): Promise<AdAccount[]> {
    return this.executeCall(
      "getAdAccounts",
      "GET",
      "me/adaccounts",
      {},
      undefined,
      undefined,
      () => this.fixtureLoader.getAdAccounts()
    );
  }

  async getAdAccount(accountId: string): Promise<AdAccount> {
    return this.executeCall(
      `getAdAccount:${accountId}`,
      "GET",
      `${accountId}`,
      {},
      undefined,
      accountId,
      () =>
        this.fixtureLoader.getAdAccounts()[0] || {
          id: accountId,
          name: "Mock Ad Account",
          account_status: 1,
          balance: "1000.00",
          currency: "USD",
          timezone_name: "America/Los_Angeles",
        }
    );
  }

  // Campaign Methods
  async getCampaigns(
    accountId: string,
    params: any = {}
  ): Promise<PaginatedResult<Campaign>> {
    return this.executeCall(
      `getCampaigns:${accountId}`,
      "GET",
      `${accountId}/campaigns`,
      params,
      undefined,
      accountId,
      () => {
        const campaigns = this.fixtureLoader.getCampaigns();
        return {
          data: campaigns.slice(0, params.limit || 25),
          paging: {
            cursors: {
              after: "mock_after_cursor",
              before: "mock_before_cursor",
            },
          },
        };
      }
    );
  }

  async getCampaign(campaignId: string): Promise<Campaign> {
    return this.executeCall(
      `getCampaign:${campaignId}`,
      "GET",
      campaignId,
      {},
      undefined,
      undefined,
      () =>
        this.fixtureLoader.getCampaigns().find((c) => c.id === campaignId) || {
          id: campaignId,
          name: "Mock Campaign",
          objective: "OUTCOME_TRAFFIC",
          status: "ACTIVE" as const,
          effective_status: "ACTIVE",
          created_time: new Date().toISOString(),
          updated_time: new Date().toISOString(),
          account_id: "act_123456789",
        }
    );
  }

  async createCampaign(
    accountId: string,
    campaignData: any
  ): Promise<{ id: string }> {
    return this.executeCall(
      `createCampaign:${accountId}`,
      "POST",
      `${accountId}/campaigns`,
      {},
      campaignData,
      accountId,
      () => ({ id: `campaign_${Date.now()}` })
    );
  }

  async updateCampaign(
    campaignId: string,
    updates: any
  ): Promise<{ success: boolean }> {
    return this.executeCall(
      `updateCampaign:${campaignId}`,
      "POST",
      campaignId,
      {},
      updates,
      undefined,
      () => ({ success: true })
    );
  }

  async deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.executeCall(
      `deleteCampaign:${campaignId}`,
      "DELETE",
      campaignId,
      {},
      undefined,
      undefined,
      () => ({ success: true })
    );
  }

  // Ad Set Methods
  async getAdSets(params: any = {}): Promise<PaginatedResult<AdSet>> {
    const { campaignId, accountId } = params;
    const methodKey = campaignId
      ? `getAdSets:campaign:${campaignId}`
      : `getAdSets:account:${accountId}`;

    return this.executeCall(
      methodKey,
      "GET",
      campaignId ? `${campaignId}/adsets` : `${accountId}/adsets`,
      params,
      undefined,
      accountId,
      () => {
        const adSets = this.fixtureLoader.getAdSets();
        return {
          data: adSets.slice(0, params.limit || 25),
          paging: {
            cursors: {
              after: "mock_after_cursor",
              before: "mock_before_cursor",
            },
          },
        };
      }
    );
  }

  async createAdSet(
    campaignId: string,
    adSetData: any
  ): Promise<{ id: string }> {
    return this.executeCall(
      `createAdSet:${campaignId}`,
      "POST",
      `act_123456789/adsets`,
      {},
      { ...adSetData, campaign_id: campaignId },
      "act_123456789",
      () => ({ id: `adset_${Date.now()}` })
    );
  }

  // Creative Methods
  async getAdCreatives(
    accountId: string,
    params: any = {}
  ): Promise<PaginatedResult<AdCreative>> {
    return this.executeCall(
      `getAdCreatives:${accountId}`,
      "GET",
      `${accountId}/adcreatives`,
      params,
      undefined,
      accountId,
      () => {
        const creatives = this.fixtureLoader.getCreatives();
        return {
          data: creatives.slice(0, params.limit || 25),
          paging: {
            cursors: {
              after: "mock_after_cursor",
              before: "mock_before_cursor",
            },
          },
        };
      }
    );
  }

  async createAdCreative(
    accountId: string,
    creativeData: any
  ): Promise<AdCreative> {
    return this.executeCall(
      `createAdCreative:${accountId}`,
      "POST",
      `${accountId}/adcreatives`,
      {},
      creativeData,
      accountId,
      () => ({
        id: `creative_${Date.now()}`,
        name: creativeData.name || "Mock Creative",
        object_story_spec: creativeData.object_story_spec,
      })
    );
  }

  // Ad Methods
  async getAds(params: any = {}): Promise<PaginatedResult<Ad>> {
    const { adsetId, campaignId, accountId } = params;
    let endpoint: string;
    let methodKey: string;

    if (adsetId) {
      endpoint = `${adsetId}/ads`;
      methodKey = `getAds:adset:${adsetId}`;
    } else if (campaignId) {
      endpoint = `${campaignId}/ads`;
      methodKey = `getAds:campaign:${campaignId}`;
    } else if (accountId) {
      endpoint = `${accountId}/ads`;
      methodKey = `getAds:account:${accountId}`;
    } else {
      throw new Error(
        "Either adsetId, campaignId, or accountId must be provided"
      );
    }

    return this.executeCall(
      methodKey,
      "GET",
      endpoint,
      params,
      undefined,
      accountId,
      () => ({
        data: [
          {
            id: `ad_${Date.now()}`,
            name: "Mock Ad",
            adset_id: adsetId || "mock_adset_id",
            campaign_id: campaignId || "mock_campaign_id",
            status: "ACTIVE" as const,
            effective_status: "ACTIVE",
            created_time: new Date().toISOString(),
            updated_time: new Date().toISOString(),
          },
        ],
        paging: {
          cursors: {
            after: "mock_after_cursor",
            before: "mock_before_cursor",
          },
        },
      })
    );
  }

  async getAdsByCampaign(
    campaignId: string,
    params: any = {}
  ): Promise<PaginatedResult<Ad>> {
    return this.getAds({ ...params, campaignId });
  }

  async getAdsByAccount(
    accountId: string,
    params: any = {}
  ): Promise<PaginatedResult<Ad>> {
    return this.getAds({ ...params, accountId });
  }

  async createAd(adSetId: string, adData: any): Promise<Ad> {
    return this.executeCall(
      `createAd:${adSetId}`,
      "POST",
      `${adSetId}/ads`,
      {},
      adData,
      undefined,
      () => ({
        id: `ad_${Date.now()}`,
        name: adData.name || "Mock Ad",
        adset_id: adSetId,
        campaign_id: "mock_campaign_id",
        status: "ACTIVE" as const,
        effective_status: "ACTIVE",
        created_time: new Date().toISOString(),
        updated_time: new Date().toISOString(),
        creative: adData.creative,
      })
    );
  }

  // Insights Methods
  async getInsights(
    objectId: string,
    params: any = {}
  ): Promise<PaginatedResult<AdInsights>> {
    return this.executeCall(
      `getInsights:${objectId}`,
      "GET",
      `${objectId}/insights`,
      params,
      undefined,
      undefined,
      () => {
        const insights = this.fixtureLoader.getInsights();
        return {
          data: insights.slice(0, params.limit || 25),
          paging: {
            cursors: {
              after: "mock_after_cursor",
              before: "mock_before_cursor",
            },
          },
        };
      }
    );
  }

  // Custom Audience Methods
  async getCustomAudiences(
    accountId: string,
    params: any = {}
  ): Promise<PaginatedResult<CustomAudience>> {
    return this.executeCall(
      `getCustomAudiences:${accountId}`,
      "GET",
      `${accountId}/customaudiences`,
      params,
      undefined,
      accountId,
      () => {
        const audiences = this.fixtureLoader.getAudiences();
        return {
          data: audiences.slice(0, params.limit || 25),
          paging: {
            cursors: {
              after: "mock_after_cursor",
              before: "mock_before_cursor",
            },
          },
        };
      }
    );
  }

  async createCustomAudience(
    accountId: string,
    audienceData: any
  ): Promise<{ id: string }> {
    return this.executeCall(
      `createCustomAudience:${accountId}`,
      "POST",
      `${accountId}/customaudiences`,
      {},
      audienceData,
      accountId,
      () => ({ id: `audience_${Date.now()}` })
    );
  }

  async createLookalikeAudience(
    accountId: string,
    audienceData: any
  ): Promise<{ id: string }> {
    return this.executeCall(
      `createLookalikeAudience:${accountId}`,
      "POST",
      `${accountId}/customaudiences`,
      {},
      { ...audienceData, subtype: "LOOKALIKE" },
      accountId,
      () => ({ id: `lookalike_${Date.now()}` })
    );
  }

  async getCustomAudience(audienceId: string): Promise<CustomAudience> {
    return this.executeCall(
      `getCustomAudience:${audienceId}`,
      "GET",
      audienceId,
      {},
      undefined,
      undefined,
      () =>
        this.fixtureLoader.getAudiences().find((a) => a.id === audienceId) || {
          id: audienceId,
          name: "Mock Custom Audience",
          subtype: "CUSTOM",
          creation_time: new Date().toISOString(),
        }
    );
  }

  // Utility Methods
  async estimateAudienceSize(
    accountId: string,
    targeting: any,
    optimizationGoal: string
  ): Promise<{ estimate_mau: number; estimate_dau?: number }> {
    return this.executeCall(
      `estimateAudienceSize:${accountId}`,
      "GET",
      `${accountId}/delivery_estimate`,
      { targeting_spec: targeting, optimization_goal: optimizationGoal },
      undefined,
      accountId,
      () => ({
        estimate_mau: Math.floor(Math.random() * 1000000) + 100000,
        estimate_dau: Math.floor(Math.random() * 100000) + 10000,
      })
    );
  }

  async generateAdPreview(
    creativeId: string,
    adFormat: string,
    productItemIds?: string[]
  ): Promise<{ body: string }> {
    return this.executeCall(
      `generateAdPreview:${creativeId}`,
      "GET",
      `${creativeId}/previews`,
      { ad_format: adFormat, product_item_ids: productItemIds },
      undefined,
      undefined,
      () => ({
        body: `<div>Mock ad preview for creative ${creativeId} in format ${adFormat}</div>`,
      })
    );
  }

  // Batch Operations
  async batchRequest(requests: BatchRequest[]): Promise<BatchResponse[]> {
    return this.executeCall(
      "batchRequest",
      "POST",
      "",
      {},
      { batch: JSON.stringify(requests) },
      undefined,
      () =>
        requests.map((req, index) => ({
          code: 200,
          headers: [{ name: "Content-Type", value: "application/json" }],
          body: JSON.stringify({ id: `batch_result_${index}` }),
        }))
    );
  }

  // Business and Funding Methods
  async getFundingSources(accountId: string): Promise<any[]> {
    return this.executeCall(
      `getFundingSources:${accountId}`,
      "GET",
      `${accountId}/funding_source_details`,
      {},
      undefined,
      accountId,
      () => []
    );
  }

  async getAccountBusiness(accountId: string): Promise<any> {
    return this.executeCall(
      `getAccountBusiness:${accountId}`,
      "GET",
      `${accountId}/business`,
      {},
      undefined,
      accountId,
      () => ({})
    );
  }

  // Image Upload
  async uploadImageFromUrl(
    accountId: string,
    imageUrl: string,
    imageName?: string
  ): Promise<{ hash: string; url: string; name: string }> {
    return this.executeCall(
      `uploadImageFromUrl:${accountId}`,
      "POST",
      `${accountId}/adimages`,
      {},
      { filename: imageName, url: imageUrl },
      accountId,
      () => ({
        hash: `mock_hash_${Date.now()}`,
        url: imageUrl,
        name: imageName || `uploaded_image_${Date.now()}.jpg`,
      })
    );
  }

  // Helper method for extracting account ID (mock implementation)
  extractAccountIdFromObjectId(objectId: string): string | undefined {
    if (objectId.startsWith("act_")) {
      return objectId;
    }
    return undefined;
  }

  // Auth manager mock (for compatibility)
  get authManager(): any {
    return {
      getAccessToken: () => "mock_access_token",
      getAccountId: (id: string) => (id.startsWith("act_") ? id : `act_${id}`),
      getBaseUrl: () => "https://graph.facebook.com",
      getApiVersion: () => "v23.0",
      getAuthHeaders: () => ({ Authorization: "Bearer mock_access_token" }),
    };
  }
}
