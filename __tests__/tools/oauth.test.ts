import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MetaApiClient } from '../../src/meta-client';
import { setupOAuthTools } from '../../src/tools/oauth';
import { mockFactory } from '../helpers/mock-factory';

jest.mock('../../src/meta-client');

describe('OAuth Tools', () => {
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

    setupOAuthTools(server, mockClient);
  });

  describe('generate-oauth-url', () => {
    it('should generate OAuth authorization URL', async () => {
      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'generate-oauth-url',
          arguments: {
            app_id: '123456789',
            redirect_uri: 'https://example.com/callback',
            scope: 'ads_management,pages_read_engagement'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('OAuth Authorization URL')
      });

      expect(result?.content?.[0].text).toContain('https://www.facebook.com/v21.0/dialog/oauth');
      expect(result?.content?.[0].text).toContain('client_id=123456789');
      expect(result?.content?.[0].text).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcallback');
      expect(result?.content?.[0].text).toContain('scope=ads_management%2Cpages_read_engagement');
      expect(result?.content?.[0].text).toContain('response_type=code');
    });

    it('should handle optional parameters', async () => {
      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'generate-oauth-url',
          arguments: {
            app_id: '123456789',
            redirect_uri: 'https://example.com/callback',
            scope: 'ads_management',
            state: 'random_state_value'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('state=random_state_value');
    });

    it('should handle missing required parameters', async () => {
      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'generate-oauth-url',
          arguments: {
            app_id: '123456789'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error')
      });
    });
  });

  describe('exchange-code-for-token', () => {
    it('should exchange authorization code for access token', async () => {
      const mockTokenResponse = {
        access_token: 'long_lived_access_token_123',
        token_type: 'bearer',
        expires_in: 5184000
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockTokenResponse);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'exchange-code-for-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            code: 'auth_code_123',
            redirect_uri: 'https://example.com/callback'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/oauth/access_token', {
        client_id: '123456789',
        client_secret: 'app_secret_123',
        code: 'auth_code_123',
        redirect_uri: 'https://example.com/callback'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Access Token Retrieved')
      });

      expect(result?.content?.[0].text).toContain('long_lived_access_token_123');
      expect(result?.content?.[0].text).toContain('Expires in: 5184000 seconds');
    });

    it('should handle invalid authorization code', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Invalid authorization code'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'exchange-code-for-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            code: 'invalid_code',
            redirect_uri: 'https://example.com/callback'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error exchanging code for token: Invalid authorization code')
      });
    });
  });

  describe('get-long-lived-token', () => {
    it('should exchange short-lived token for long-lived token', async () => {
      const mockLongLivedResponse = {
        access_token: 'long_lived_token_456',
        token_type: 'bearer',
        expires_in: 5184000
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockLongLivedResponse);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-long-lived-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            short_lived_token: 'short_lived_token_123'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/oauth/access_token', {
        grant_type: 'fb_exchange_token',
        client_id: '123456789',
        client_secret: 'app_secret_123',
        fb_exchange_token: 'short_lived_token_123'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Long-lived Token Retrieved')
      });

      expect(result?.content?.[0].text).toContain('long_lived_token_456');
      expect(result?.content?.[0].text).toContain('Valid for: 60 days');
    });

    it('should handle token exchange failure', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Token exchange failed'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-long-lived-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            short_lived_token: 'invalid_token'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error getting long-lived token: Token exchange failed')
      });
    });
  });

  describe('refresh-access-token', () => {
    it('should refresh access token using refresh token', async () => {
      const mockRefreshResponse = {
        access_token: 'new_access_token_789',
        token_type: 'bearer',
        expires_in: 3600
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockRefreshResponse);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'refresh-access-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            refresh_token: 'refresh_token_456'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/oauth/access_token', {
        grant_type: 'refresh_token',
        client_id: '123456789',
        client_secret: 'app_secret_123',
        refresh_token: 'refresh_token_456'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Access Token Refreshed')
      });

      expect(result?.content?.[0].text).toContain('new_access_token_789');
      expect(result?.content?.[0].text).toContain('Expires in: 3600 seconds');
    });

    it('should handle invalid refresh token', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Invalid refresh token'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'refresh-access-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            refresh_token: 'invalid_refresh_token'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error refreshing access token: Invalid refresh token')
      });
    });
  });

  describe('get-user-info', () => {
    it('should retrieve user information', async () => {
      const mockUserInfo = {
        id: '123456789',
        name: 'John Doe',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        picture: {
          data: {
            url: 'https://example.com/profile-pic.jpg'
          }
        }
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockUserInfo);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-user-info',
          arguments: {
            access_token: 'user_access_token_123'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/me', {
        fields: 'id,name,email,first_name,last_name,picture',
        access_token: 'user_access_token_123'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('User Information')
      });

      expect(result?.content?.[0].text).toContain('John Doe');
      expect(result?.content?.[0].text).toContain('john.doe@example.com');
      expect(result?.content?.[0].text).toContain('123456789');
    });

    it('should handle custom fields', async () => {
      const mockUserInfo = {
        id: '123456789',
        name: 'John Doe',
        birthday: '01/01/1990',
        hometown: {
          name: 'New York, NY'
        }
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockUserInfo);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-user-info',
          arguments: {
            access_token: 'user_access_token_123',
            fields: 'id,name,birthday,hometown'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/me', {
        fields: 'id,name,birthday,hometown',
        access_token: 'user_access_token_123'
      });

      expect(result?.content?.[0].text).toContain('01/01/1990');
      expect(result?.content?.[0].text).toContain('New York, NY');
    });

    it('should handle invalid access token', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Invalid access token'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-user-info',
          arguments: {
            access_token: 'invalid_token'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error retrieving user info: Invalid access token')
      });
    });
  });

  describe('get-user-permissions', () => {
    it('should retrieve user permissions', async () => {
      const mockPermissions = {
        data: [
          {
            permission: 'ads_management',
            status: 'granted'
          },
          {
            permission: 'pages_read_engagement',
            status: 'granted'
          },
          {
            permission: 'business_management',
            status: 'declined'
          }
        ]
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockPermissions);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-user-permissions',
          arguments: {
            access_token: 'user_access_token_123'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/me/permissions', {
        access_token: 'user_access_token_123'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('User Permissions')
      });

      expect(result?.content?.[0].text).toContain('✅ ads_management: granted');
      expect(result?.content?.[0].text).toContain('✅ pages_read_engagement: granted');
      expect(result?.content?.[0].text).toContain('❌ business_management: declined');
    });

    it('should handle no permissions', async () => {
      const mockPermissions = {
        data: []
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockPermissions);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-user-permissions',
          arguments: {
            access_token: 'user_access_token_123'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('No permissions found');
    });

    it('should handle permission retrieval error', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-user-permissions',
          arguments: {
            access_token: 'invalid_token'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error retrieving user permissions: Permission denied')
      });
    });
  });

  describe('validate-access-token', () => {
    it('should validate access token successfully', async () => {
      const mockValidation = {
        data: {
          app_id: '123456789',
          type: 'USER',
          application: 'Test App',
          expires_at: 1672531200,
          is_valid: true,
          scopes: ['ads_management', 'pages_read_engagement'],
          user_id: '987654321'
        }
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockValidation);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'validate-access-token',
          arguments: {
            access_token: 'user_access_token_123'
          }
        }
      });

      expect(mockClient.request).toHaveBeenCalledWith('/debug_token', {
        input_token: 'user_access_token_123'
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Token Validation Result')
      });

      expect(result?.content?.[0].text).toContain('✅ Valid: true');
      expect(result?.content?.[0].text).toContain('App ID: 123456789');
      expect(result?.content?.[0].text).toContain('User ID: 987654321');
      expect(result?.content?.[0].text).toContain('Test App');
      expect(result?.content?.[0].text).toContain('ads_management');
      expect(result?.content?.[0].text).toContain('pages_read_engagement');
    });

    it('should handle invalid token validation', async () => {
      const mockValidation = {
        data: {
          is_valid: false,
          error: {
            code: 190,
            message: 'Invalid OAuth access token'
          }
        }
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockValidation);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'validate-access-token',
          arguments: {
            access_token: 'invalid_token'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('❌ Valid: false');
      expect(result?.content?.[0].text).toContain('Error: Invalid OAuth access token');
    });

    it('should handle expired token validation', async () => {
      const mockValidation = {
        data: {
          app_id: '123456789',
          type: 'USER',
          application: 'Test App',
          expires_at: 1640995200,
          is_valid: false,
          error: {
            code: 190,
            message: 'Token expired'
          }
        }
      };
      
      mockClient.request = jest.fn().mockResolvedValue(mockValidation);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'validate-access-token',
          arguments: {
            access_token: 'expired_token'
          }
        }
      });

      expect(result?.content?.[0].text).toContain('❌ Valid: false');
      expect(result?.content?.[0].text).toContain('Token expired');
      expect(result?.content?.[0].text).toContain('Expired at:');
    });

    it('should handle validation request error', async () => {
      mockClient.request = jest.fn().mockRejectedValue(new Error('Network error'));

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'validate-access-token',
          arguments: {
            access_token: 'user_access_token_123'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error validating access token: Network error')
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle OAuth endpoint errors', async () => {
      const oauthError = new Error('OAuth authentication failed');
      oauthError.name = 'OAuthException';
      mockClient.request = jest.fn().mockRejectedValue(oauthError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'exchange-code-for-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            code: 'invalid_code',
            redirect_uri: 'https://example.com/callback'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('OAuth authentication failed')
      });
    });

    it('should handle rate limiting for OAuth endpoints', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitException';
      mockClient.request = jest.fn().mockRejectedValue(rateLimitError);

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'get-user-info',
          arguments: {
            access_token: 'user_access_token_123'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Rate limit exceeded')
      });
    });

    it('should handle missing required OAuth parameters', async () => {
      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'exchange-code-for-token',
          arguments: {
            app_id: '123456789',
            code: 'auth_code_123'
          }
        }
      });

      expect(result?.content?.[0]).toMatchObject({
        type: 'text',
        text: expect.stringContaining('Error')
      });
    });

    it('should handle malformed OAuth responses', async () => {
      mockClient.request = jest.fn().mockResolvedValue({
        invalid_response: true
      });

      const handler = server._requestHandlers.get('tools/call');
      const result = await handler?.({
        method: 'tools/call',
        params: {
          name: 'exchange-code-for-token',
          arguments: {
            app_id: '123456789',
            app_secret: 'app_secret_123',
            code: 'auth_code_123',
            redirect_uri: 'https://example.com/callback'
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