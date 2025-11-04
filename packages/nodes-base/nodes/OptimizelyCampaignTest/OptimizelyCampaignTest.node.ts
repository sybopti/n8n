import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class OptimizelyCampaignTest implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Optimizely Campaign Test',
		name: 'optimizelyCampaignTest',
		icon: { light: 'file:mailchimp.svg', dark: 'file:mailchimp.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Mailchimp API',
		defaults: {
			name: 'Optimizely Campaign Test',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'OptimizelyCampaignApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
				],
				default: 'apiKey',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Campaign',
						value: 'campaign',
					},
					{
						name: 'List Group',
						value: 'listGroup',
					},
					{
						name: 'Member',
						value: 'member',
					},
					{
						name: 'Member Tag',
						value: 'memberTag',
					},
				],
				default: 'member',
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				displayOptions: {
					show: {
						resource: ['member'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new member on list',
						action: 'Create a member',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a member on list',
						action: 'Delete a member',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a member on list',
						action: 'Get a member',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many members on a list',
						action: 'Get many members',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a new member on list',
						action: 'Update a member',
					},
				],
				default: 'create',
			},
		],
	};

	methods = {
		loadOptions: {},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		return [returnData];
	}
}
