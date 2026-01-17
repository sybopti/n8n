import type {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';
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
			// -------------------------------------------
			// MODE SWITCH
			// -------------------------------------------
			//{
			//	displayName: 'Trigger Mode',
			//	name: 'triggerMode',
			//	type: 'options',
			//	default: 'webhook',
			//	options: [
			//		{ name: 'Webhook', value: 'webhook' },
			//		{ name: 'Polling', value: 'polling' },
			//	],
			//	description: 'Select whether to use webhook or polling',
			//},
			//// -------------------------------------------
			//// POLLING OPTIONS
			//// -------------------------------------------
			//{
			//	displayName: 'Recipient List',
			//	name: 'recipientListId',
			//	type: 'options',
			//	displayOptions: { show: { triggerMode: ['polling'] } },
			//	typeOptions: { loadOptionsMethod: 'getRecipientLists' },
			//	required: true,
			//	default: '',
			//	description: 'Recipient list to monitor for new entries.',
			//},
			//{
			//	displayName: 'Polling Interval (Minutes)',
			//	name: 'pollInterval',
			//	type: 'number',
			//	displayOptions: { show: { triggerMode: ['polling'] } },
			//	typeOptions: { minValue: 1 },
			//	required: true,
			//	default: 5,
			//},
			// -------------------------------------------
			// WEBHOOK OPTIONS
			// -------------------------------------------

			{
				displayName: 'Webhook Event',
				name: 'events',
				type: 'options',
				//displayOptions: { show: { triggerMode: ['webhook'] } },
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
				const nodeData = this.getWorkflowStaticData('node') as IDataObject;
				//const webhookType = this.getNodeParameter('events') as string;
				const targetUrl = this.getNodeWebhookUrl('default');
				const webHook = nodeData.webhook as IGetWebhookApiResponse;
				const apiWebHooks = await webhookHelpers.getWebhooks.call(this);

				if (webHook) {
					let knownWebHook = apiWebHooks.find((hook) => hook.id === webHook.id);
					if (knownWebHook) {
						return true;
					} else {
						const relatedWebHooks = apiWebHooks.filter(
							(hook) =>
								webhookHelpers.getNodeIdFromWebHookUrl(hook.targetUrl) ==
								webhookHelpers.getNodeIdFromWebHookUrl(webHook.targetUrl),
						);
						if (relatedWebHooks) {
							nodeData._staleWebhooks = relatedWebHooks;
						}
						return false;
					}
				} else {
					const relatedWebHooks = apiWebHooks.filter(
						(hook) =>
							webhookHelpers.getNodeIdFromWebHookUrl(hook.targetUrl) ==
							webhookHelpers.getNodeIdFromWebHookUrl(targetUrl || ''),
					);
					if (relatedWebHooks) {
						nodeData._staleWebhooks = relatedWebHooks;
					}
					return false;
				}
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const nodeData = this.getWorkflowStaticData('node') as IDataObject;
				const webhookType = this.getNodeParameter('events') as IWebhookType;
				const targetUrl = this.getNodeWebhookUrl('default') || '';
				let webhook: IGetWebhookApiResponse | undefined;

				// Clean up stale data
				const stale = (nodeData._staleWebhooks as Array<IGetWebhookApiResponse> | undefined) ?? [];
				if (stale.length) {
					for (const hook of stale) {
						try {
							await webhookHelpers.deactivateWebhook.call(this, hook.id);
						} catch {}
						try {
							await webhookHelpers.deleteWebhook.call(this, hook.id);
						} catch {}
					}
					delete nodeData._staleWebhooks;
				}

				// Create Webhook
				try {
					const response = await webhookHelpers.createWebhook.call(this, webhookType, targetUrl);

					if (!response.id) {
						throw new Error(`Webhook creation failed: ${JSON.stringify(response)}`);
					}

					webhook = response;
				} catch (e) {
					throw new Error(String(e));
				}

				// Aktivwe Webhook
				try {
					await webhookHelpers.activateWebhook.call(this, webhook.id);
				} catch (_) {}

				// Safe webhook in nodeData
				nodeData.webhook = webhook;

				// Manual mode logic
				if (this.getMode && this.getMode() === 'manual') {
					const self = this;
					const webhookId = webhook.id;

					setTimeout(() => {
						(async () => {
							let smartCampaign: ICreateSmartCampaignsApiResponse | undefined;
							let testWebhookMailingId: number = 0;
							let isCustomTestMailing: boolean = false;

							try {
								// Fetch Campaign mailing for webhook test
								try {
									testWebhookMailingId = await webhookHelpers.getVerifyMailing.call(this);
								} catch (_) {}

								// If there is no Campaign mailing availbale, create SmartCampaign + Mailing
								if (testWebhookMailingId === 0) {
									try {
										smartCampaign = await webhookHelpers.createSmartCampaign.call(this);
									} catch (e) {
										return e;
									}

									try {
										const mailing = await webhookHelpers.createMailingForSmartCampaign.call(
											this,
											smartCampaign!.id,
										);
										testWebhookMailingId = mailing.mailingId;
									} catch (e) {
										return e;
									}

									if (testWebhookMailingId !== 0) {
										isCustomTestMailing = true;
									}
								}

								// Trigger webhook verification
								try {
									const verifyRes = await webhookHelpers.verifyWebhook.call(
										self,
										webhookId,
										testWebhookMailingId,
									);
									if (verifyRes.httpStatusCode !== 200) {
										throw new NodeApiError(this.getNode(), {
											message: `Verification failed: ${verifyRes}`,
										});
									}
								} catch (e) {
									return e;
								}

								// Delete test mailing if it is created just for this run.
								if (isCustomTestMailing) {
									try {
										await webhookHelpers.deleteSmartCampaign.call(this, smartCampaign!.id);
									} catch (e) {
										return e;
									}
								}

								// Clean up manual stuff
								const data = self.getWorkflowStaticData('node') as IDataObject;
								delete data.webhook;
							} catch (e) {
								throw new NodeApiError(this.getNode(), { message: 'Manuel node run failed' + e });
							}
						})();
					}, 1000); // Wait 1 second to ensure test event has been captured.
				}

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
		const req = this.getRequestObject();

		const webhookName = this.getWebhookName();
		if (webhookName === 'setup') {
			// Is a create webhook confirmation request
			const res = this.getResponseObject();
			res.status(200).end();
			return {
				noWebhookResponse: true,
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(req.body as IDataObject)],
		};
	}
}
