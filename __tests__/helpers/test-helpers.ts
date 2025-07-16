/**
 * Test Helper Functions
 * Provides utilities for setting up mock MCP servers, assertions, and data generation
 */

import { MockMetaApiClient } from "./mock-meta-client.js";
import { MockResponseManager } from "./mock-response-manager.js";
import { FixtureLoader } from "./fixture-loader.js";
import { MockFactory } from "./mock-factory.js";
import type {
  Campaign,
  AdSet,
  AdCreative,
  CustomAudience,
  AdInsights,
  MetaApiError,
  MetaApiResponse,
} from "../../src/types/meta-api.js";

export interface MockMcpServer {
  tools: Map<string, any>;
  callTool: (name: string, args: any) => Promise<any>;
  listTools: () => string[];
  reset: () => void;
}

export interface TestContext {
  mockClient: MockMetaApiClient;
  mockServer: MockMcpServer;
  fixtures: FixtureLoader;
  factory: MockFactory;
}

export interface AssertionOptions {
  strict?: boolean;
  ignoreFields?: string[];
  customComparator?: (actual: any, expected: any) => boolean;
}

/**
 * Test Helper Functions Class
 * Provides comprehensive utilities for testing MCP tools
 */
export class TestHelpers {
  /**
   * Set up a mock Meta API client with default configuration
   */
  static setupMockMetaClient(config?: {
    enableCallTracking?: boolean;
    autoGenerateResponses?: boolean;
    strictMode?: boolean;
    defaultDelay?: number;
  }): MockMetaApiClient {
    return new MockMetaApiClient({
      enableCallTracking: true,
      autoGenerateResponses: true,
      strictMode: false,
      defaultDelay: 0,
      ...config,
    });
  }

  /**
   * Set up a mock MCP server for testing tool interactions
   */
  static setupMockMcpServer(): MockMcpServer {
    const tools = new Map<string, any>();
    const callHistory: Array<{
      name: string;
      args: any;
      result: any;
      timestamp: Date;
    }> = [];

    return {
      tools,

      async callTool(name: string, args: any): Promise<any> {
        const tool = tools.get(name);
        if (!tool) {
          throw new Error(`Tool '${name}' not found`);
        }

        try {
          const result = await tool(args);
          callHistory.push({
            name,
            args,
            result,
            timestamp: new Date(),
          });
          return result;
        } catch (error) {
          callHistory.push({
            name,
            args,
            result: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
            timestamp: new Date(),
          });
          throw error;
        }
      },

      listTools(): string[] {
        return Array.from(tools.keys());
      },

      reset(): void {
        tools.clear();
        callHistory.length = 0;
      },
    };
  }

  /**
   * Create a complete test context with all necessary mocks
   */
  static createTestContext(): TestContext {
    const mockClient = TestHelpers.setupMockMetaClient();
    const mockServer = TestHelpers.setupMockMcpServer();
    const fixtures = new FixtureLoader();
    const factory = new MockFactory();

    return {
      mockClient,
      mockServer,
      fixtures,
      factory,
    };
  }

  /**
   * Generate dynamic test data for various scenarios
   */
  static generateTestData(
    type: "campaign" | "adset" | "creative" | "audience" | "insights",
    overrides?: any
  ): any {
    const factory = new MockFactory();

    switch (type) {
      case "campaign":
        return factory.generateCampaign(overrides);
      case "adset":
        return factory.generateAdSet(overrides);
      case "creative":
        return factory.generateAdCreative(overrides);
      case "audience":
        return factory.generateCustomAudience(overrides);
      case "insights":
        return factory.generateInsights(overrides);
      default:
        throw new Error(`Unknown test data type: ${type}`);
    }
  }

  /**
   * Generate a complete test scenario with related objects
   */
  static generateTestScenario(scenarioName: string): {
    campaign: Campaign;
    adSets: AdSet[];
    creatives: AdCreative[];
    audiences: CustomAudience[];
    insights: AdInsights[];
  } {
    const factory = new MockFactory();
    return factory.generateTestScenario(scenarioName);
  }

  /**
   * Assert that an MCP response has the expected structure
   */
  static expectValidMcpResponse(
    response: any,
    options: AssertionOptions = {}
  ): void {
    expect(response).toBeDefined();
    expect(typeof response).toBe("object");

    if (!options.strict) {
      return;
    }

    // Strict validation for MCP response structure
    if (response.error) {
      expect(response.error).toHaveProperty("message");
      expect(typeof response.error.message).toBe("string");
    } else {
      expect(response).toHaveProperty("content");
    }
  }

  /**
   * Assert that a Meta API call was made with expected parameters
   */
  static expectMetaApiCall(
    client: MockMetaApiClient,
    method: string,
    expectedParams?: any,
    options: AssertionOptions = {}
  ): void {
    const calls = client.getCallsForMethod(method);
    expect(calls.length).toBeGreaterThan(0);

    if (expectedParams) {
      const lastCall = calls[calls.length - 1];

      if (options.customComparator) {
        expect(options.customComparator(lastCall.params, expectedParams)).toBe(
          true
        );
      } else {
        // Default comparison, ignoring specified fields
        const actualParams = { ...lastCall.params };
        const expectedParamsCopy = { ...expectedParams };

        if (options.ignoreFields) {
          options.ignoreFields.forEach((field) => {
            delete actualParams[field];
            delete expectedParamsCopy[field];
          });
        }

        expect(actualParams).toEqual(expectedParamsCopy);
      }
    }
  }

