/**
 * Test Scenario Framework
 * Provides reusable test scenario definitions, execution utilities, and cleanup helpers
 */

import { TestHelpers, type TestContext } from "./test-helpers.js";
import { MockMetaApiClient } from "./mock-meta-client.js";
import type {
  Campaign,
  AdSet,
  AdCreative,
  CustomAudience,
  AdInsights,
  MetaApiError,
} from "../../src/types/meta-api.js";

export interface TestScenario {
  name: string;
  description: string;
  tags: string[];
  setup: (context: TestContext) => Promise<void>;
  execute: (context: TestContext) => Promise<any>;
  verify: (result: any, context: TestContext) => Promise<void>;
  cleanup?: (context: TestContext) => Promise<void>;
  timeout?: number;
  retries?: number;
  dependencies?: string[];
}

export interface ScenarioResult {
  scenario: string;
  success: boolean;
  result?: any;
  error?: Error;
  executionTime: number;
  retryCount: number;
}

export interface ScenarioSuite {
  name: string;
  description: string;
  scenarios: TestScenario[];
  beforeAll?: (context: TestContext) => Promise<void>;
  afterAll?: (context: TestContext) => Promise<void>;
  beforeEach?: (context: TestContext) => Promise<void>;
  afterEach?: (context: TestContext) => Promise<void>;
}

/**
 * Test Scenario Framework Class
 * Manages test scenario execution, verification, and cleanup
 */
export class TestScenarioFramework {
  private scenarios: Map<string, TestScenario> = new Map();
  private suites: Map<string, ScenarioSuite> = new Map();
  private context: TestContext;

  constructor(context?: TestContext) {
    this.context = context || TestHelpers.createTestContext();
    this.initializeDefaultScenarios();
  }

  /**
   * Register a test scenario
   */
  registerScenario(scenario: TestScenario): void {
    this.scenarios.set(scenario.name, scenario);
  }

  /**
   * Register multiple scenarios
   */
  registerScenarios(scenarios: TestScenario[]): void {
    scenarios.forEach((scenario) => this.registerScenario(scenario));
  }

  /**
   * Register a test suite
   */
  registerSuite(suite: ScenarioSuite): void {
    this.suites.set(suite.name, suite);
    suite.scenarios.forEach((scenario) => this.registerScenario(scenario));
  }

