import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { BASE_URL } from './../../helpers/constants';

export const send = {
	async execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
		const credentials = await this.getCredentials('OptimizelyCampaignApi');
		const clientId = credentials.client as string;

		const transactionalMailId = this.getNodeParameter('transactionalMailId', i) as string;
		const recipientListId = this.getNodeParameter('transactionalMailRecipientListId', i) as string;
		const recipientIdField = this.getNodeParameter(
			'transactionalMailRecipientIdField',
			i,
		) as string;

		const columnsData = this.getNodeParameter('txnColumns', i) as IDataObject;
		const mappedData = (columnsData?.value || {}) as IDataObject;

		const recipientIdValue = mappedData[recipientIdField];
		if (!recipientIdValue) {
			throw new Error(
				`The Recipient ID field '${recipientIdField}' was not found in the mapped data or is empty.`,
			);
		}

		const formData: IDataObject = {
			recipientListId,
			recipientId: recipientIdValue,
		};

		for (const key of Object.keys(mappedData)) {
			if (key === recipientIdField) continue;
			formData[`data.${key}`] = mappedData[key];
		}

		const sendUri = `${BASE_URL}${clientId}/transactionalmail/${transactionalMailId}/send`;

		const options = {
			method: 'POST' as const,
			uri: sendUri,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded', accept: 'application/json' },
			form: formData,
			json: true,
		};

		try {
			const response = await this.helpers.requestWithAuthentication.call(
				this,
				'OptimizelyCampaignApi',
				options,
			);

			return {
				success: true,
				operation: 'send',
				data: response,
			};
		} catch (err) {
			if (this.continueOnFail()) {
				return {
					success: false,
					operation: 'send',
					warning: 'Non-JSON or error response received while sending transactional mail.',
				};
			}
			throw err;
		}
	},
};
