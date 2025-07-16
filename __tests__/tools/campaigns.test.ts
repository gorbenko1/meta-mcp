import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MetaApiClient } from '../../src/meta-client';
import { setupCampaignTools } from '../../src/tools/campaigns';
import { mockFactory } from '../helpers/mock-factory';
import type { Campaign, AdSet, Ad } from '../../src/types';

jest.mock('../../src/meta-client');

describe('Campaign Tools', () => {
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
  });

  describe('list-campaigns', () => {
    it('should list all campaigns for an account', async () => {
      const mockCampaigns = mockFactory.generateBatchData(() => mockFactory.generateCampaign(), 5);
      const mockResponse = mockFactory.generatePaginatedResponse(mockCampaigns);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

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

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/campaigns', {
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,effective_status'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Found 5 campaigns')
      });
    });

    it('should handle filters correctly', async () => {
      const mockCampaigns = mockFactory.generateBatchData(() => 
        mockFactory.generateCampaign({ status: 'ACTIVE' }), 3
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockCampaigns);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456',
            status: 'ACTIVE',
            limit: 10
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/campaigns', {
        fields: expect.any(String),
        filtering: JSON.stringify([{ field: 'status', operator: 'IN', value: ['ACTIVE'] }]),
        limit: 10
      });
    });

    it('should handle errors gracefully', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('API Error'));

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
        text: expect.stringContaining('Error listing campaigns: API Error')
      });
    });
  });

  describe('get-campaign-details', () => {
    it('should fetch detailed campaign information', async () => {
      const mockCampaign = mockFactory.generateCampaign();
      mockClient.request = jest.fn().mockResolvedValue(mockCampaign);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-campaign-details',
          arguments: {
            campaign_id: '123456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {
        fields: expect.stringContaining('id,name,status,objective')
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining(mockCampaign.name)
      });
    });
  });

  describe('create-campaign', () => {
    it('should create a new campaign', async () => {
      const mockCampaign = mockFactory.generateCampaign();
      mockClient.request = jest.fn().mockResolvedValue(mockCampaign);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-campaign',
          arguments: {
            account_id: 'act_123456',
            name: 'Test Campaign',
            objective: 'CONVERSIONS',
            status: 'PAUSED',
            special_ad_categories: ['NONE']
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/campaigns', {}, {
        name: 'Test Campaign',
        objective: 'CONVERSIONS',
        status: 'PAUSED',
        special_ad_categories: ['NONE']
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Campaign created successfully')
      });
    });

    it('should handle bid strategy parameters', async () => {
      const mockCampaign = mockFactory.generateCampaign();
      mockClient.request = jest.fn().mockResolvedValue(mockCampaign);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-campaign',
          arguments: {
            account_id: 'act_123456',
            name: 'Test Campaign',
            objective: 'CONVERSIONS',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            daily_budget: '50'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          daily_budget: '50'
        })
      );
    });
  });

  describe('update-campaign', () => {
    it('should update campaign fields', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'update-campaign',
          arguments: {
            campaign_id: '123456',
            status: 'ACTIVE',
            daily_budget: '100'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, {
        status: 'ACTIVE',
        daily_budget: '100'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Campaign updated successfully')
      });
    });
  });

  describe('delete-campaign', () => {
    it('should delete a campaign', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true });

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

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, null, 'DELETE');

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Campaign deleted successfully')
      });
    });
  });

  describe('get-campaign-insights', () => {
    it('should fetch campaign performance metrics', async () => {
      const mockInsights = {
        data: [mockFactory.generateInsights()]
      };
      mockClient.request = jest.fn().mockResolvedValue(mockInsights);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-campaign-insights',
          arguments: {
            campaign_id: '123456',
            date_preset: 'last_7d'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456/insights', {
        date_preset: 'last_7d',
        fields: expect.stringContaining('impressions,clicks,spend,reach')
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Campaign Performance')
      });
    });

    it('should handle custom date ranges', async () => {
      const mockInsights = {
        data: [mockFactory.generateInsights()]
      };
      mockClient.request = jest.fn().mockResolvedValue(mockInsights);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-campaign-insights',
          arguments: {
            campaign_id: '123456',
            time_range: {
              since: '2024-01-01',
              until: '2024-01-31'
            }
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456/insights', {
        time_range: JSON.stringify({ since: '2024-01-01', until: '2024-01-31' }),
        fields: expect.any(String)
      });
    });
  });

  describe('Ad Set Tools', () => {
    describe('list-ad-sets', () => {
      it('should list ad sets for a campaign', async () => {
        const mockAdSets = mockFactory.generateBatchData(() => mockFactory.generateAdSet(), 3);
        const mockResponse = mockFactory.generatePaginatedResponse(mockAdSets);
        
        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'list-ad-sets',
            arguments: {
              campaign_id: '123456'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456/adsets', {
          fields: expect.stringContaining('id,name,status,daily_budget')
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Found 3 ad sets')
        });
      });
    });

    describe('create-ad-set', () => {
      it('should create a new ad set with targeting', async () => {
        const mockAdSet = mockFactory.generateAdSet();
        mockClient.request = jest.fn().mockResolvedValue(mockAdSet);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'create-ad-set',
            arguments: {
              campaign_id: '123456',
              name: 'Test Ad Set',
              daily_budget: '50',
              billing_event: 'IMPRESSIONS',
              optimization_goal: 'REACH',
              targeting: {
                age_min: 25,
                age_max: 45,
                genders: [1, 2],
                geo_locations: {
                  countries: ['US', 'CA']
                }
              },
              status: 'PAUSED'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith(
          '/act_undefined/adsets',
          {},
          expect.objectContaining({
            campaign_id: '123456',
            name: 'Test Ad Set',
            daily_budget: '50',
            targeting: expect.objectContaining({
              age_min: 25,
              age_max: 45
            })
          })
        );

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Ad set created successfully')
        });
      });
    });
  });

  describe('Ad Tools', () => {
    describe('list-ads', () => {
      it('should list ads for an ad set', async () => {
        const mockAds = mockFactory.generateBatchData(() => mockFactory.generateAd(), 5);
        const mockResponse = mockFactory.generatePaginatedResponse(mockAds);
        
        mockClient.request = jest.fn().mockResolvedValue(mockResponse);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'list-ads',
            arguments: {
              adset_id: '123456'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456/ads', {
          fields: expect.stringContaining('id,name,status,creative')
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Found 5 ads')
        });
      });
    });

    describe('create-ad', () => {
      it('should create a new ad', async () => {
        const mockAd = mockFactory.generateAd();
        mockClient.request = jest.fn().mockResolvedValue(mockAd);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'create-ad',
            arguments: {
              adset_id: '123456',
              name: 'Test Ad',
              creative_id: '789012',
              status: 'PAUSED'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith(
          '/act_undefined/ads',
          {},
          {
            adset_id: '123456',
            name: 'Test Ad',
            creative: { creative_id: '789012' },
            status: 'PAUSED'
          }
        );

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Ad created successfully')
        });
      });
    });

    describe('update-ad-status', () => {
      it('should update ad status', async () => {
        mockClient.request = jest.fn().mockResolvedValue({ success: true });

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'update-ad-status',
            arguments: {
              ad_id: '123456',
              status: 'ACTIVE'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, {
          status: 'ACTIVE'
        });

        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Ad status updated successfully')
        });
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('duplicate-campaign', () => {
      it('should duplicate a campaign', async () => {
        const mockOriginal = mockFactory.generateCampaign({ name: 'Original Campaign' });
        const mockDuplicate = mockFactory.generateCampaign({ name: 'Copy of Original Campaign' });
        
        mockClient.request = jest.fn()
          .mockResolvedValueOnce(mockOriginal)
          .mockResolvedValueOnce(mockDuplicate);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'duplicate-campaign',
            arguments: {
              campaign_id: '123456',
              new_name: 'Copy of Original Campaign'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledTimes(2);
        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Campaign duplicated successfully')
        });
      });
    });

    describe('get-campaign-budget-history', () => {
      it('should fetch campaign budget history', async () => {
        const mockHistory = {
          data: [
            {
              time: '2024-01-01T00:00:00Z',
              daily_budget: '50',
              lifetime_budget: null
            },
            {
              time: '2024-01-15T00:00:00Z',
              daily_budget: '75',
              lifetime_budget: null
            }
          ]
        };
        
        mockClient.request = jest.fn().mockResolvedValue(mockHistory);

        const handler = server._requestHandlers.get('tools/call');
        const result = await handler?.({
          method: 'tools/call',
          params: {
            name: 'get-campaign-budget-history',
            arguments: {
              campaign_id: '123456'
            }
          }
        });

        expect(mockClient.request).toHaveBeenCalledWith('/123456/budget_history', {});
        expect(result?.content?.[0]).toMatchObject({
          type: 'text',
          text: expect.stringContaining('Budget History')
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
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

    it('should handle invalid parameters', async () => {
      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-campaign',
          arguments: {
            // Missing required fields
            name: 'Test Campaign'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error')
      });
    });
  });
});