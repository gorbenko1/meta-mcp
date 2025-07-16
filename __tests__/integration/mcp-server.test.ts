import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MetaApiClient } from '../../src/meta-client';
import { setupCampaignTools } from '../../src/tools/campaigns';
import { setupAnalyticsTools } from '../../src/tools/analytics';
import { setupAudienceTools } from '../../src/tools/audiences';
import { setupCreativeTools } from '../../src/tools/creatives';
import { setupOAuthTools } from '../../src/tools/oauth';
import { mockFactory } from '../helpers/mock-factory';

jest.mock('../../src/meta-client');

describe('MCP Server Integration Tests', () => {
  let server: Server;
  let mockClient: jest.Mocked<MetaApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    server = new Server(
      {
        name: 'meta-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Server Initialization', () => {
    it('should initialize with correct server information', () => {
      expect(server.name).toBe('meta-mcp-server');
      expect(server.version).toBe('1.0.0');
    });

    it('should register all tool handlers', () => {
      const expectedTools = [
        'list-campaigns',
        'get-campaign-details',
        'create-campaign',
        'update-campaign',
        'delete-campaign',
        'get-campaign-insights',
        'list-ad-sets',
        'create-ad-set',
        'update-ad-set',
        'delete-ad-set',
        'list-ads',
        'create-ad',
        'update-ad-status',
        'duplicate-campaign',
        'get-campaign-budget-history',
        'get-account-insights',
        'get-ad-insights',
        'create-custom-report',
        'get-performance-by-age',
        'get-performance-by-gender',
        'list-custom-audiences',
        'get-audience-details',
        'create-custom-audience',
        'update-custom-audience',
        'delete-custom-audience',
        'create-lookalike-audience',
        'add-users-to-audience',
        'list-ad-creatives',
        'get-creative-details',
        'create-ad-creative',
        'update-ad-creative',
        'delete-ad-creative',
        'list-ad-images',
        'upload-ad-image',
        'delete-ad-image',
        'list-ad-videos',
        'upload-ad-video',
        'delete-ad-video',
        'generate-ad-preview',
        'test-ad-creative',
        'duplicate-ad-creative',
        'batch-create-creatives',
        'generate-oauth-url',
        'exchange-code-for-token',
        'get-long-lived-token',
        'refresh-access-token',
        'get-user-info',
        'get-user-permissions',
        'validate-access-token'
      ];

      expectedTools.forEach(toolName => {
        expect(server._requestHandlers.has('tools/call')).toBe(true);
      });
    });
  });

  describe('Tool List Endpoint', () => {
    it('should list all available tools', async () => {
      const listHandler = server._requestHandlers.get('tools/list');
      const result = await listHandler?.({
        method: 'tools/list',
        params: {}
      });

      expect(result?.tools).toBeDefined();
      expect(result?.tools?.length).toBeGreaterThan(40);
      
      const toolNames = result?.tools?.map(tool => tool.name);
      expect(toolNames).toContain('list-campaigns');
      expect(toolNames).toContain('get-account-insights');
      expect(toolNames).toContain('create-custom-audience');
      expect(toolNames).toContain('list-ad-creatives');
      expect(toolNames).toContain('generate-oauth-url');
    });

    it('should include tool descriptions and schemas', async () => {
      const listHandler = server._requestHandlers.get('tools/list');
      const result = await listHandler?.({
        method: 'tools/list',
        params: {}
      });

      const campaignTool = result?.tools?.find(tool => tool.name === 'list-campaigns');
      expect(campaignTool?.description).toBeDefined();
      expect(campaignTool?.inputSchema).toBeDefined();
      expect(campaignTool?.inputSchema?.properties).toBeDefined();
    });
  });

  describe('Cross-Tool Workflow Integration', () => {
    it('should support campaign creation to insights workflow', async () => {
      const mockCampaign = mockFactory.generateCampaign();
      const mockInsights = {
        data: [mockFactory.generateInsights()]
      };
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockCampaign)
        .mockResolvedValueOnce(mockInsights);

      const handler = server._requestHandlers.get('tools/call');
      
      const createResult = await handler?.({
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

      expect(createResult?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Campaign created successfully')
      });

      const insightsResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-campaign-insights',
          arguments: {
            campaign_id: mockCampaign.id,
            date_preset: 'last_7d'
          }
        }
      });

      expect(insightsResult?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Campaign Performance')
      });
    });

    it('should support audience creation to targeting workflow', async () => {
      const mockAudience = mockFactory.generateCustomAudience();
      const mockAdSet = mockFactory.generateAdSet();
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockAudience)
        .mockResolvedValueOnce(mockAdSet);

      const handler = server._requestHandlers.get('tools/call');
      
      const audienceResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-custom-audience',
          arguments: {
            account_id: 'act_123456',
            name: 'Website Visitors',
            subtype: 'WEBSITE',
            website_rule: {
              url: 'https://example.com',
              event_type: 'page_view'
            }
          }
        }
      });

      expect(audienceResult?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Custom audience created successfully')
      });

      const adSetResult = await handler?.({
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
              custom_audiences: [mockAudience.id]
            }
          }
        }
      });

      expect(adSetResult?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Ad set created successfully')
      });
    });

    it('should support creative creation to ad creation workflow', async () => {
      const mockCreative = mockFactory.generateAdCreative();
      const mockAd = mockFactory.generateAd();
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockCreative)
        .mockResolvedValueOnce(mockAd);

      const handler = server._requestHandlers.get('tools/call');
      
      const creativeResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-ad-creative',
          arguments: {
            account_id: 'act_123456',
            name: 'Test Creative',
            object_story_spec: {
              page_id: '123456',
              link_data: {
                link: 'https://example.com',
                message: 'Test message'
              }
            }
          }
        }
      });

      expect(creativeResult?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Ad creative created successfully')
      });

      const adResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-ad',
          arguments: {
            adset_id: '123456',
            name: 'Test Ad',
            creative_id: mockCreative.id,
            status: 'PAUSED'
          }
        }
      });

      expect(adResult?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Ad created successfully')
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent data format across related tools', async () => {
      const mockCampaigns = mockFactory.generateBatchData(() => 
        mockFactory.generateCampaign(), 3
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockCampaigns);
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockCampaigns[0]);

      const handler = server._requestHandlers.get('tools/call');
      
      const listResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      const detailsResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-campaign-details',
          arguments: {
            campaign_id: mockCampaigns[0].id
          }
        }
      });

      expect(listResult?.content?.[0].text).toContain(mockCampaigns[0].name);
      expect(detailsResult?.content?.[0].text).toContain(mockCampaigns[0].name);
    });
  });

  describe('Error Propagation', () => {
    it('should properly propagate API errors across tools', async () => {
      const apiError = new Error('Invalid account ID');
      mockClient.request = jest.fn().mockRejectedValue(apiError);

      const handler = server._requestHandlers.get('tools/call');
      
      const campaignResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-campaigns',
          arguments: {
            account_id: 'act_invalid'
          }
        }
      });

      const insightsResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-account-insights',
          arguments: {
            account_id: 'act_invalid',
            date_preset: 'last_7d'
          }
        }
      });

      expect(campaignResult?.content?.[0].text).toContain('Invalid account ID');
      expect(insightsResult?.content?.[0].text).toContain('Invalid account ID');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent tool calls', async () => {
      const mockCampaigns = mockFactory.generateBatchData(() => 
        mockFactory.generateCampaign(), 2
      );
      const mockInsights = {
        data: [mockFactory.generateInsights()]
      };
      const mockAudiences = mockFactory.generateBatchData(() => 
        mockFactory.generateCustomAudience(), 2
      );
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockFactory.generatePaginatedResponse(mockCampaigns))
        .mockResolvedValueOnce(mockInsights)
        .mockResolvedValueOnce(mockFactory.generatePaginatedResponse(mockAudiences));

      const handler = server._requestHandlers.get('tools/call');
      
      const [campaignResult, insightsResult, audienceResult] = await Promise.all([
        handler?.({
          method: 'tools/call',
          params: {
            name: 'list-campaigns',
            arguments: {
              account_id: 'act_123456'
            }
          }
        }),
        handler?.({
          method: 'tools/call',
          params: {
            name: 'get-account-insights',
            arguments: {
              account_id: 'act_123456',
              date_preset: 'last_7d'
            }
          }
        }),
        handler?.({
          method: 'tools/call',
          params: {
            name: 'list-custom-audiences',
            arguments: {
              account_id: 'act_123456'
            }
          }
        })
      ]);

      expect(campaignResult?.content?.[0].text).toContain('Found 2 campaigns');
      expect(insightsResult?.content?.[0].text).toContain('Account Performance');
      expect(audienceResult?.content?.[0].text).toContain('Found 2 custom audiences');
    });
  });

  describe('Tool Parameter Validation', () => {
    it('should validate required parameters across all tools', async () => {
      const handler = server._requestHandlers.get('tools/call');
      
      const campaignResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-campaign',
          arguments: {
            name: 'Test Campaign'
          }
        }
      });

      const audienceResult = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-custom-audience',
          arguments: {
            name: 'Test Audience'
          }
        }
      });

      expect(campaignResult?.content?.[0].text).toContain('Error');
      expect(audienceResult?.content?.[0].text).toContain('Error');
    });

    it('should validate parameter types', async () => {
      const handler = server._requestHandlers.get('tools/call');
      
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-campaign-insights',
          arguments: {
            campaign_id: 123456,
            date_preset: 'last_7d'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Error');
    });
  });

  describe('Output Format Consistency', () => {
    it('should maintain consistent output format across all tools', async () => {
      const mockCampaign = mockFactory.generateCampaign();
      const mockAudience = mockFactory.generateCustomAudience();
      const mockCreative = mockFactory.generateAdCreative();
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce(mockCampaign)
        .mockResolvedValueOnce(mockAudience)
        .mockResolvedValueOnce(mockCreative);

      const handler = server._requestHandlers.get('tools/call');
      
      const [campaignResult, audienceResult, creativeResult] = await Promise.all([
        handler?.({
          method: 'tools/call',
          params: {
            name: 'get-campaign-details',
            arguments: {
              campaign_id: '123456'
            }
          }
        }),
        handler?.({
          method: 'tools/call',
          params: {
            name: 'get-audience-details',
            arguments: {
              audience_id: '123456'
            }
          }
        }),
        handler?.({
          method: 'tools/call',
          params: {
            name: 'get-creative-details',
            arguments: {
              creative_id: '123456'
            }
          }
        })
      ]);

      expect(campaignResult?.content?.[0].type).toBe('text');
      expect(audienceResult?.content?.[0].type).toBe('text');
      expect(creativeResult?.content?.[0].type).toBe('text');
      
      expect(campaignResult?.content?.[0].text).toContain('Campaign Details');
      expect(audienceResult?.content?.[0].text).toContain('Audience Details');
      expect(creativeResult?.content?.[0].text).toContain('Creative Details');
    });
  });
});