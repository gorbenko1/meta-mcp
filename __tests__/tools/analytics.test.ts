import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MockMetaApiClient } from '../helpers/mock-meta-client';
import { setupAnalyticsTools } from '../../src/tools/analytics';
import { mockFactory } from '../helpers/mock-factory';
import { TestHelpers } from '../helpers/test-helpers';

describe('Analytics Tools', () => {
  let server: McpServer;
  let mockClient: MockMetaApiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    
    server = new McpServer(
      {
        name: 'meta-mcp-test',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    mockClient = TestHelpers.setupMockMetaClient();
    
    setupAnalyticsTools(server, mockClient as any);
  });

  describe('Tool Setup', () => {
    it('should set up analytics tools without errors', async () => {
      // Test that setup completes without throwing
      expect(() => {
        setupAnalyticsTools(server, mockClient as any);
      }).not.toThrow();
    });

    it('should handle mock client interactions', async () => {
      const mockInsights = {
        data: [
          mockFactory.generateInsights({
            impressions: '100000',
            clicks: '5000',
            spend: '250.00',
            ctr: '5.00',
            cpc: '0.05',
            cpm: '2.50'
          })
        ]
      };
      
      mockClient.setMockResponse('getInsights:act_123456', {
        data: mockInsights
      });

      // Test that mock client can track calls
      await mockClient.getInsights('act_123456', { level: 'account' });
      
      expect(mockClient.getCallsForMethod('getInsights:act_123456')).toHaveLength(1);
    });
  });
});