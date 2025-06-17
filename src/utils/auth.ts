import type { MetaApiConfig } from '../types/meta-api.js';

export class AuthManager {
  private config: MetaApiConfig;

  constructor(config: MetaApiConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.accessToken) {
      throw new Error('Meta access token is required. Set META_ACCESS_TOKEN environment variable.');
    }
    
    if (this.config.accessToken.length < 10) {
      throw new Error('Invalid Meta access token format.');
    }
  }

  getAccessToken(): string {
    return this.config.accessToken;
  }

  getApiVersion(): string {
    return this.config.apiVersion || 'v23.0';
  }

  getBaseUrl(): string {
    return this.config.baseUrl || 'https://graph.facebook.com';
  }

  getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.getAccessToken()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'meta-ads-mcp/1.0.0'
    };
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${this.getApiVersion()}/me?access_token=${this.getAccessToken()}`);
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  static fromEnvironment(): AuthManager {
    const config: MetaApiConfig = {
      accessToken: process.env.META_ACCESS_TOKEN || '',
      appId: process.env.META_APP_ID,
      appSecret: process.env.META_APP_SECRET,
      businessId: process.env.META_BUSINESS_ID,
      apiVersion: process.env.META_API_VERSION,
      baseUrl: process.env.META_BASE_URL
    };

    return new AuthManager(config);
  }

  async refreshTokenIfNeeded(): Promise<string> {
    const isValid = await this.validateToken();
    if (!isValid) {
      throw new Error('Access token is invalid or expired. Please generate a new token.');
    }
    return this.config.accessToken;
  }

  getAccountId(accountIdOrNumber: string): string {
    if (accountIdOrNumber.startsWith('act_')) {
      return accountIdOrNumber;
    }
    return `act_${accountIdOrNumber}`;
  }

  extractAccountNumber(accountId: string): string {
    if (accountId.startsWith('act_')) {
      return accountId.substring(4);
    }
    return accountId;
  }
}