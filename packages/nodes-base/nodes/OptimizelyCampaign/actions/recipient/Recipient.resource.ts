import { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { BASE_URL } from './../../helpers/constants';
//declare const console: any;

export const create = {
	async execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
		const updateIfExists = this.getNodeParameter('updateIfExists', i, false) as boolean;
		const credentials = await this.getCredentials('OptimizelyCampaignApi');
		const clientId = credentials.client as string;
		const recipientListId = this.getNodeParameter('recipientListId', i) as string;
		const recipientIdField = this.getNodeParameter('recipientIdField', i) as string;
		const triggerOptIn = this.getNodeParameter('triggerOptIn', i, false) as boolean;
		const optInProcessId = triggerOptIn
			? (this.getNodeParameter('optInProcess', i, '') as string)
			: undefined;
		const columnsData = this.getNodeParameter('columns', i) as IDataObject;
		const mappedData = columnsData.value as IDataObject;
		const recipientIdValue = mappedData[recipientIdField];

		if (!recipientIdValue) {
			throw new Error(`The Recipient ID field '${recipientIdField}' was not found or is empty.`);
		}

		const formData: IDataObject = {};
		for (const key in mappedData) {
			if (key !== recipientIdField) {
				formData[`data.${key}`] = mappedData[key];
			}
		}
		formData.recipientId = recipientIdValue;
		formData.recipientListId = recipientListId;

		if (optInProcessId != undefined) formData.optinProcessId = optInProcessId;

		try {
			const requestUrl = `${BASE_URL}${clientId}/recipients/${recipientListId}`;
			const options = {
				method: 'POST' as const,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				uri: requestUrl,
				form: formData,
				json: true,
			};

			const createResponse = await this.helpers.requestWithAuthentication.call(
				this,
				'OptimizelyCampaignApi',
				options,
			);

			return {
				success: true,
				operation: 'create',
				data: createResponse,
			};
		} catch (error) {
			const err = error as IDataObject;
			const fullErrorMessage = `${err.message} ${err.description}`.toLowerCase();

			if (
				updateIfExists &&
				err.name === 'NodeApiError' &&
				fullErrorMessage.includes('already exists')
			) {
				const updateUri = `${BASE_URL}${clientId}/recipients/${recipientListId}/${recipientIdValue}`;
				const options = {
					method: 'POST' as const,
					uri: updateUri,
					form: formData,
					json: true,
				};

				const updateResponse = await this.helpers.requestWithAuthentication.call(
					this,
					'OptimizelyCampaignApi',
					options,
				);

				return {
					success: true,
					operation: 'update',
					data: updateResponse,
				};
			}

			throw error;
		}
	},
};

export const update = {
	async execute(this: IExecuteFunctions, i: number) {
		const credentials = await this.getCredentials('OptimizelyCampaignApi');
		const clientId = credentials.client as string;
		const recipientListId = this.getNodeParameter('recipientListId', i) as string;
		const recipientIdField = this.getNodeParameter('recipientIdField', i) as string;
		const recipientUpdateMode = this.getNodeParameter('recipientUpdateMode', i) as string;
		const columnsData = this.getNodeParameter('columns', i) as IDataObject;
		const mappedData = columnsData.value as IDataObject;
		const recipientIdValue = mappedData[recipientIdField];

		if (!recipientIdValue) {
			throw new Error(`The Recipient ID field '${recipientIdField}' was not found or is empty.`);
		}

		const formData: IDataObject = {};
		for (const key in mappedData) {
			if (key !== recipientIdField) {
				formData[`data.${key}`] = mappedData[key];
			}
		}
		formData.recipientId = recipientIdValue;
		formData.recipientListId = recipientListId;
		formData.mode = recipientUpdateMode;

		try {
			const requestUrl = `${BASE_URL}${clientId}/recipients/${recipientListId}/${recipientIdValue}`;
			const options = {
				method: 'POST' as const,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				uri: requestUrl,
				form: formData,
				json: true,
			};

			const updateResponse = await this.helpers.requestWithAuthentication.call(
				this,
				'OptimizelyCampaignApi',
				options,
			);

			return {
				success: true,
				operation: 'update',
				data: updateResponse,
			};
		} catch (error) {
			throw error;
		}
	},
};
