import { ILoadOptionsFunctions, ResourceMapperFields } from 'n8n-workflow';
import { isCampaignSystemField, mapApiTypeToN8nType } from '../helpers/utils';
import { BASE_URL } from './../helpers/constants';
import { RecipientListField, RecipientListFieldApiResponse } from '../helpers/types';

async function loadRecipientListFieldsPaged(
	this: ILoadOptionsFunctions,
	clientId: string,
	recipientListId: string,
): Promise<RecipientListField[]> {
	const out: RecipientListField[] = [];
	let nextUrl: string | undefined =
		`${BASE_URL}${encodeURIComponent(clientId)}/recipientlists/${recipientListId}/fields?limit=100`;

	while (nextUrl) {
		try {
			const res = (await this.helpers.requestWithAuthentication.call(
				this,
				'OptimizelyCampaignApi',
				{ method: 'GET' as const, uri: nextUrl, json: true },
			)) as RecipientListFieldApiResponse;

			out.push(...(res.elements ?? []));
			const nextLink = (res.links ?? []).find((l) => l.rel === 'next');
			nextUrl = nextLink?.href;
		} catch {
			// falls API Non-JSON oder Fehler liefert: abbrechen, zurückgeben was da ist
			break;
		}
	}

	return out;
}

async function buildMapperFields(
	this: ILoadOptionsFunctions,
	listIdParamName: 'recipientListId' | 'transactionalMailRecipientListId',
	idFieldParamName?: 'recipientIdField' | 'transactionalMailRecipientIdField',
): Promise<ResourceMapperFields> {
	const recipientListId = this.getNodeParameter(listIdParamName, 0) as string;
	if (!recipientListId) return { fields: [] };

	let recipientIdField: string | undefined;
	if (idFieldParamName) {
		recipientIdField = this.getNodeParameter(idFieldParamName, 0) as string;
	}

	try {
		const credentials = await this.getCredentials('OptimizelyCampaignApi');
		const clientId = credentials.client as string;

		const fields: RecipientListField[] = await loadRecipientListFieldsPaged.call(
			this,
			clientId,
			recipientListId,
		);

		const attributes = fields
			.filter((f) => !isCampaignSystemField(f.internalName))
			.map((f): ResourceMapperFields['fields'][number] => ({
				id: f.internalName,
				displayName: f.displayName,
				required: f.required,
				defaultMatch: recipientIdField ? f.internalName === recipientIdField : false,
				display: true,
				type: mapApiTypeToN8nType(f.type.toString()),
			}));

		return { fields: attributes };
	} catch {
		return { fields: [] };
	}
}

export const resourceMapping = {
	async getCampaignAttributes(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
		return buildMapperFields.call(this, 'recipientListId', 'recipientIdField');
	},

	async getCampaignAttributesForTransactional(
		this: ILoadOptionsFunctions,
	): Promise<ResourceMapperFields> {
		return buildMapperFields.call(
			this,
			'transactionalMailRecipientListId',
			'transactionalMailRecipientIdField',
		);
	},
};

//export const resourceMapping = {
//	async getCampaignAttributes(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
//		const recipientListId = this.getNodeParameter('recipientListId', 0);
//		const recipientIdField = this.getNodeParameter('recipientIdField', 0);

//		if (!recipientListId) {
//			return { fields: [] };
//		}

//		const credentials = await this.getCredentials('OptimizelyCampaignApi');
//		const clientId = credentials.client as string;
//		const uri = `${BASE_URL}${clientId}/recipientlists/${recipientListId}/fields`;
//		const options = {
//			method: 'GET' as const,
//			uri,
//			json: true,
//		};

//		try {
//			const response = await this.helpers.requestWithAuthentication.call(
//				this,
//				'OptimizelyCampaignApi',
//				options,
//			) as RecipientListFieldApiResponse;

//			if (!response || !response.elements) {
//				return { fields: [] };
//			}

//			const attributes = response.elements
//				.filter((field: RecipientListField) => (!isCampaignSystemField(field.internalName)))
//				.map((field: RecipientListField) => {
//					return {
//						id: field.internalName,
//						displayName: field.displayName,
//						required: field.required,
//						defaultMatch: field.internalName === recipientIdField,
//						display: true,
//						type: mapApiTypeToN8nType(field.type.toString()),
//					};
//				});

//			return {
//				fields: attributes,
//			};
//		} catch (error) {
//			return { fields: [] };
//		}
//	}
//};
