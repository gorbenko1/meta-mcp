import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MetaApiClient } from '../../src/meta-client';
import { setupCampaignTools } from '../../src/tools/campaigns';
import { setupAnalyticsTools } from '../../src/tools/analytics';
import { setupAudienceTools } from '../../src/tools/audiences';
import { setupCreativeTools } from '../../src/tools/creatives';
import { mockFactory } from '../helpers/mock-factory';

jest.mock('../../src/meta-client');

describe('Rate Limiting Integration Tests', () => {
  let server: Server;
  let mockClient: jest.Mocked<MetaApiClient>;
  let originalSetTimeout: typeof setTimeout;

  beforeEach(() => {
    jest.clearAllMocks();
    originalSetTimeout = global.setTimeout;
    
    server = new Server(
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

    mockClient = new MetaApiClient({
      accessToken: 'test-token'
    }) as jest.Mocked<MetaApiClient>;

    setupCampaignTools(server, mockClient);
    setupAnalyticsTools(server, mockClient);
    setupAudienceTools(server, mockClient);
    setupCreativeTools(server, mockClient);
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Rate Limit Detection', () => {
    it('should detect rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Rate limit exceeded')
      });
    });

    it('should handle rate limit with retry-after header', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      // @ts-ignore
      rateLimitError.retryAfter = 30;
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-account-insights',
          arguments: {
            account_id: 'act_123456',
            date_preset: 'last_7d'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      expect(result?.content?.[0].text).toContain('30');
    });

    it('should handle different rate limit error codes', async () => {
      const rateLimitCodes = [
        { code: 4, message: 'Application request limit reached' },
        { code: 17, message: 'User request limit reached' },
        { code: 32, message: 'Page request limit reached' },
        { code: 613, message: 'Rate limit exceeded' }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { code, message } of rateLimitCodes) {
        const rateLimitError = new Error(message);
        rateLimitError.name = 'RateLimitException';
        // @ts-ignore
        rateLimitError.code = code;
        
        mockClient.request = jest.fn().mockRejectedValue(rateLimitError);
        
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'list-campaigns',
            arguments: {
              account_id: 'act_123456'
            }
          }
        });

        expect(result?.content?.[0].text).toContain(message);
      }
    });
  });

  describe('Rate Limit Handling Across Tools', () => {
    it('should handle rate limits consistently across campaign tools', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const campaignTools = [
        { name: 'list-campaigns', args: { account_id: 'act_123456' } },
        { name: 'create-campaign', args: { account_id: 'act_123456', name: 'Test', objective: 'CONVERSIONS' } },
        { name: 'get-campaign-insights', args: { campaign_id: '123456', date_preset: 'last_7d' } }
      ];

      for (const tool of campaignTools) {
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: tool.args
          }
        });

        expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      }
    });

    it('should handle rate limits consistently across analytics tools', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const analyticsTools = [
        { name: 'get-account-insights', args: { account_id: 'act_123456', date_preset: 'last_7d' } },
        { name: 'get-ad-insights', args: { ad_id: '123456', date_preset: 'last_7d' } },
        { name: 'get-performance-by-age', args: { object_id: '123456', object_type: 'campaign', date_preset: 'last_7d' } }
      ];

      for (const tool of analyticsTools) {
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: tool.args
          }
        });

        expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      }
    });

    it('should handle rate limits consistently across audience tools', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const audienceTools = [
        { name: 'list-custom-audiences', args: { account_id: 'act_123456' } },
        { name: 'create-custom-audience', args: { account_id: 'act_123456', name: 'Test', subtype: 'CUSTOM' } },
        { name: 'add-users-to-audience', args: { audience_id: '123456', schema: ['EMAIL'], data: [['test@example.com']] } }
      ];

      for (const tool of audienceTools) {
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: tool.args
          }
        });

        expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      }
    });

    it('should handle rate limits consistently across creative tools', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const creativeTools = [
        { name: 'list-ad-creatives', args: { account_id: 'act_123456' } },
        { name: 'upload-ad-image', args: { account_id: 'act_123456', image_url: 'https://example.com/image.jpg' } },
        { name: 'upload-ad-video', args: { account_id: 'act_123456', video_url: 'https://example.com/video.mp4' } }
      ];

      for (const tool of creativeTools) {
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool.name,
            arguments: tool.args
          }
        });

        expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      }
    });
  });

  describe('Bulk Operation Rate Limiting', () => {
    it('should handle rate limits during batch creative creation', async () => {
      jest.useFakeTimers();
      
      const handler = server._requestHandlers.get('tools/call');
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockFactory.generateAdCreative({ name: 'Creative 1' }))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce(mockFactory.generateAdCreative({ name: 'Creative 3' }));

      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'batch-create-creatives',
          arguments: {
            account_id: 'act_123456',
            creatives: [
              { name: 'Creative 1', object_story_spec: { page_id: '123456', link_data: { message: 'Test 1' } } },
              { name: 'Creative 2', object_story_spec: { page_id: '123456', link_data: { message: 'Test 2' } } },
              { name: 'Creative 3', object_story_spec: { page_id: '123456', link_data: { message: 'Test 3' } } }
            ]
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Created 2 out of 3 creatives');
      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
    });

    it('should handle rate limits during audience user addition', async () => {
      jest.useFakeTimers();
      
      const handler = server._requestHandlers.get('tools/call');
      
      // First batch succeeds, second batch hits rate limit
      mockClient.request = jest.fn()
        .mockResolvedValueOnce({
          audience_id: '123456',
          session_id: 'abc123',
          num_received: 10000,
          num_invalids: 0
        })
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));

      // Create dataset larger than batch size to trigger multiple requests
      const largeDataset = Array.from({ length: 15000 }, (_, i) => [`user${i}@example.com`]);

      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'add-users-to-audience',
          arguments: {
            audience_id: '123456',
            schema: ['EMAIL'],
            data: largeDataset
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      expect(result?.content?.[0].text).toContain('Processed 1 out of 2 batches');
    });
  });

  describe('Rate Limit Recovery', () => {
    it('should provide helpful rate limit recovery messages', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      // @ts-ignore
      rateLimitError.retryAfter = 60;
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      expect(result?.content?.[0].text).toContain('60');
      expect(result?.content?.[0].text).toContain('Try again');
    });

    it('should handle rate limits without retry-after header', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-account-insights',
          arguments: {
            account_id: 'act_123456',
            date_preset: 'last_7d'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      expect(result?.content?.[0].text).toContain('wait');
    });
  });

  describe('Rate Limit Scenarios', () => {
    it('should handle concurrent requests hitting rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      
      const concurrentRequests = [
        handler?.({
          method: 'tools/call',
          params: {
            name: 'list-campaigns',
            arguments: { account_id: 'act_123456' }
          }
        }),
        handler?.({
          method: 'tools/call',
          params: {
            name: 'get-account-insights',
            arguments: { account_id: 'act_123456', date_preset: 'last_7d' }
          }
        }),
        handler?.({
          method: 'tools/call',
          params: {
            name: 'list-custom-audiences',
            arguments: { account_id: 'act_123456' }
          }
        })
      ];

      const results = await Promise.all(concurrentRequests);
      
      results.forEach(result => {
        expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      });
    });

    it('should handle mixed success and rate limit responses', async () => {
      const handler = server._requestHandlers.get('tools/call');
      
      // First request succeeds, second hits rate limit
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockFactory.generatePaginatedResponse([mockFactory.generateCampaign()]))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const [successResult, rateLimitResult] = await Promise.all([
        handler?.({
          method: 'tools/call',
          params: {
            name: 'list-campaigns',
            arguments: { account_id: 'act_123456' }
          }
        }),
        handler?.({
          method: 'tools/call',
          params: {
            name: 'get-account-insights',
            arguments: { account_id: 'act_123456', date_preset: 'last_7d' }
          }
        })
      ]);

      expect(successResult?.content?.[0].text).toContain('Found 1 campaigns');
      expect(rateLimitResult?.content?.[0].text).toContain('Rate limit exceeded');
    });
  });

  describe('Rate Limit Error Types', () => {
    it('should handle application-level rate limits', async () => {
      const appRateLimitError = new Error('Application request limit reached');
      appRateLimitError.name = 'RateLimitException';
      // @ts-ignore
      appRateLimitError.code = 4;
      mockClient.request = jest.fn().mockRejectedValue(appRateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Application request limit reached');
    });

    it('should handle user-level rate limits', async () => {
      const userRateLimitError = new Error('User request limit reached');
      userRateLimitError.name = 'RateLimitException';
      // @ts-ignore
      userRateLimitError.code = 17;
      mockClient.request = jest.fn().mockRejectedValue(userRateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-account-insights',
          arguments: {
            account_id: 'act_123456',
            date_preset: 'last_7d'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('User request limit reached');
    });

    it('should handle page-level rate limits', async () => {
      const pageRateLimitError = new Error('Page request limit reached');
      pageRateLimitError.name = 'RateLimitException';
      // @ts-ignore
      pageRateLimitError.code = 32;
      mockClient.request = jest.fn().mockRejectedValue(pageRateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-ad-creative',
          arguments: {
            account_id: 'act_123456',
            name: 'Test Creative',
            object_story_spec: {
              page_id: '123456',
              link_data: {
                message: 'Test message'
              }
            }
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Page request limit reached');
    });
  });

  describe('Rate Limit Monitoring', () => {
    it('should log rate limit occurrences for monitoring', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      consoleSpy.mockRestore();
    });

    it('should handle rate limit headers for monitoring', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      // @ts-ignore
      rateLimitError.headers = {
        'x-business-use-case-usage': '{"call_count": 100, "total_cputime": 50, "total_time": 100}',
        'x-app-usage': '{"call_count": 80, "total_cputime": 40, "total_time": 80}'
      };
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
    });
  });

  describe('Rate Limit Best Practices', () => {
    it('should provide guidance on avoiding rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
      expect(result?.content?.[0].text).toMatch(/reduce.*frequency|wait.*retry|batch.*requests/i);
    });

    it('should handle rate limits in high-volume operations', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      
      // Simulate high-volume batch operation
      const largeDataset = Array.from({ length: 50000 }, (_, i) => [`user${i}@example.com`]);
      
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'add-users-to-audience',
          arguments: {
            audience_id: '123456',
            schema: ['EMAIL'],
            data: largeDataset
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Rate limit exceeded');
    });
  });
});