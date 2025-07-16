/**
 * Mock Response Management System
 * Provides advanced response simulation, error injection, and state management
 */

import type { MetaApiError } from "../../src/types/meta-api.js";
import { FixtureLoader } from "./fixture-loader.js";

export interface MockResponseConfig {
  data?: any;
  error?: MetaApiError;
  delay?: number;
  shouldFail?: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  callCount?: number;
  maxCalls?: number;
  onCall?: (callNumber: number) => void;
}

export interface ErrorScenario {
  name: string;
  error: MetaApiError;
  description: string;
  triggerCondition?: (methodKey: string, params: any) => boolean;
}

export interface ResponsePattern {
  pattern: RegExp;
  response: MockResponseConfig;
  priority: number;
}

/**
 * Advanced mock response management with pattern matching and error scenarios
 */
export class MockResponseManager {
  private responses: Map<string, MockResponseConfig> = new Map();
  private patterns: ResponsePattern[] = [];
  private errorScenarios: Map<string, ErrorScenario> = new Map();
  private globalState: Map<string, any> = new Map();
  private callCounts: Map<string, number> = new Map();
  private fixtureLoader: FixtureLoader;

  constructor() {
    this.fixtureLoader = new FixtureLoader();
    this.initializeDefaultErrorScenarios();
  }

  /**
   * Set a specific mock response for a method key
   */
  setResponse(methodKey: string, config: MockResponseConfig): void {
    this.responses.set(methodKey, {
      callCount: 0,
      ...config,
    });
  }

  /**
   * Set multiple responses at once
   */
  setResponses(responses: Record<string, MockResponseConfig>): void {
    Object.entries(responses).forEach(([key, config]) => {
      this.setResponse(key, config);
    });
  }

