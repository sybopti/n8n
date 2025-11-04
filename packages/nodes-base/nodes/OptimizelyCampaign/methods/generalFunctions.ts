import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	NodeApiError,
} from 'n8n-workflow';
import { BASE_URL, CREDENTIALS_KEY } from '../helpers/constants';
import {
	ICreateSmartCampaignsApiResponse,
	IGetSmartCampaignsApiResponse,
	IGetSmartCampaignsMailingsApiResponse,
	IGetWebhookApiResponse,
	IVerifyWebhookApiResponse,
	IWebhookType,
} from '../helpers/types';

export const webhookHelpers = {
	/**
	 * Returns a MailingId if exisiting
	 */
	async getVerifyMailing(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	): Promise<number> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		let smartCampaign: IGetSmartCampaignsApiResponse | undefined = undefined;
		let mailingId: number = 0;

		try {
			const response = (await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'GET',
				baseURL: BASE_URL + clientId,
				url: '/smartcampaigns',
				qs: { sort: 'CREATED', direction: 'DESC', offset: 100, limit: 1 },
				headers: { accept: 'application/json' },
				json: true,
			})) as IGetSmartCampaignsApiResponse;

			if (response.elements.length <= 0) {
				throw new Error('Could not find a Smart Campaign' + JSON.stringify(response));
			}

			smartCampaign = response;
		} catch (e) {
			throw new Error(`Error fetching data: ${e}`);
		}

		try {
			const response = (await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'GET',
				baseURL: BASE_URL + clientId,
				url: `/smartcampaigns/${smartCampaign.elements[0].id}/messages`,
				headers: { accept: 'application/json' },
				json: true,
			})) as IGetSmartCampaignsMailingsApiResponse[];

			if (response.length <= 0) {
				throw new Error(
					`Could not find any mailing within Smart Campaign ${smartCampaign.elements[0].id}`,
				);
			}

			mailingId = response[0].mailingId;
		} catch (e) {
			throw new Error(`Error fetching data:  ${e}`);
		}

		return mailingId;
	},

	/**
	 * Create a new Smart Campaign
	 */
	async createSmartCampaign(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	): Promise<ICreateSmartCampaignsApiResponse> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };

		try {
			const response = (await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'POST',
				baseURL: BASE_URL + clientId,
				url: '/smartcampaigns',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				form: {
					name: 'n8n - DO NOT TOUCH',
				} as IDataObject,
				json: true,
			})) as ICreateSmartCampaignsApiResponse;

			return response;
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},

	/**
	 * Create a new mailing for Smart Campaign
	 */
	async createMailingForSmartCampaign(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
		smartCampaignId: number,
	): Promise<ICreateSmartCampaignsApiResponse> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		console.log(`/smartcampaigns/${smartCampaignId}/messages`);
		try {
			const response = (await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'POST',
				baseURL: BASE_URL + clientId,
				url: `/smartcampaigns/${smartCampaignId}/messages`,
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				form: {
					name: 'n8n - webhook verification mailing',
					mediaType: 'email',
				} as IDataObject,
				json: true,
			})) as ICreateSmartCampaignsApiResponse;

			return response;
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},

	/**
	 * Returns all registered webhooks
	 */
	async getWebhooks(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
		offset: number = 0,
		limit: number = 100,
	): Promise<Array<IGetWebhookApiResponse>> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		try {
			const response = (await this.helpers.httpRequestWithAuthentication.call(
				this,
				CREDENTIALS_KEY,
				{
					method: 'GET',
					baseURL: BASE_URL + clientId,
					url: '/webhooks',
					qs: { sort: 'CREATED', direction: 'DESC', offset, limit },
					headers: { accept: 'application/json' },
					json: true,
				},
			)) as IGetWebhookApiResponse[];

			return response;
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},

	/**
	 * Creates a webhook
	 */
	async createWebhook(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
		webhookType: IWebhookType,
		targetUrl: string,
	): Promise<IGetWebhookApiResponse> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		try {
			const response = (await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'POST',
				baseURL: BASE_URL + clientId,
				url: '/webhooks',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				form: {
					type: webhookType,
					format: 'json',
					targetUrl: targetUrl,
				} as IDataObject,
				json: true,
			})) as IGetWebhookApiResponse;

			return response;
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},

	/**
	 *
	 */
	async verifyWebhook(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
		webHookId: number,
		testWebhookMailingId: number,
	): Promise<IVerifyWebhookApiResponse> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		try {
			let response = (await this.helpers.httpRequestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'GET',
				baseURL: BASE_URL + clientId,
				url: `/webhooks/${webHookId}/verify`,
				qs: {
					mailingId: testWebhookMailingId,
					numberOfEvents: 1,
				},
				headers: { accept: 'application/json' },
				json: true,
			})) as IVerifyWebhookApiResponse;

			console.log('verifyWebhook:', response);
			return response;
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},

	async activateWebhook(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
		webHookId: number,
	): Promise<IGetWebhookApiResponse> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		try {
			let response = (await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'POST',
				baseURL: BASE_URL + clientId,
				url: `/webhooks/${webHookId}/activate`,
				json: true,
			})) as IGetWebhookApiResponse;

			return response;
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},

	async deactivateWebhook(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
		webHookId: number,
	): Promise<IGetWebhookApiResponse> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		try {
			let response = (await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'POST',
				baseURL: BASE_URL + clientId,
				url: `/webhooks/${webHookId}/deactivate`,
				json: true,
			})) as IGetWebhookApiResponse;

			return response;
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},

	async deleteWebhook(
		this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
		webHookId: number,
	): Promise<void> {
		const { client: clientId } = (await this.getCredentials(CREDENTIALS_KEY)) as { client: string };
		try {
			await this.helpers.requestWithAuthentication.call(this, CREDENTIALS_KEY, {
				method: 'DELETE',
				baseURL: BASE_URL + clientId,
				url: `/webhooks/${webHookId}`,
				json: true,
			});
		} catch (e) {
			throw new NodeApiError(this.getNode(), e);
		}
	},
};
