import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { MetaApiClient } from '../../src/meta-client';
import { setupCampaignTools } from '../../src/tools/campaigns';
import { setupAnalyticsTools } from '../../src/tools/analytics';
import { setupAudienceTools } from '../../src/tools/audiences';
import { setupCreativeTools } from '../../src/tools/creatives';
import { setupOAuthTools } from '../../src/tools/oauth';
import { mockFactory } from '../helpers/mock-factory';

jest.mock('../../src/meta-client');

describe('Error Handling Integration Tests', () => {
  let server: Server;
  let mockClient: jest.Mocked<MetaApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
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
    setupOAuthTools(server, mockClient);
  });

  describe('API Error Types', () => {
    it('should handle OAuth authentication errors', async () => {
      const oauthError = new Error('Invalid user access token');
      oauthError.name = 'OAuthException';
      mockClient.request = jest.fn().mockRejectedValue(oauthError);

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
        text: expect.stringContaining('Invalid user access token')
      });
      expect(result?.content?.[0].text).toContain('Error listing campaigns');
    });

    it('should handle rate limit errors', async () => {
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

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Rate limit exceeded')
      });
      expect(result?.content?.[0].text).toContain('Error fetching account insights');
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('User does not have permission to access this resource');
      permissionError.name = 'PermissionException';
      mockClient.request = jest.fn().mockRejectedValue(permissionError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'delete-campaign',
          arguments: {
            campaign_id: '123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('User does not have permission to access this resource')
      });
      expect(result?.content?.[0].text).toContain('Error deleting campaign');
    });

    it('should handle not found errors', async () => {
      const notFoundError = new Error('Campaign not found');
      notFoundError.name = 'GraphMethodException';
      mockClient.request = jest.fn().mockRejectedValue(notFoundError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-campaign-details',
          arguments: {
            campaign_id: 'nonexistent'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Campaign not found')
      });
      expect(result?.content?.[0].text).toContain('Error fetching campaign details');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid parameter value');
      validationError.name = 'ValidationException';
      mockClient.request = jest.fn().mockRejectedValue(validationError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-campaign',
          arguments: {
            account_id: 'act_123456',
            name: 'Test Campaign',
            objective: 'INVALID_OBJECTIVE',
            status: 'PAUSED',
            special_ad_categories: ['NONE']
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Invalid parameter value')
      });
      expect(result?.content?.[0].text).toContain('Error creating campaign');
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error');
      serverError.name = 'ServerException';
      mockClient.request = jest.fn().mockRejectedValue(serverError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-ad-creatives',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Internal server error')
      });
      expect(result?.content?.[0].text).toContain('Error listing ad creatives');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';
      mockClient.request = jest.fn().mockRejectedValue(networkError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'upload-ad-image',
          arguments: {
            account_id: 'act_123456',
            image_url: 'https://example.com/image.jpg'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Network request failed')
      });
      expect(result?.content?.[0].text).toContain('Error uploading image');
    });
  });

  describe('Error Response Format', () => {
    it('should provide consistent error message format', async () => {
      const errors = [
        { error: new Error('Test error 1'), tool: 'list-campaigns', args: { account_id: 'act_123456' } },
        { error: new Error('Test error 2'), tool: 'get-account-insights', args: { account_id: 'act_123456', date_preset: 'last_7d' } },
        { error: new Error('Test error 3'), tool: 'create-custom-audience', args: { account_id: 'act_123456', name: 'Test' } }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { error, tool, args } of errors) {
        mockClient.request = jest.fn().mockRejectedValue(error);
        
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool,
            arguments: args
          }
        });

        expect(result?.content).toHaveLength(1);
        expect(result?.content?.[0].type).toBe('text');
        expect(result?.content?.[0].text).toContain('Error');
        expect(result?.content?.[0].text).toContain(error.message);
      }
    });

    it('should include helpful error context', async () => {
      const contextError = new Error('Campaign daily budget must be at least $1');
      contextError.name = 'ValidationException';
      mockClient.request = jest.fn().mockRejectedValue(contextError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-campaign',
          arguments: {
            account_id: 'act_123456',
            name: 'Test Campaign',
            objective: 'CONVERSIONS',
            daily_budget: '0',
            status: 'PAUSED',
            special_ad_categories: ['NONE']
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Campaign daily budget must be at least $1');
      expect(result?.content?.[0].text).toContain('Error creating campaign');
    });
  });

  describe('Error Recovery', () => {
    it('should handle partial failures in batch operations', async () => {
      const handler = server._requestHandlers.get('tools/call');
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockFactory.generateAdCreative({ name: 'Creative 1' }))
        .mockRejectedValueOnce(new Error('Invalid creative data'))
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
      expect(result?.content?.[0].text).toContain('Failed: 1');
      expect(result?.content?.[0].text).toContain('Invalid creative data');
    });

    it('should handle errors during data processing', async () => {
      const malformedResponse = {
        data: [
          { invalid: 'data' },
          null,
          undefined
        ]
      };
      
      mockClient.request = jest.fn().mockResolvedValue(malformedResponse);

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

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error')
      });
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should provide actionable error messages for common issues', async () => {
      const commonErrors = [
        {
          error: new Error('Invalid user access token'),
          expectedMessage: 'Invalid user access token'
        },
        {
          error: new Error('Rate limit exceeded'),
          expectedMessage: 'Rate limit exceeded'
        },
        {
          error: new Error('User does not have permission'),
          expectedMessage: 'User does not have permission'
        },
        {
          error: new Error('Campaign not found'),
          expectedMessage: 'Campaign not found'
        }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { error, expectedMessage } of commonErrors) {
        mockClient.request = jest.fn().mockRejectedValue(error);
        
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'get-campaign-details',
            arguments: {
              campaign_id: '123456'
            }
          }
        });

        expect(result?.content?.[0].text).toContain(expectedMessage);
      }
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        null,
        undefined,
        new Error(''),
        new Error(),
        { message: 'Not an Error object' }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const errorCase of edgeCases) {
        mockClient.request = jest.fn().mockRejectedValue(errorCase);
        
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
          text: expect.stringContaining('Error')
        });
      }
    });
  });

  describe('Error Logging and Debugging', () => {
    it('should preserve error stack traces for debugging', async () => {
      const errorWithStack = new Error('Test error with stack');
      errorWithStack.stack = 'Error: Test error with stack\n    at test.js:1:1';
      
      mockClient.request = jest.fn().mockRejectedValue(errorWithStack);

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
        text: expect.stringContaining('Test error with stack')
      });
    });

    it('should handle API error codes correctly', async () => {
      const apiErrorCodes = [
        { code: 190, message: 'Invalid user access token' },
        { code: 613, message: 'Rate limit exceeded' },
        { code: 200, message: 'Permissions error' },
        { code: 100, message: 'Invalid parameter' }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { code, message } of apiErrorCodes) {
        const apiError = new Error(message);
        apiError.name = 'GraphAPIException';
        // @ts-ignore
        apiError.code = code;
        
        mockClient.request = jest.fn().mockRejectedValue(apiError);
        
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

  describe('Tool-Specific Error Handling', () => {
    it('should handle campaign-specific errors', async () => {
      const campaignErrors = [
        { error: new Error('Campaign is already deleted'), tool: 'delete-campaign' },
        { error: new Error('Invalid campaign objective'), tool: 'create-campaign' },
        { error: new Error('Budget too low'), tool: 'update-campaign' }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { error, tool } of campaignErrors) {
        mockClient.request = jest.fn().mockRejectedValue(error);
        
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool,
            arguments: {
              campaign_id: '123456'
            }
          }
        });

        expect(result?.content?.[0].text).toContain(error.message);
      }
    });

    it('should handle audience-specific errors', async () => {
      const audienceErrors = [
        { error: new Error('Audience is too small'), tool: 'create-lookalike-audience' },
        { error: new Error('Invalid email format'), tool: 'add-users-to-audience' },
        { error: new Error('Audience is being used by active campaigns'), tool: 'delete-custom-audience' }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { error, tool } of audienceErrors) {
        mockClient.request = jest.fn().mockRejectedValue(error);
        
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool,
            arguments: {
              audience_id: '123456'
            }
          }
        });

        expect(result?.content?.[0].text).toContain(error.message);
      }
    });

    it('should handle creative-specific errors', async () => {
      const creativeErrors = [
        { error: new Error('Image file too large'), tool: 'upload-ad-image' },
        { error: new Error('Video format not supported'), tool: 'upload-ad-video' },
        { error: new Error('Creative violates policy'), tool: 'create-ad-creative' }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { error, tool } of creativeErrors) {
        mockClient.request = jest.fn().mockRejectedValue(error);
        
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool,
            arguments: {
              account_id: 'act_123456'
            }
          }
        });

        expect(result?.content?.[0].text).toContain(error.message);
      }
    });

    it('should handle OAuth-specific errors', async () => {
      const oauthErrors = [
        { error: new Error('Invalid authorization code'), tool: 'exchange-code-for-token' },
        { error: new Error('Refresh token expired'), tool: 'refresh-access-token' },
        { error: new Error('Invalid app credentials'), tool: 'get-long-lived-token' }
      ];

      const handler = server._requestHandlers.get('tools/call');
      
      for (const { error, tool } of oauthErrors) {
        mockClient.request = jest.fn().mockRejectedValue(error);
        
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool,
            arguments: {
              app_id: '123456',
              app_secret: 'secret'
            }
          }
        });

        expect(result?.content?.[0].text).toContain(error.message);
      }
    });
  });

  describe('Error Prevention', () => {
    it('should validate input parameters before API calls', async () => {
      const handler = server._requestHandlers.get('tools/call');
      
      const invalidInputs = [
        { tool: 'create-campaign', args: { name: '' } },
        { tool: 'get-campaign-insights', args: { campaign_id: null } },
        { tool: 'create-custom-audience', args: { account_id: 'invalid' } }
      ];

      for (const { tool, args } of invalidInputs) {
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: tool,
            arguments: args
          }
        });

        expect(result?.content?.[0].text).toContain('Error');
      }
    });

    it('should handle missing required parameters gracefully', async () => {
      const handler = server._requestHandlers.get('tools/call');
      
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-campaign',
          arguments: {}
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error')
      });
    });
  });
});