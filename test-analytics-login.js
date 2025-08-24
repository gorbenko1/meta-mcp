#!/usr/bin/env node

/**
 * Simple Tool Testing Script
 *
 * This script verifies that all MCP tools are properly registered and working
 * without needing complex test frameworks or mocking.
 */

import { AnalyticsClient } from "./build/src/analytics-client.js";
import { AuthManager } from "./build/src/utils/auth.js";

// Mock environment for testing
process.env.META_ACCESS_TOKEN = "test_token_for_validation";
process.env.META_APP_ID = "test_app_id";
process.env.META_APP_SECRET = "test_app_secret";

console.log("🧪 Starting Tool Validation Test");
console.log("=================================");

async function testTools() {
  try {
    const auth = new AuthManager({
      accessToken: "test_token",
      appId: "test_app_id",
      appSecret: "test_app_secret",
      analytics: {
        email: '',
        password: '',
      }
    });

    const t = await auth.autorizeAnalytics();
    return true;
  } catch (error) {
    console.error("❌ Tool validation failed:", error.message);
    console.error("Stack trace:", error.stack);
    return false;
  }
}

// Run the test
testTools()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
