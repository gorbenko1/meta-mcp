import fetch from 'node-fetch';
import moment from 'moment';
import queryString from 'qs';

import { AuthManager } from './utils/auth.js';
import { globalRateLimiter } from './utils/rate-limiter.js';
import {
	MetaApiErrorHandler,
	retryWithBackoff,
} from './utils/error-handler.js';

interface Response {
	data: Array<{
		day: string;
		team: {
			id: string;
			name: string;
			displayName: string;
		},
		user: {
			id: string;
			name: string;
			email: string;
		},
		adset: {
			id: string;
			name: string;
			status: string;
			startTime: string;
			budgetType: string;
			budget: number;
		},
		partner: {
			id: string;
			name: string;
			displayName: string;
			status: string;
		},
		account: {
			id: string;
			name: string;
			commission: number;
		},
		campaign: {
			id: string;
			name: string;
			status: string;
			startTime: string;
			budget_optimization: string;
			budgetType: string;
			budget: number;
		},
		ad: {
			id: string;
			name: string;
			status: string;
		},
		budget: {
			type: string;
			value: number;
		},
		meta: {
			impressions: string;
			clicks: string;
			reach: string;
			videoViews3s: string;
			ctr: number;
			spendUsd: number;
			spendUsdWithCommission: number;
		},
		event: {
			uniqueVisitClicks: number;
			visit: number;
			remarketingVisit: number;
			visitNext: number;
			click: number;
			remarketingClick: number;
			conversions: number;
			additional: number;
			sales: number;
			registrations: number;
			rsales: number;
			revenue: number;
			dsales: number;
		},
		metrics: {
			videoViews3sPerImpression: number;
			cpm: number;
			cpc: number;
			epc: number;
			clickLose: number;
			ctrLP1: number;
			ctrLP2: number;
			ctrLinkLP1: number;
			ctrRe: number;
			cr: number;
			crDSaleReg: number;
			crDSaleFBClick: number;
			crDSaleVisits: number;
			crt: number;
			profit: number;
			roi: number;
			cpr: number;
			cps: number;
			rps: number;
			revenuePerRegistration: number;
		},
		rn: string;
	}>
	summary: {
		meta: {
			impressions: string;
			clicks: string;
			reach: string;
			videoViews3s: string;
			ctr: number;
			spendUsd: number;
			spendUsdWithCommission: number;
		},
		event: {
			uniqueVisitClicks: number;
			visit: number;
			remarketingVisit: number;
			visitNext: number;
			click: number;
			remarketingClick: number;
			conversions: number;
			additional: number;
			sales: number;
			registrations: number;
			rsales: number;
			revenue: number;
			dsales: number;
		},
		metrics: {
			videoViews3sPerImpression: number;
			cpm: number;
			cpc: number;
			epc: number;
			clickLose: number;
			ctrLP1: number;
			ctrLP2: number;
			ctrLinkLP1: number;
			ctrRe: number;
			cr: number;
			crDSaleReg: number;
			crDSaleFBClick: number;
			crDSaleVisits: number;
			crt: number;
			profit: number;
			roi: number;
			cpr: number;
			cps: number;
			rps: number;
			revenuePerRegistration: number;
		},
	},
	total: number;
}

export class AnalyticsClient {
	private auth: AuthManager;

	constructor(auth?: AuthManager) {
		this.auth = auth || AuthManager.fromEnvironment();
	}

	get authManager(): AuthManager {
		return this.auth;
	}

	private async makeRequest<T>(
		endpoint: string,
		method: 'GET' | 'POST' | 'DELETE' | 'HEAD' = 'GET',
		body?: any,
		accountId?: string,
		isWriteCall: boolean = false,
	): Promise<T> {
		const url = `${this.auth.getAnalyticsUrl()}/${endpoint}`;

		// Check rate limit if we have an account ID
		if (accountId) {
			await globalRateLimiter.checkRateLimit(accountId, isWriteCall);
		}

		await this.auth.autorizeAnalytics();
		const cookie = this.auth.getAnalyticsCookie();

		return retryWithBackoff(async () => {
			const headers = {
				'Content-Type': 'application/json',
				'Cookie': cookie,
			};

			const requestOptions: any = {
				method,
				headers,
			};

			if (body && method !== 'GET') {
				if (typeof body === 'string') {
					requestOptions.body = body;
					headers['Content-Type'] = 'application/x-www-form-urlencoded';
				} else {
					requestOptions.body = JSON.stringify(body);
					headers['Content-Type'] = 'application/json';
				}
			}

			console.log("Url: ", url);
			console.log("RequestOptions: ", requestOptions);

			const response = await fetch(url, requestOptions);
			return MetaApiErrorHandler.handleResponse(response as any);
		}, `${method} ${endpoint}`);
	}

	// Insights Methods
	async getStats(
		objectId: string,
		params: {
			level: 'account' | 'campaign' | 'adset' | 'ad';
			time_range?: { since: string; until: string };
			fields?: string[];
			breakdowns?: string[];
			limit?: number;
			after?: string;
		} = {} as any,
	): Promise<Response['data']> {
		const queryParams: Record<string, any> = {
			groupBy: ['Time', 'Team', 'User', 'Adset', 'Account', 'Campaign', 'Ad'],
			timezone_value: 0,
			time: [
				{
					matchMode: 'in_range',
					value: [moment().startOf('day').format(), moment().endOf('day').format()],
				},
			],
		};

		if (params.level == 'account') {
			queryParams.account_id = [{
				matchMode: 'equals',
				operator: 'and',
				value: objectId.replace(/[a-z]|\s/g, ''),
			}];
		} else if (params.level == 'campaign') {
			queryParams.campaign_id = [{
				matchMode: 'equals',
				operator: 'and',
				value: objectId.replace(/[a-z]|\s/g, ''),
			}];
		} else if (params.level == 'adset') {
			queryParams.adset_id = [{
				matchMode: 'equals',
				operator: 'and',
				value: objectId.replace(/[a-z]|\s/g, ''),
			}];
		} else if (params.level == 'ad') {
			queryParams.ad_id = [{
				matchMode: 'equals',
				operator: 'and',
				value: objectId.replace(/[a-z]|\s/g, ''),
			}];
		}

		if (params.time_range) {
			queryParams.time = [
				{
					matchMode: 'in_range',
					value: [params.time_range.since, params.time_range.until],
				},
			];
		}

		const query = queryString.stringify(queryParams);
		const response = await this.makeRequest<Response>(
			`stats?${query}`,
		);

		return response.data;
	}
}