  /**
   * Add a response pattern that matches multiple method keys
   */
  addPattern(
    pattern: RegExp,
    response: MockResponseConfig,
    priority: number = 0
  ): void {
    this.patterns.push({ pattern, response, priority });
    this.patterns.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Set an error response for a specific method
   */
  setError(methodKey: string, error: MetaApiError, delay?: number): void {
    this.setResponse(methodKey, {
      error,
      delay,
      shouldFail: true,
    });
  }

  /**
   * Add a named error scenario
   */
  addErrorScenario(scenario: ErrorScenario): void {
    this.errorScenarios.set(scenario.name, scenario);
  }

  /**
   * Activate an error scenario
   */
  activateErrorScenario(scenarioName: string): void {
    const scenario = this.errorScenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Error scenario '${scenarioName}' not found`);
    }

    // Apply error to all matching methods
    this.responses.forEach((config, methodKey) => {
      if (
        !scenario.triggerCondition ||
        scenario.triggerCondition(methodKey, {})
      ) {
        this.setError(methodKey, scenario.error);
      }
    });
  }

  /**
   * Get response configuration for a method key
   */
  getResponse(methodKey: string, params: any = {}): MockResponseConfig | null {
    // Check for exact match first
    const exactMatch = this.responses.get(methodKey);
    if (exactMatch) {
      return this.processResponse(methodKey, exactMatch, params);
    }

    // Check patterns
    for (const { pattern, response } of this.patterns) {
      if (pattern.test(methodKey)) {
        return this.processResponse(methodKey, response, params);
      }
    }

    // Check error scenarios
    for (const scenario of this.errorScenarios.values()) {
      if (
        scenario.triggerCondition &&
        scenario.triggerCondition(methodKey, params)
      ) {
        return {
          error: scenario.error,
          shouldFail: true,
        };
      }
    }

    return null;
  }

  /**
   * Process response configuration, handling call counts and state
   */
  private processResponse(
    methodKey: string,
    config: MockResponseConfig,
    params: any
  ): MockResponseConfig {
    // Update call count
    const currentCount = this.callCounts.get(methodKey) || 0;
    this.callCounts.set(methodKey, currentCount + 1);

    // Check max calls limit
    if (config.maxCalls && currentCount >= config.maxCalls) {
      return {
        error: {
          error: {
            message: `Maximum calls exceeded for ${methodKey}`,
            type: "OAuthException",
            code: 190,
          },
        },
        shouldFail: true,
      };
    }

    // Execute onCall callback
    if (config.onCall) {
      config.onCall(currentCount + 1);
    }

    return {
      ...config,
      callCount: currentCount + 1,
    };
  }

  /**
   * Reset all mock responses and state
   */
  reset(): void {
    this.responses.clear();
    this.patterns = [];
    this.globalState.clear();
    this.callCounts.clear();
    this.initializeDefaultErrorScenarios();
  }

  /**
   * Reset only call counts, keeping response configurations
   */
  resetCallCounts(): void {
    this.callCounts.clear();
  }

  /**
   * Get call count for a specific method
   */
  getCallCount(methodKey: string): number {
    return this.callCounts.get(methodKey) || 0;
  }

  /**
   * Set global state value
   */
  setState(key: string, value: any): void {
    this.globalState.set(key, value);
  }

  /**
   * Get global state value
   */
  getState(key: string): any {
    return this.globalState.get(key);
  }

  /**
   * Initialize default error scenarios
   */
  private initializeDefaultErrorScenarios(): void {
    // Authentication errors
    this.addErrorScenario({
      name: "expired_token",
      description: "Simulates expired access token",
      error: {
        error: {
          message: "Error validating access token: Session has expired",
          type: "OAuthException",
          code: 190,
          error_subcode: 463,
        },
      },
    });

    this.addErrorScenario({
      name: "invalid_token",
      description: "Simulates invalid access token",
      error: {
        error: {
          message: "Invalid OAuth access token",
          type: "OAuthException",
          code: 190,
        },
      },
    });

    this.addErrorScenario({
      name: "insufficient_permissions",
      description: "Simulates insufficient permissions",
      error: {
        error: {
          message: "Insufficient permissions for this request",
          type: "OAuthException",
          code: 200,
          error_subcode: 1349174,
        },
      },
    });

    // Rate limiting errors
    this.addErrorScenario({
      name: "rate_limit_exceeded",
      description: "Simulates rate limit exceeded",
      error: {
        error: {
          message: "Application request limit reached",
          type: "OAuthException",
          code: 4,
        },
      },
    });

    // Validation errors
    this.addErrorScenario({
      name: "missing_required_field",
      description: "Simulates missing required field",
      error: {
        error: {
          message: "Missing required field",
          type: "GraphMethodException",
          code: 100,
          error_subcode: 1349151,
        },
      },
    });

    this.addErrorScenario({
      name: "invalid_parameter",
      description: "Simulates invalid parameter value",
      error: {
        error: {
          message: "Invalid parameter",
          type: "GraphMethodException",
          code: 100,
        },
      },
    });

    // Server errors
    this.addErrorScenario({
      name: "server_error",
      description: "Simulates internal server error",
      error: {
        error: {
          message:
            "An unexpected error has occurred. Please retry your request later.",
          type: "GraphMethodException",
          code: 2,
        },
      },
    });

    this.addErrorScenario({
      name: "service_unavailable",
      description: "Simulates service temporarily unavailable",
      error: {
        error: {
          message: "Service temporarily unavailable",
          type: "GraphMethodException",
          code: 2,
        },
      },
    });

    // Network simulation errors
    this.addErrorScenario({
      name: "network_timeout",
      description: "Simulates network timeout",
      error: {
        error: {
          message: "Network timeout",
          type: "NetworkException",
          code: 1,
        },
      },
    });
  }

  /**
   * Simulate common response patterns
   */
  setupCommonPatterns(): void {
    // Campaign patterns
    this.addPattern(
      /^getCampaigns:/,
      {
        data: () => ({
          data: this.fixtureLoader.getCampaigns().slice(0, 25),
          paging: { cursors: { after: "mock_after", before: "mock_before" } },
        }),
      },
      10
    );

    // Ad Set patterns
    this.addPattern(
      /^getAdSets:/,
      {
        data: () => ({
          data: this.fixtureLoader.getAdSets().slice(0, 25),
          paging: { cursors: { after: "mock_after", before: "mock_before" } },
        }),
      },
      10
    );

    // Creative patterns
    this.addPattern(
      /^getAdCreatives:/,
      {
        data: () => ({
          data: this.fixtureLoader.getCreatives().slice(0, 25),
          paging: { cursors: { after: "mock_after", before: "mock_before" } },
        }),
      },
      10
    );

    // Insights patterns
    this.addPattern(
      /^getInsights:/,
      {
        data: () => ({
          data: this.fixtureLoader.getInsights().slice(0, 25),
          paging: { cursors: { after: "mock_after", before: "mock_before" } },
        }),
      },
      10
    );

    // Creation patterns
    this.addPattern(
      /^create/,
      {
        data: () => ({ id: `created_${Date.now()}` }),
        delay: 100,
      },
      5
    );

    // Update patterns
    this.addPattern(
      /^update/,
      {
        data: () => ({ success: true }),
        delay: 50,
      },
      5
    );

    // Delete patterns
    this.addPattern(
      /^delete/,
      {
        data: () => ({ success: true }),
        delay: 50,
      },
      5
    );
  }

  /**
   * Simulate progressive failure scenario
   */
  simulateProgressiveFailure(methodKey: string, failAfterCalls: number): void {
    this.setResponse(methodKey, {
      onCall: (callNumber) => {
        if (callNumber > failAfterCalls) {
          this.setError(methodKey, {
            error: {
              message: "Service degraded after multiple calls",
              type: "GraphMethodException",
              code: 2,
            },
          });
        }
      },
    });
  }

  /**
   * Simulate intermittent failures
   */
  simulateIntermittentFailure(
    methodKey: string,
    failureRate: number = 0.3
  ): void {
    this.setResponse(methodKey, {
      onCall: () => {
        if (Math.random() < failureRate) {
          this.setError(methodKey, {
            error: {
              message: "Intermittent service failure",
              type: "GraphMethodException",
              code: 2,
            },
          });
        }
      },
    });
  }

  /**
   * Get statistics about mock usage
   */
  getStatistics(): {
    totalCalls: number;
    methodCalls: Record<string, number>;
    errorScenarios: string[];
    activePatterns: number;
  } {
    const totalCalls = Array.from(this.callCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const methodCalls = Object.fromEntries(this.callCounts.entries());

    return {
      totalCalls,
      methodCalls,
      errorScenarios: Array.from(this.errorScenarios.keys()),
      activePatterns: this.patterns.length,
    };
  }
}
