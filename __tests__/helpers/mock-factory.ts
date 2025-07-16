import { faker } from '@faker-js/faker';
import { 
  Campaign, 
  AdSet, 
  Ad, 
  AdCreative, 
  CustomAudience, 
  AdImage, 
  AdVideo,
  AdAccount,
  InsightsData
} from '../../src/types';

export class MockFactory {
  generateCampaign(overrides: Partial<Campaign> = {}): Campaign {
    return {
      id: faker.string.numeric(16),
      name: faker.company.catchPhrase(),
      status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'ARCHIVED']),
      objective: faker.helpers.arrayElement([
        'BRAND_AWARENESS', 'REACH', 'TRAFFIC', 'ENGAGEMENT', 
        'APP_INSTALLS', 'VIDEO_VIEWS', 'LEAD_GENERATION', 'CONVERSIONS'
      ]),
      daily_budget: faker.number.int({ min: 1000, max: 100000 }).toString(),
      lifetime_budget: faker.number.int({ min: 10000, max: 1000000 }).toString(),
      start_time: faker.date.recent().toISOString(),
      stop_time: faker.date.future().toISOString(),
      created_time: faker.date.past().toISOString(),
      updated_time: faker.date.recent().toISOString(),
      effective_status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'DELETED', 'PENDING_REVIEW']),
      ...overrides
    };
  }

  generateAdSet(overrides: Partial<AdSet> = {}): AdSet {
    return {
      id: faker.string.numeric(16),
      name: faker.commerce.productName(),
      campaign_id: faker.string.numeric(16),
      status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'ARCHIVED']),
      daily_budget: faker.number.int({ min: 100, max: 10000 }).toString(),
      lifetime_budget: faker.number.int({ min: 1000, max: 100000 }).toString(),
      start_time: faker.date.recent().toISOString(),
      end_time: faker.date.future().toISOString(),
      created_time: faker.date.past().toISOString(),
      updated_time: faker.date.recent().toISOString(),
      effective_status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'DELETED', 'PENDING_REVIEW']),
      optimization_goal: faker.helpers.arrayElement([
        'IMPRESSIONS', 'LINK_CLICKS', 'REACH', 'POST_ENGAGEMENT', 'VIDEO_VIEWS'
      ]),
      billing_event: faker.helpers.arrayElement(['IMPRESSIONS', 'LINK_CLICKS', 'VIDEO_VIEWS']),
      bid_amount: faker.number.int({ min: 10, max: 1000 }),
      targeting: {
        age_min: 18,
        age_max: 65,
        genders: [faker.helpers.arrayElement([1, 2])],
        geo_locations: {
          countries: [faker.location.countryCode()],
          cities: [{
            key: faker.string.numeric(7),
            name: faker.location.city()
          }]
        }
      },
      ...overrides
    };
  }

  generateAd(overrides: Partial<Ad> = {}): Ad {
    return {
      id: faker.string.numeric(16),
      name: faker.commerce.productAdjective() + ' Ad',
      adset_id: faker.string.numeric(16),
      campaign_id: faker.string.numeric(16),
      creative: {
        id: faker.string.numeric(16)
      },
      status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'ARCHIVED']),
      created_time: faker.date.past().toISOString(),
      updated_time: faker.date.recent().toISOString(),
      effective_status: faker.helpers.arrayElement(['ACTIVE', 'PAUSED', 'DELETED', 'PENDING_REVIEW']),
      ...overrides
    };
  }

  generateAdCreative(overrides: Partial<AdCreative> = {}): AdCreative {
    return {
      id: faker.string.numeric(16),
      name: faker.commerce.productName() + ' Creative',
      status: faker.helpers.arrayElement(['ACTIVE', 'DELETED']),
      body: faker.lorem.paragraph(),
      title: faker.commerce.productName(),
      link_url: faker.internet.url(),
      image_url: faker.image.url(),
      call_to_action_type: faker.helpers.arrayElement([
        'SHOP_NOW', 'LEARN_MORE', 'SIGN_UP', 'DOWNLOAD', 'CONTACT_US'
      ]),
      object_story_spec: {
        page_id: faker.string.numeric(16),
        link_data: {
          link: faker.internet.url(),
          message: faker.lorem.sentence(),
          name: faker.commerce.productName(),
          description: faker.lorem.paragraph()
        }
      },
      ...overrides
    };
  }

  generateCustomAudience(overrides: Partial<CustomAudience> = {}): CustomAudience {
    return {
      id: faker.string.numeric(16),
      name: faker.company.name() + ' Audience',
      subtype: faker.helpers.arrayElement(['CUSTOM', 'LOOKALIKE', 'ENGAGEMENT']),
      description: faker.lorem.sentence(),
      approximate_count_lower_bound: faker.number.int({ min: 1000, max: 10000 }),
      approximate_count_upper_bound: faker.number.int({ min: 10000, max: 100000 }),
      time_created: faker.date.past().toISOString(),
      time_updated: faker.date.recent().toISOString(),
      delivery_status: {
        status: faker.helpers.arrayElement(['200', '300', '400'])
      },
      operation_status: {
        status: faker.helpers.arrayElement(['200', '410', '411'])
      },
      ...overrides
    };
  }

  generateAdImage(overrides: Partial<AdImage> = {}): AdImage {
    return {
      id: faker.string.numeric(16),
      hash: faker.string.alphanumeric(32),
      url: faker.image.url(),
      url_128: faker.image.url(),
      height: faker.number.int({ min: 600, max: 1200 }),
      width: faker.number.int({ min: 600, max: 1200 }),
      name: faker.system.fileName(),
      created_time: faker.date.past().toISOString(),
      updated_time: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  generateAdVideo(overrides: Partial<AdVideo> = {}): AdVideo {
    return {
      id: faker.string.numeric(16),
      title: faker.commerce.productName() + ' Video',
      description: faker.lorem.paragraph(),
      embed_html: '<iframe src="' + faker.internet.url() + '"></iframe>',
      format: [
        {
          embed_html: '<iframe src="' + faker.internet.url() + '"></iframe>',
          height: faker.number.int({ min: 720, max: 1080 }),
          width: faker.number.int({ min: 1280, max: 1920 }),
          filter: 'NATIVE',
          picture: faker.image.url()
        }
      ],
      source: faker.internet.url(),
      picture: faker.image.url(),
      created_time: faker.date.past().toISOString(),
      updated_time: faker.date.recent().toISOString(),
      ...overrides
    };
  }

  generateInsights(overrides: Partial<InsightsData> = {}): InsightsData {
    const impressions = faker.number.int({ min: 1000, max: 1000000 });
    const clicks = faker.number.int({ min: 10, max: impressions / 100 });
    const spend = faker.number.float({ min: 10, max: 10000, precision: 0.01 });
    
    return {
      impressions: impressions.toString(),
      clicks: clicks.toString(),
      spend: spend.toString(),
      reach: faker.number.int({ min: impressions / 2, max: impressions }).toString(),
      frequency: faker.number.float({ min: 1, max: 5, precision: 0.01 }).toString(),
      ctr: (clicks / impressions * 100).toFixed(2),
      cpc: (spend / clicks).toFixed(2),
      cpm: (spend / impressions * 1000).toFixed(2),
      actions: [
        {
          action_type: 'link_click',
          value: clicks.toString()
        },
        {
          action_type: 'page_engagement',
          value: faker.number.int({ min: clicks, max: clicks * 2 }).toString()
        }
      ],
      date_start: faker.date.recent({ days: 7 }).toISOString().split('T')[0],
      date_stop: faker.date.recent({ days: 1 }).toISOString().split('T')[0],
      ...overrides
    };
  }

  generateAdAccount(overrides: Partial<AdAccount> = {}): AdAccount {
    return {
      id: 'act_' + faker.string.numeric(16),
      account_id: faker.string.numeric(16),
      name: faker.company.name(),
      account_status: faker.helpers.arrayElement([1, 2, 3, 7, 9, 100, 101]),
      age: faker.number.float({ min: 0, max: 365, precision: 0.01 }),
      created_time: faker.date.past().toISOString(),
      currency: faker.finance.currencyCode(),
      timezone_id: faker.number.int({ min: 1, max: 100 }),
      timezone_name: faker.location.timeZone(),
      timezone_offset_hours_utc: faker.number.int({ min: -12, max: 12 }),
      business: {
        id: faker.string.numeric(16),
        name: faker.company.name()
      },
      ...overrides
    };
  }

  generateBatchData<T>(generator: () => T, count: number = 10): T[] {
    return Array.from({ length: count }, () => generator());
  }

  generatePaginatedResponse<T>(data: T[], hasNext: boolean = false, hasPrevious: boolean = false) {
    return {
      data,
      paging: {
        cursors: {
          before: hasPrevious ? faker.string.alphanumeric(20) : undefined,
          after: hasNext ? faker.string.alphanumeric(20) : undefined
        },
        next: hasNext ? faker.internet.url() : undefined,
        previous: hasPrevious ? faker.internet.url() : undefined
      }
    };
  }

  generateErrorResponse(code: number = 400, message?: string) {
    const errorTypes = {
      400: 'OAuthException',
      401: 'AuthenticationException', 
      403: 'PermissionException',
      404: 'GraphMethodException',
      429: 'RateLimitException',
      500: 'ServerException'
    };

    return {
      error: {
        message: message || faker.lorem.sentence(),
        type: errorTypes[code] || 'UnknownException',
        code: code,
        error_subcode: faker.number.int({ min: 1000, max: 9999 }),
        fbtrace_id: faker.string.alphanumeric(16)
      }
    };
  }
}

export const mockFactory = new MockFactory();