  /**
   * Assert that an error response has the expected structure
   */
  static expectErrorResponse(response: any, errorType?: string): void {
    expect(response).toBeDefined();
    expect(response.error).toBeDefined();
    expect(response.error.message).toBeDefined();
    expect(typeof response.error.message).toBe("string");

    if (errorType) {
      expect(response.error.type).toBe(errorType);
    }
  }

  /**
   * Assert that a paginated response has the expected structure
   */
  static expectPaginatedResponse(
    response: any,
    expectedDataType?: string
  ): void {
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    if (response.paging) {
      expect(response.paging).toHaveProperty("cursors");
    }

    if (expectedDataType && response.data.length > 0) {
      const firstItem = response.data[0];
      expect(firstItem).toHaveProperty("id");
      expect(typeof firstItem.id).toBe("string");
    }
  }

  /**
   * Create a mock tool function for testing
   */
  static createMockTool(
    name: string,
    implementation: (args: any) => Promise<any> | any
  ): { name: string; implementation: typeof implementation } {
    return {
      name,
      implementation: async (args: any) => {
        try {
          const result = await implementation(args);
          return result;
        } catch (error) {
          throw error;
        }
      },
    };
  }

  /**
   * Simulate common error scenarios
   */
  static simulateError(
    client: MockMetaApiClient,
    methodKey: string,
    errorType: "auth" | "validation" | "rate_limit" | "server" | "network"
  ): void {
    const responseManager = client.getResponseManager();

    switch (errorType) {
      case "auth":
        responseManager.activateErrorScenario("expired_token");
        break;
      case "validation":
        responseManager.activateErrorScenario("missing_required_field");
        break;
      case "rate_limit":
        responseManager.activateErrorScenario("rate_limit_exceeded");
        break;
      case "server":
        responseManager.activateErrorScenario("server_error");
        break;
      case "network":
        responseManager.activateErrorScenario("network_timeout");
        break;
      default:
        throw new Error(`Unknown error type: ${errorType}`);
    }
  }

  /**
   * Wait for a specified amount of time (useful for testing delays)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a test spy that tracks function calls
   */
  static createSpy<T extends (...args: any[]) => any>(
    originalFn?: T
  ): T & {
    calls: Array<{
      args: Parameters<T>;
      result: ReturnType<T>;
      timestamp: Date;
    }>;
  } {
    const calls: Array<{
      args: Parameters<T>;
      result: ReturnType<T>;
      timestamp: Date;
    }> = [];

    const spy = ((...args: Parameters<T>) => {
      const timestamp = new Date();
      try {
        const result = originalFn ? originalFn(...args) : undefined;
        calls.push({ args, result, timestamp });
        return result;
      } catch (error) {
        calls.push({ args, result: error as ReturnType<T>, timestamp });
        throw error;
      }
    }) as T & { calls: typeof calls };

    spy.calls = calls;
    return spy;
  }

  /**
   * Validate that test data matches expected schema
   */
  static validateTestData(
    data: any,
    schema: any
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    function validateObject(obj: any, schemaObj: any, path: string = ""): void {
      if (typeof schemaObj !== "object" || schemaObj === null) {
        return;
      }

      for (const [key, expectedType] of Object.entries(schemaObj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (
          expectedType === "required" &&
          (value === undefined || value === null)
        ) {
          errors.push(`Missing required field: ${currentPath}`);
          continue;
        }

        if (value !== undefined && value !== null) {
          if (typeof expectedType === "string") {
            if (typeof value !== expectedType) {
              errors.push(
                `Type mismatch at ${currentPath}: expected ${expectedType}, got ${typeof value}`
              );
            }
          } else if (typeof expectedType === "object") {
            validateObject(value, expectedType, currentPath);
          }
        }
      }
    }

    validateObject(data, schema);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clean up test resources
   */
  static cleanup(context: TestContext): void {
    context.mockClient.resetMocks();
    context.mockServer.reset();
    context.fixtures.clearCache();
    context.factory.resetFixtures();
  }

  /**
   * Generate performance test data
   */
  static generatePerformanceTestData(count: number, type: string): any[] {
    const factory = new MockFactory();
    const data: any[] = [];

    for (let i = 0; i < count; i++) {
      switch (type) {
        case "campaigns":
          data.push(
            factory.generateCampaign({ name: `Performance Test Campaign ${i}` })
          );
          break;
        case "adsets":
          data.push(
            factory.generateAdSet({ name: `Performance Test Ad Set ${i}` })
          );
          break;
        case "creatives":
          data.push(
            factory.generateAdCreative({
              name: `Performance Test Creative ${i}`,
            })
          );
          break;
        case "insights":
          data.push(
            factory.generateInsights({
              date_start: `2024-01-${String((i % 30) + 1).padStart(2, "0")}`,
            })
          );
          break;
        default:
          throw new Error(`Unknown performance test data type: ${type}`);
      }
    }

    return data;
  }

  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T> | T
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();

    return {
      result,
      executionTime: endTime - startTime,
    };
  }

  /**
   * Create a test timeout that fails if not resolved within specified time
   */
  static createTimeout(ms: number, message?: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message || `Test timed out after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Race a promise against a timeout
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message?: string
  ): Promise<T> {
    return Promise.race([
      promise,
      TestHelpers.createTimeout(timeoutMs, message),
    ]);
  }
}