  /**
   * Execute a single scenario
   */
  async executeScenario(scenarioName: string): Promise<ScenarioResult> {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Scenario '${scenarioName}' not found`);
    }

    const startTime = performance.now();
    let retryCount = 0;
    const maxRetries = scenario.retries || 0;

    while (retryCount <= maxRetries) {
      try {
        // Setup
        await scenario.setup(this.context);

        // Execute with timeout
        const executePromise = scenario.execute(this.context);
        const timeoutMs = scenario.timeout || 30000;

        const result = await TestHelpers.withTimeout(
          executePromise,
          timeoutMs,
          `Scenario '${scenarioName}' timed out after ${timeoutMs}ms`
        );

        // Verify
        await scenario.verify(result, this.context);

        // Cleanup
        if (scenario.cleanup) {
          await scenario.cleanup(this.context);
        }

        const endTime = performance.now();
        return {
          scenario: scenarioName,
          success: true,
          result,
          executionTime: endTime - startTime,
          retryCount,
        };
      } catch (error) {
        retryCount++;

        if (retryCount > maxRetries) {
          // Final cleanup attempt
          try {
            if (scenario.cleanup) {
              await scenario.cleanup(this.context);
            }
          } catch (cleanupError) {
            console.warn(
              `Cleanup failed for scenario '${scenarioName}':`,
              cleanupError
            );
          }

          const endTime = performance.now();
          return {
            scenario: scenarioName,
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            executionTime: endTime - startTime,
            retryCount: retryCount - 1,
          };
        }

        // Wait before retry
        await TestHelpers.wait(1000 * retryCount);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error(
      `Unexpected end of scenario execution for '${scenarioName}'`
    );
  }

  /**
   * Execute multiple scenarios
   */
  async executeScenarios(scenarioNames: string[]): Promise<ScenarioResult[]> {
    const results: ScenarioResult[] = [];

    for (const scenarioName of scenarioNames) {
      const result = await this.executeScenario(scenarioName);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a test suite
   */
  async executeSuite(suiteName: string): Promise<ScenarioResult[]> {
    const suite = this.suites.get(suiteName);
    if (!suite) {
      throw new Error(`Suite '${suiteName}' not found`);
    }

    const results: ScenarioResult[] = [];

    try {
      // Suite setup
      if (suite.beforeAll) {
        await suite.beforeAll(this.context);
      }

      // Execute scenarios
      for (const scenario of suite.scenarios) {
        try {
          // Before each
          if (suite.beforeEach) {
            await suite.beforeEach(this.context);
          }

          const result = await this.executeScenario(scenario.name);
          results.push(result);

          // After each
          if (suite.afterEach) {
            await suite.afterEach(this.context);
          }
        } catch (error) {
          results.push({
            scenario: scenario.name,
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            executionTime: 0,
            retryCount: 0,
          });
        }
      }
    } finally {
      // Suite cleanup
      if (suite.afterAll) {
        try {
          await suite.afterAll(this.context);
        } catch (error) {
          console.warn(`Suite cleanup failed for '${suiteName}':`, error);
        }
      }
    }

    return results;
  }

  /**
   * Get scenario by name
   */
  getScenario(name: string): TestScenario | undefined {
    return this.scenarios.get(name);
  }

  /**
   * Get scenarios by tag
   */
  getScenariosByTag(tag: string): TestScenario[] {
    return Array.from(this.scenarios.values()).filter((scenario) =>
      scenario.tags.includes(tag)
    );
  }

  /**
   * List all registered scenarios
   */
  listScenarios(): string[] {
    return Array.from(this.scenarios.keys());
  }

  /**
   * List all registered suites
   */
  listSuites(): string[] {
    return Array.from(this.suites.keys());
  }

  /**
   * Reset the framework
   */
  reset(): void {
    this.scenarios.clear();
    this.suites.clear();
    TestHelpers.cleanup(this.context);
    this.initializeDefaultScenarios();
  }

  /**
   * Initialize default test scenarios
   */
  private initializeDefaultScenarios(): void {
    // Campaign Management Scenarios
    this.registerScenario({
      name: "create_campaign_success",
      description: "Successfully create a new campaign",
      tags: ["campaign", "create", "success"],
      setup: async (context) => {
        context.mockClient.setMockResponse("createCampaign:act_123456789", {
          data: { id: "campaign_123" },
        });
      },
      execute: async (context) => {
        return await context.mockClient.createCampaign("act_123456789", {
          name: "Test Campaign",
          objective: "OUTCOME_TRAFFIC",
          status: "ACTIVE",
        });
      },
      verify: async (result, context) => {
        expect(result).toHaveProperty("id");
        expect(result.id).toBe("campaign_123");

        const calls = context.mockClient.getCallsForMethod("POST");
        expect(calls.length).toBeGreaterThan(0);
      },
    });

    this.registerScenario({
      name: "create_campaign_validation_error",
      description: "Handle validation error when creating campaign",
      tags: ["campaign", "create", "error", "validation"],
      setup: async (context) => {
        context.mockClient.setMockError("createCampaign:act_123456789", {
          error: {
            message: "Missing required field: name",
            type: "GraphMethodException",
            code: 100,
          },
        });
      },
      execute: async (context) => {
        try {
          await context.mockClient.createCampaign("act_123456789", {
            objective: "OUTCOME_TRAFFIC",
          } as any);
          throw new Error("Expected validation error");
        } catch (error) {
          return error;
        }
      },
      verify: async (result, context) => {
        expect(result).toBeInstanceOf(Error);
        const errorData = JSON.parse((result as Error).message);
        expect(errorData.error.code).toBe(100);
      },
    });

    // Ad Set Management Scenarios
    this.registerScenario({
      name: "create_adset_success",
      description: "Successfully create a new ad set",
      tags: ["adset", "create", "success"],
      setup: async (context) => {
        // Mock campaign lookup
        context.mockClient.setMockResponse("getCampaign:campaign_123", {
          data: {
            id: "campaign_123",
            name: "Test Campaign",
            account_id: "act_123456789",
            objective: "OUTCOME_TRAFFIC",
            status: "ACTIVE",
            effective_status: "ACTIVE",
            created_time: new Date().toISOString(),
            updated_time: new Date().toISOString(),
          },
        });

        // Mock ad set creation
        context.mockClient.setMockResponse("createAdSet:campaign_123", {
          data: { id: "adset_456" },
        });
      },
      execute: async (context) => {
        return await context.mockClient.createAdSet("campaign_123", {
          name: "Test Ad Set",
          optimization_goal: "LINK_CLICKS",
          billing_event: "LINK_CLICKS",
          daily_budget: 1000,
        });
      },
      verify: async (result, context) => {
        expect(result).toHaveProperty("id");
        expect(result.id).toBe("adset_456");
      },
    });

    // Creative Management Scenarios
    this.registerScenario({
      name: "create_creative_success",
      description: "Successfully create a new ad creative",
      tags: ["creative", "create", "success"],
      setup: async (context) => {
        context.mockClient.setMockResponse("createAdCreative:act_123456789", {
          data: {
            id: "creative_789",
            name: "Test Creative",
            object_story_spec: {
              page_id: "page_123",
              link_data: {
                link: "https://example.com",
                message: "Test message",
              },
            },
          },
        });
      },
      execute: async (context) => {
        return await context.mockClient.createAdCreative("act_123456789", {
          name: "Test Creative",
          object_story_spec: {
            page_id: "page_123",
            link_data: {
              link: "https://example.com",
              message: "Test message",
            },
          },
        });
      },
      verify: async (result, context) => {
        expect(result).toHaveProperty("id");
        expect(result.id).toBe("creative_789");
        expect(result).toHaveProperty("object_story_spec");
      },
    });

    // Audience Management Scenarios
    this.registerScenario({
      name: "create_custom_audience_success",
      description: "Successfully create a custom audience",
      tags: ["audience", "create", "success"],
      setup: async (context) => {
        context.mockClient.setMockResponse(
          "createCustomAudience:act_123456789",
          {
            data: { id: "audience_101" },
          }
        );
      },
      execute: async (context) => {
        return await context.mockClient.createCustomAudience("act_123456789", {
          name: "Test Custom Audience",
          subtype: "CUSTOM",
          description: "Test audience description",
        });
      },
      verify: async (result, context) => {
        expect(result).toHaveProperty("id");
        expect(result.id).toBe("audience_101");
      },
    });

    // Error Handling Scenarios
    this.registerScenario({
      name: "handle_auth_error",
      description: "Handle authentication error gracefully",
      tags: ["error", "auth"],
      setup: async (context) => {
        TestHelpers.simulateError(
          context.mockClient,
          "getCampaigns:act_123456789",
          "auth"
        );
      },
      execute: async (context) => {
        try {
          await context.mockClient.getCampaigns("act_123456789");
          throw new Error("Expected auth error");
        } catch (error) {
          return error;
        }
      },
      verify: async (result, context) => {
        expect(result).toBeInstanceOf(Error);
        const errorData = JSON.parse((result as Error).message);
        expect(errorData.error.code).toBe(190);
      },
    });

    // Performance Scenarios
    this.registerScenario({
      name: "large_dataset_performance",
      description: "Handle large dataset efficiently",
      tags: ["performance", "large-data"],
      setup: async (context) => {
        const largeDataset = TestHelpers.generatePerformanceTestData(
          1000,
          "campaigns"
        );
        context.mockClient.setMockResponse("getCampaigns:act_123456789", {
          data: {
            data: largeDataset,
            paging: { cursors: { after: "cursor_end" } },
          },
        });
      },
      execute: async (context) => {
        const { result, executionTime } =
          await TestHelpers.measureExecutionTime(async () => {
            return await context.mockClient.getCampaigns("act_123456789", {
              limit: 1000,
            });
          });
        return { result, executionTime };
      },
      verify: async (result, context) => {
        expect(result.result.data).toHaveLength(1000);
        expect(result.executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      },
      timeout: 10000,
    });
  }

  /**
   * Create a scenario builder for fluent API
   */
  static createScenario(name: string): ScenarioBuilder {
    return new ScenarioBuilder(name);
  }
}

/**
 * Fluent API for building test scenarios
 */
export class ScenarioBuilder {
  private scenario: Partial<TestScenario>;

  constructor(name: string) {
    this.scenario = {
      name,
      tags: [],
    };
  }

  description(desc: string): ScenarioBuilder {
    this.scenario.description = desc;
    return this;
  }

  tags(...tags: string[]): ScenarioBuilder {
    this.scenario.tags = [...(this.scenario.tags || []), ...tags];
    return this;
  }

  setup(setupFn: (context: TestContext) => Promise<void>): ScenarioBuilder {
    this.scenario.setup = setupFn;
    return this;
  }

  execute(executeFn: (context: TestContext) => Promise<any>): ScenarioBuilder {
    this.scenario.execute = executeFn;
    return this;
  }

  verify(
    verifyFn: (result: any, context: TestContext) => Promise<void>
  ): ScenarioBuilder {
    this.scenario.verify = verifyFn;
    return this;
  }

  cleanup(cleanupFn: (context: TestContext) => Promise<void>): ScenarioBuilder {
    this.scenario.cleanup = cleanupFn;
    return this;
  }

  timeout(ms: number): ScenarioBuilder {
    this.scenario.timeout = ms;
    return this;
  }

  retries(count: number): ScenarioBuilder {
    this.scenario.retries = count;
    return this;
  }

  dependencies(...deps: string[]): ScenarioBuilder {
    this.scenario.dependencies = deps;
    return this;
  }

  build(): TestScenario {
    if (
      !this.scenario.name ||
      !this.scenario.setup ||
      !this.scenario.execute ||
      !this.scenario.verify
    ) {
      throw new Error(
        "Scenario must have name, setup, execute, and verify functions"
      );
    }

    return this.scenario as TestScenario;
  }
}
