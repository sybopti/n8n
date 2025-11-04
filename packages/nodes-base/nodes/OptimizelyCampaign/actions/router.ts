import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import * as recipient from './recipient/Recipient.resource';
import * as transactionalMail from './transactionalMail/TransactionalMail.resource';

// Ein Handler exportiert z. B. { create: { execute }, update: { execute } }
type OperationHandler = {
	execute: (this: IExecuteFunctions, itemIndex: number) => Promise<IDataObject | IDataObject[]>;
};
type ResourceModule = Record<string, OperationHandler>;

const resources: Record<string, ResourceModule> = {
	recipient,
	transactionalMail,
};

const OP_PARAM = 'operation'; // <- nur noch ein globaler Parameter

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: IDataObject[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const resource = this.getNodeParameter('resource', i) as keyof typeof resources;
			const operation = this.getNodeParameter(OP_PARAM, i) as string;

			const resourceModule = resources[resource];
			if (!resourceModule) {
				throw new Error(`Unknown resource '${String(resource)}'.`);
			}

			const opHandler = resourceModule[operation];
			if (!opHandler?.execute) {
				// hilfreiche Fehlermeldung mit bekannten Ops dieser Resource
				const available = Object.keys(resourceModule).sort().join(', ') || '—';
				throw new Error(
					`Unknown operation '${operation}' for resource '${String(resource)}'. Available: ${available}`,
				);
			}

			const result = await opHandler.execute.call(this, i);
			returnData.push(...(Array.isArray(result) ? result : [result]));
		} catch (error: any) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: error.message, ...(items[i]?.json ?? {}) },
				});
				continue;
			}
			throw error;
		}
	}

	return [this.helpers.returnJsonArray(returnData)];
}
