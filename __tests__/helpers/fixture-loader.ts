import fs from 'fs/promises';
import path from 'path';

export class FixtureLoader {
  private fixturesPath: string;

  constructor() {
    this.fixturesPath = path.join(__dirname, '..', 'fixtures');
  }

  async loadJson<T>(filename: string): Promise<T> {
    const filePath = path.join(this.fixturesPath, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  async loadCampaignFixtures() {
    return {
      campaigns: await this.loadJson('campaigns/campaigns-list.json'),
      singleCampaign: await this.loadJson('campaigns/single-campaign.json'),
      campaignInsights: await this.loadJson('campaigns/campaign-insights.json'),
      adSets: await this.loadJson('campaigns/adsets.json'),
      ads: await this.loadJson('campaigns/ads.json')
    };
  }

  async loadAnalyticsFixtures() {
    return {
      accountInsights: await this.loadJson('analytics/account-insights.json'),
      adInsights: await this.loadJson('analytics/ad-insights.json'),
      customReport: await this.loadJson('analytics/custom-report.json'),
      performanceByAge: await this.loadJson('analytics/performance-by-age.json'),
      performanceByGender: await this.loadJson('analytics/performance-by-gender.json')
    };
  }

  async loadAudienceFixtures() {
    return {
      audiences: await this.loadJson('audiences/custom-audiences.json'),
      singleAudience: await this.loadJson('audiences/single-audience.json'),
      lookalike: await this.loadJson('audiences/lookalike.json'),
      savedAudiences: await this.loadJson('audiences/saved-audiences.json')
    };
  }

  async loadCreativeFixtures() {
    return {
      adCreatives: await this.loadJson('creatives/ad-creatives.json'),
      singleCreative: await this.loadJson('creatives/single-creative.json'),
      images: await this.loadJson('creatives/images.json'),
      videos: await this.loadJson('creatives/videos.json'),
      carouselAd: await this.loadJson('creatives/carousel-ad.json')
    };
  }

  async loadOAuthFixtures() {
    return {
      accessToken: await this.loadJson('oauth/access-token.json'),
      refreshToken: await this.loadJson('oauth/refresh-token.json'),
      userInfo: await this.loadJson('oauth/user-info.json'),
      permissions: await this.loadJson('oauth/permissions.json')
    };
  }

  async loadErrorFixtures() {
    return {
      rateLimitError: await this.loadJson('errors/rate-limit.json'),
      authError: await this.loadJson('errors/auth-error.json'),
      validationError: await this.loadJson('errors/validation-error.json'),
      notFoundError: await this.loadJson('errors/not-found.json')
    };
  }
}

export const fixtureLoader = new FixtureLoader();