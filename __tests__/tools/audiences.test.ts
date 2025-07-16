import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MetaApiClient } from '../../src/meta-client';
import { setupAudienceTools } from '../../src/tools/audiences';
import { mockFactory } from '../helpers/mock-factory';
import type { CustomAudience } from '../../src/types';

jest.mock('../../src/meta-client');

describe('Audience Tools', () => {
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

    setupAudienceTools(server, mockClient);
  });

  describe('list-custom-audiences', () => {
    it('should list all custom audiences for an account', async () => {
      const mockAudiences = mockFactory.generateBatchData(() => 
        mockFactory.generateCustomAudience(), 5
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockAudiences);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-custom-audiences',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {
        fields: expect.stringContaining('id,name,subtype,description,approximate_count')
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Found 5 custom audiences')
      });
    });

    it('should handle audience type filtering', async () => {
      const mockAudiences = mockFactory.generateBatchData(() => 
        mockFactory.generateCustomAudience({ subtype: 'LOOKALIKE' }), 3
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockAudiences);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-custom-audiences',
          arguments: {
            account_id: 'act_123456',
            subtype: 'LOOKALIKE'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {
        fields: expect.any(String),
        filtering: JSON.stringify([{ field: 'subtype', operator: 'EQUAL', value: 'LOOKALIKE' }])
      });
    });

    it('should handle pagination', async () => {
      const mockAudiences = mockFactory.generateBatchData(() => 
        mockFactory.generateCustomAudience(), 10
      );
      const mockResponse = mockFactory.generatePaginatedResponse(mockAudiences, true);
      
      mockClient.request = jest.fn().mockResolvedValue(mockResponse);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-custom-audiences',
          arguments: {
            account_id: 'act_123456',
            limit: 25
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {
        fields: expect.any(String),
        limit: 25
      });

      expect(result?.content?.[0].text).toContain('Next Page Available');
    });

    it('should handle errors gracefully', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('API Error'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-custom-audiences',
          arguments: {
            account_id: 'act_123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error listing custom audiences: API Error')
      });
    });
  });

  describe('get-audience-details', () => {
    it('should fetch detailed audience information', async () => {
      const mockAudience = mockFactory.generateCustomAudience({
        name: 'Website Visitors',
        subtype: 'WEBSITE',
        description: 'People who visited our website',
        approximate_count_lower_bound: 50000,
        approximate_count_upper_bound: 75000
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockAudience);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-audience-details',
          arguments: {
            audience_id: '123456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {
        fields: expect.stringContaining('id,name,subtype,description,approximate_count')
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Website Visitors')
      });

      expect(result?.content?.[0].text).toContain('50,000 - 75,000');
      expect(result?.content?.[0].text).toContain('People who visited our website');
    });

    it('should handle delivery status information', async () => {
      const mockAudience = mockFactory.generateCustomAudience({
        delivery_status: {
          status: '300',
          code: 300,
          description: 'Audience too small'
        },
        operation_status: {
          status: '200',
          code: 200,
          description: 'Normal'
        }
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockAudience);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-audience-details',
          arguments: {
            audience_id: '123456'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Delivery Status');
      expect(result?.content?.[0].text).toContain('Audience too small');
      expect(result?.content?.[0].text).toContain('Operation Status');
      expect(result?.content?.[0].text).toContain('Normal');
    });
  });

  describe('create-custom-audience', () => {
    it('should create a new custom audience', async () => {
      const mockAudience = mockFactory.generateCustomAudience({
        name: 'New Custom Audience',
        subtype: 'CUSTOM'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockAudience);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-custom-audience',
          arguments: {
            account_id: 'act_123456',
            name: 'New Custom Audience',
            subtype: 'CUSTOM',
            description: 'Test audience description'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {}, {
        name: 'New Custom Audience',
        subtype: 'CUSTOM',
        description: 'Test audience description'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Custom audience created successfully')
      });
    });

    it('should handle website custom audience creation', async () => {
      const mockAudience = mockFactory.generateCustomAudience({
        subtype: 'WEBSITE'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockAudience);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
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

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {}, {
        name: 'Website Visitors',
        subtype: 'WEBSITE',
        rule: {
          url: 'https://example.com',
          event_type: 'page_view'
        }
      });
    });

    it('should handle customer file audience creation', async () => {
      const mockAudience = mockFactory.generateCustomAudience({
        subtype: 'CUSTOM'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockAudience);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-custom-audience',
          arguments: {
            account_id: 'act_123456',
            name: 'Customer List',
            subtype: 'CUSTOM',
            customer_file_source: 'USER_PROVIDED_ONLY'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {}, {
        name: 'Customer List',
        subtype: 'CUSTOM',
        customer_file_source: 'USER_PROVIDED_ONLY'
      });
    });
  });

  describe('update-custom-audience', () => {
    it('should update audience properties', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'update-custom-audience',
          arguments: {
            audience_id: '123456',
            name: 'Updated Audience Name',
            description: 'Updated description'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, {
        name: 'Updated Audience Name',
        description: 'Updated description'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Custom audience updated successfully')
      });
    });

    it('should handle partial updates', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true });

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'update-custom-audience',
          arguments: {
            audience_id: '123456',
            description: 'Only updating description'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, {
        description: 'Only updating description'
      });
    });
  });

  describe('delete-custom-audience', () => {
    it('should delete an audience', async () => {
      mockClient.request = jest.fn().mockResolvedValue({ success: true });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'delete-custom-audience',
          arguments: {
            audience_id: '123456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456', {}, null, 'DELETE');

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Custom audience deleted successfully')
      });
    });

    it('should handle deletion errors', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Cannot delete audience in use'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'delete-custom-audience',
          arguments: {
            audience_id: '123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error deleting custom audience: Cannot delete audience in use')
      });
    });
  });

  describe('create-lookalike-audience', () => {
    it('should create a lookalike audience', async () => {
      const mockLookalike = mockFactory.generateCustomAudience({
        name: 'Lookalike - High Value Customers',
        subtype: 'LOOKALIKE'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockLookalike);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-lookalike-audience',
          arguments: {
            account_id: 'act_123456',
            name: 'Lookalike - High Value Customers',
            origin_audience_id: '789012',
            country: 'US',
            ratio: 0.01
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {}, {
        name: 'Lookalike - High Value Customers',
        subtype: 'LOOKALIKE',
        origin_audience_id: '789012',
        lookalike_spec: {
          ratio: 0.01,
          country: 'US'
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Lookalike audience created successfully')
      });
    });

    it('should handle multi-country lookalike audiences', async () => {
      const mockLookalike = mockFactory.generateCustomAudience({
        subtype: 'LOOKALIKE'
      });
      
      mockClient.request = jest.fn().mockResolvedValue(mockLookalike);

      const handler = server._requestHandlers.get('tools/call');
      await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-lookalike-audience',
          arguments: {
            account_id: 'act_123456',
            name: 'Multi-Country Lookalike',
            origin_audience_id: '789012',
            countries: ['US', 'CA', 'GB'],
            ratio: 0.05
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/act_123456/customaudiences', {}, {
        name: 'Multi-Country Lookalike',
        subtype: 'LOOKALIKE',
        origin_audience_id: '789012',
        lookalike_spec: {
          ratio: 0.05,
          countries: ['US', 'CA', 'GB']
        }
      });
    });

    it('should validate ratio parameter', async () => {
      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'create-lookalike-audience',
          arguments: {
            account_id: 'act_123456',
            name: 'Invalid Lookalike',
            origin_audience_id: '789012',
            country: 'US',
            ratio: 1.5
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error')
      });
    });
  });

  describe('add-users-to-audience', () => {
    it('should add users to a custom audience', async () => {
      mockClient.request = jest.fn().mockResolvedValue({
        audience_id: '123456',
        session_id: 'abc123',
        num_received: 1000,
        num_invalids: 0
      });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'add-users-to-audience',
          arguments: {
            audience_id: '123456',
            schema: ['EMAIL', 'PHONE'],
            data: [
              ['user1@example.com', '+1234567890'],
              ['user2@example.com', '+1234567891']
            ]
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/123456/users', {}, {
        schema: ['EMAIL', 'PHONE'],
        data: [
          ['user1@example.com', '+1234567890'],
          ['user2@example.com', '+1234567891']
        ]
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Users added to audience successfully')
      });

      expect(result?.content?.[0].text).toContain('Received: 1,000');
      expect(result?.content?.[0].text).toContain('Invalid: 0');
    });

    it('should handle batch processing', async () => {
      const largeDataset = Array.from({ length: 15000 }, (_, i) => [`user${i}@example.com`]);
      
      mockClient.request = jest.fn()
        .mockResolvedValueOnce({
          audience_id: '123456',
          session_id: 'abc123',
          num_received: 10000,
          num_invalids: 0
        })
        .mockResolvedValueOnce({
          audience_id: '123456',
          session_id: 'abc123',
          num_received: 5000,
          num_invalids: 0
        });

      const handler = server._requestHandlers.get('tools/call');
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

      expect(mockClient.request).toHaveBeenCalledTimes(2);
      expect(result?.content?.[0].text).toContain('Processed 2 batches');
      expect(result?.content?.[0].text).toContain('Total received: 15,000');
    });

    it('should handle validation errors', async () => {
      mockClient.request = jest.fn().mockResolvedValue({
        audience_id: '123456',
        session_id: 'abc123',
        num_received: 500,
        num_invalids: 500
      });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'add-users-to-audience',
          arguments: {
            audience_id: '123456',
            schema: ['EMAIL'],
            data: [
              ['valid@example.com'],
              ['invalid-email']
            ]
          }
        }
      });

      expect(result?.content?.[0].text).toContain('Invalid: 500');
      expect(result?.content?.[0].text).toContain('⚠️ Warning: 50.0% of entries were invalid');
    });
  });

  describe('Error Handling', () => {
    it('should handle permission errors', async () => {
      const permissionError = new Error('User does not have permission to access this audience');
      permissionError.name = 'PermissionException';
      mockClient.request = jest.fn().mockRejectedValue(permissionError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-audience-details',
          arguments: {
            audience_id: '123456'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('User does not have permission to access this audience')
      });
    });

    it('should handle audience not found errors', async () => {
      const notFoundError = new Error('Audience not found');
      notFoundError.name = 'GraphMethodException';
      mockClient.request = jest.fn().mockRejectedValue(notFoundError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-audience-details',
          arguments: {
            audience_id: 'nonexistent'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Audience not found')
      });
    });

    it('should handle rate limiting gracefully', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'list-custom-audiences',
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
  });
});