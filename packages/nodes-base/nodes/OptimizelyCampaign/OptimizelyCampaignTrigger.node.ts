import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import {
	ICreateSmartCampaignsApiResponse,
	IGetWebhookApiResponse,
	IWebhookType,
} from './helpers/types';
import { webhookHelpers } from './methods/generalFunctions';

export class OptimizelyCampaignTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Optimizely Campaign Trigger',
		name: 'optimizelyCampaignTrigger',
		icon: { light: 'file:Optimizely.svg', dark: 'file:Optimizely.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Handle Mailchimp events via webhooks',
		defaults: {
			name: 'Optimizely Campaign Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'OptimizelyCampaignApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'optimizely',
			},
		],

		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'options',
				required: true,
				default: [],
				description: 'The events that can trigger the webhook and whether they are enabled',
				options: [
					{
						name: 'Open',
						value: 'open',
						description: 'Triggered when a recipient opens a campaign email.',
					},
					{
						name: 'Click',
						value: 'click',
						description: 'Triggered when a recipient clicks a link inside the email.',
					},
					{
						name: 'Sent',
						value: 'sent',
						description: 'Triggered when an email has been successfully sent.',
					},
					{
						name: 'Bounce',
						value: 'bounce',
						description: 'Triggered when an email cannot be delivered (soft or hard bounce).',
					},
					{
						name: 'Unsubscribe',
						value: 'unsubscribe',
						description: 'Triggered when a recipient unsubscribes from the mailing list.',
					},
					{
						name: 'Spamcomplaint',
						value: 'spamcomplaint',
						description: 'Triggered when a recipient marks the email as spam.',
					},
					{
						name: 'Singleoptin',
						value: 'singleoptin',
						description: 'Triggered when a recipient signs up using single opt-in.',
					},
					{
						name: 'Confirmedoptin',
						value: 'confirmedoptin',
						description:
							'Triggered when a recipient confirms their subscription (confirmed opt-in).',
					},
					{
						name: 'Doubleoptin',
						value: 'doubleoptin',
						description:
							'Triggered when a recipient completes a double opt-in subscription process.',
					},
					{
						name: 'Blocklist',
						value: 'blocklist',
						description: 'Triggered when an address is added to the blocklist.',
					},
					{
						name: 'Archive',
						value: 'archive',
						description: 'Triggered when a recipient record is archived.',
					},
					{
						name: 'Filtered by blocklist',
						value: 'filteredbyblocklist',
						description:
							'Triggered when an email is suppressed because the address is on the blocklist.',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				console.log('CHECK_EXISTING');
				const nodeData = this.getWorkflowStaticData('node') as IDataObject;
				const webhookType = this.getNodeParameter('events') as string;
				const targetUrl = this.getNodeWebhookUrl('default');

				console.log('nodeData', nodeData);
				console.log('desiredType', webhookType);
				console.log('desiredUrl', targetUrl);

				const webHook = nodeData.webhook as IGetWebhookApiResponse;
				const apiWebHooks = await webhookHelpers.getWebhooks.call(this);

				if (webHook) {
					let knownWebHook = apiWebHooks.find((hook) => hook.id === webHook.id);
					if (knownWebHook) {
						return true;
					} else {
						console.log('DEBUG: The NodeData webhook does not match up with the API one', {
							NodeData: webHook,
							ApiData: apiWebHooks,
						});
						const relatedWebHooks = apiWebHooks.filter(
							(hook) =>
								webhookHelpers.getNodeIdFromWebHookUrl(hook.targetUrl) ==
								webhookHelpers.getNodeIdFromWebHookUrl(webHook.targetUrl),
						);
						if (relatedWebHooks) {
							console.log('DEBUG: Add the known webhook to stale for deletion', relatedWebHooks);
							nodeData._staleWebhooks = relatedWebHooks;
						}
						return false;
					}
				} else {
					console.log('DEBUG: No WebHook stored in NodeData!');
					const relatedWebHooks = apiWebHooks.filter(
						(hook) =>
							webhookHelpers.getNodeIdFromWebHookUrl(hook.targetUrl) ==
							webhookHelpers.getNodeIdFromWebHookUrl(targetUrl || ''),
					);
					if (relatedWebHooks) {
						console.log(
							'DEBUG: Found a webhook with a related NodeId. Marked for deletion!',
							relatedWebHooks,
						);
						nodeData._staleWebhooks = relatedWebHooks;
					}
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				console.log('CREATE');
				const nodeData = this.getWorkflowStaticData('node') as IDataObject;
				const webhookType = this.getNodeParameter('events') as IWebhookType;
				const targetUrl = this.getNodeWebhookUrl('default') || '';
				let webhook: IGetWebhookApiResponse | undefined;
				let testWebhookMailingId: number = 0;

				console.log('nodeData', nodeData);
				console.log('desiredType', webhookType);
				console.log('desiredUrl', targetUrl);
				console.log('STALE:', nodeData._staleWebhooks);

				////////////////////////////

				const stale = (nodeData._staleWebhooks as Array<IGetWebhookApiResponse> | undefined) ?? [];
				if (stale.length) {
					for (const hook of stale) {
						try {
							await webhookHelpers.deactivateWebhook.call(this, hook.id);
						} catch {}
						try {
							await webhookHelpers.deleteWebhook.call(this, hook.id);
						} catch {}

						console.log('create()', {
							Message: 'Deleting stales',
							Data: {
								webhookId: hook,
							},
						});
					}
					delete nodeData._staleWebhooks;
				}

				////////////////////////////

				console.log('MODE::::::', this.getMode());

				//// Create a Webhook
				//try {
				//	const response = await webhookHelpers.createWebhook.call(this, webhookType, targetUrl);

				//	// Check if response contains a id
				//	if (!response.id) {
				//		throw new Error(`Webhook creation failed: ${JSON.stringify(response)}`);
				//	}

				//	webhook = response;
				//} catch (e) {
				//	throw new Error(e);
				//}

				//if (this.getMode && this.getMode() === 'manual') {
				//	// Try to get a Mailing to validate the webhook
				//	//try {
				//	//	testWebhookMailingId = await webhookHelpers.getVerifyMailing.call(this);
				//	//} catch (e) {
				//	//	throw new Error(e);
				//	//}

				//	if (testWebhookMailingId == 0) {
				//		let smartCampaignId: ICreateSmartCampaignsApiResponse | undefined = undefined;

				//		// Create a new Smart Campaign
				//		try {
				//			const response = await webhookHelpers.createSmartCampaign.call(this);
				//			smartCampaignId = response;
				//		} catch (e) {
				//			throw new Error(e);
				//		}

				//		// Create a new Smart Campaign mailing
				//		try {
				//			const response = await webhookHelpers.createMailingForSmartCampaign.call(
				//				this,
				//				smartCampaignId!.id,
				//			);
				//			testWebhookMailingId = response.id;
				//		} catch (e) {
				//			throw new Error(e);
				//		}
				//	}

				//	// Verify Webhook
				//	try {
				//		console.log("create()", {
				//			"Message": "Verify Webhook",
				//			"Data": {
				//				webhook: webhook
				//			}
				//		});
				//		let response = await webhookHelpers.verifyWebhook.call(
				//			this,
				//			webhook!.id,
				//			testWebhookMailingId,
				//		);
				//		if (response.httpStatusCode !== 200) {
				//			throw new Error('Statuscode not 200');
				//		}

				//		console.log('DELETE THAT SHIT:', {
				//			'this.getNode(): ': this.getMode(),
				//			'this.getMode': this.getMode,
				//		});
				//		try {
				//			await webhookHelpers.deleteWebhook.call(this, webhook!.id);
				//			return true;
				//		} catch { }

				//	} catch (e) {
				//		throw new Error(e);
				//	}
				//}

				try {
					// Create a Webhook
					try {
						const response = await webhookHelpers.createWebhook.call(this, webhookType, targetUrl);

						// Check if response contains an id
						if (!response.id) {
							throw new Error(`Webhook creation failed: ${JSON.stringify(response)}`);
						}

						webhook = response;
					} catch (e) {
						throw new Error(e);
					}

					// Try to get a Mailing to validate the webhook
					try {
						testWebhookMailingId = await webhookHelpers.getVerifyMailing.call(this);
					} catch (e) {
						throw new Error(e);
					}

					if (testWebhookMailingId == 0) {
						let smartCampaignId: ICreateSmartCampaignsApiResponse | undefined = undefined;

						// Create a new Smart Campaign
						try {
							const response = await webhookHelpers.createSmartCampaign.call(this);
							smartCampaignId = response;
						} catch (e) {
							throw new Error(e);
						}

						// Create a new Smart Campaign mailing
						try {
							const response = await webhookHelpers.createMailingForSmartCampaign.call(
								this,
								smartCampaignId!.id,
							);
							testWebhookMailingId = response.id;
						} catch (e) {
							throw new Error(e);
						}
					}

					// Verify Webhook
					try {
						console.log('create()', {
							Message: 'Verify Webhook',
							Data: {
								webhook: webhook,
							},
						});
						let response = await webhookHelpers.verifyWebhook.call(
							this,
							webhook!.id,
							testWebhookMailingId,
						);
						if (response.httpStatusCode !== 200) {
							throw new Error('Statuscode not 200');
						}
						console.log('NODE-STATE:', {
							'this.getNode(): ': this.getMode(),
							'this.getMode': this.getMode,
						});
						if (this.getMode && this.getMode() === 'manual') {
							console.log('DELETE THAT SHIT:', {
								'this.getNode(): ': this.getMode(),
								'this.getMode': this.getMode,
							});
							try {
								await webhookHelpers.deleteWebhook.call(this, webhook!.id);
								return true;
							} catch {}
						}
					} catch (e) {
						throw new Error(e);
					}
				} catch (_) {}

				try {
					await webhookHelpers.activateWebhook.call(this, webhook!.id);
				} catch (_) {}

				console.log('webhook', webhook);
				nodeData.webhook = webhook;
				console.log('webhook in node', nodeData.webhook);
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				console.log('DELETE()');
				const nodeData = this.getWorkflowStaticData('node') as IDataObject;
				const webhook = nodeData.webhook as IGetWebhookApiResponse | undefined;
				if (!webhook) return true;

				const credentials = await this.getCredentials('OptimizelyCampaignApi');
				const clientId = credentials.client as string;
				const baseURL = `https://api.campaign.episerver.net/rest/${clientId}`;
				console.log('delete', { webhookId: webhook });
				try {
					await this.helpers.requestWithAuthentication.call(this, 'OptimizelyCampaignApi', {
						method: 'POST',
						baseURL,
						url: `/webhooks/${webhook.id}/deactivate`,
						json: true,
					});
				} catch {}

				try {
					await this.helpers.requestWithAuthentication.call(this, 'OptimizelyCampaignApi', {
						method: 'DELETE',
						baseURL,
						url: `/webhooks/${webhook.id}`,
						json: true,
					});
				} catch (err: any) {
					const code = String(err?.statusCode ?? err?.code ?? '');
					if (!code.startsWith('404')) throw err;
				}

				delete nodeData.webhook;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();

		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
