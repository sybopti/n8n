import {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';
import {
	getCampaignAttributes,
	getCampaignAttributesForTransactional,
	getOptInProcesses,
	getRecipientListIdAttributes,
	getRecipientLists,
	getTransactionalMailRecipientLists,
	getTransactionalMails,
	getTransactionalRecipientLists,
} from './methods';
import { router } from './actions/router';

export class OptimizelyCampaign implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Optimizely Campaign',
		name: 'optimizelyCampaign',
		subtitle: "={{$parameter['operation'] + ': ' + $parameter['resource']}}",
		icon: { light: 'file:Optimizely.svg', dark: 'file:Optimizely.svg' },
		group: ['transform'],
		version: 1,
		description: 'Optimizely Campaign',
		defaults: { name: 'Optimizely Campaign' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'OptimizelyCampaignApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options' as const,
				noDataExpression: true,
				options: [
					{ name: 'Recipient', value: 'recipient' },
					{ name: 'Transactional Mail', value: 'transactionalMail' },
				],
				default: 'recipient',
				required: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options' as const,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a recipient',
						action: 'Create a recipient',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a recipient',
						action: 'Update a recipient',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options' as const,
				noDataExpression: true,
				required: true,
				displayOptions: { show: { resource: ['transactionalMail'] } },
				options: [{ name: 'Send', value: 'send', action: 'Send a transactional mail' }],
				default: 'send',
			},
			//...recipientProperties,
			/* ------------------------------------------------------ */
			/*                      recipient                         */
			/* ------------------------------------------------------ */
			{
				displayName: 'Recipient List',
				name: 'recipientListId',
				type: 'options' as const,
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getRecipientLists',
				},
				default: '',
				description: 'Pick which recipient list to work on.',
			},
			{
				displayName: 'Recipient ID Field',
				name: 'recipientIdField',
				type: 'options' as const,
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
						operation: ['create', 'update'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getRecipientListIdAttributes',
					loadOptionsDependsOn: ['recipientListId'],
				},
				default: '',
				description:
					'Select the field that will be used as the unique recipient ID. This field will be used for matching.',
			},
			{
				displayName: 'Update Mode',
				name: 'recipientUpdateMode',
				type: 'options' as const,
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
						operation: ['update'],
					},
				},
				options: [
					{ name: 'Set (overwrite)', value: 'set', description: 'Overwrite existing value' },
					{ name: 'Prepend', value: 'prepend', description: 'Place before existing value' },
					{ name: 'Append', value: 'append', description: 'Place after existing value' },
				],
				default: 'set',
				description:
					"Mode for updating fields of type 'string': set (overwrite), prepend (before), append (after).",
			},
			{
				displayName: 'Update if Recipient Already Exists',
				name: 'updateIfExists',
				type: 'boolean' as const,
				default: false,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
						operation: ['create'],
					},
				},
				description:
					'If checked, an existing recipient will be updated. Otherwise, the operation will fail if the recipient exists.',
			},
			{
				displayName: 'Trigger Opt-In Process',
				name: 'triggerOptIn',
				type: 'boolean' as const,
				default: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
						operation: ['create'],
					},
				},
				description: 'If checked, an Opt-In process is triggered.',
			},
			{
				displayName: 'Opt-In Process',
				name: 'optInProcess',
				type: 'options' as const,
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
						operation: ['create'],
						triggerOptIn: [true],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getOptInProcesses',
					loadOptionsDependsOn: ['triggerOptIn'],
				},
				default: '',
				description: 'Select the Opt-In process to trigger.',
			},
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'resourceMapper' as const,
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['recipient'],
					},
				},
				description:
					'Map the incoming data to the recipient attributes. The Recipient ID Field selected above must be mapped here.',
				typeOptions: {
					loadOptionsDependsOn: ['recipientListId', 'recipientIdField'],
					resourceMapper: {
						resourceMapperMethod: 'getCampaignAttributes',
						mode: 'update',
						fieldWords: {
							singular: 'column',
							plural: 'columns',
						},
					},
				},
			},
			/* ------------------------------------------------------ */
			/*                 transactionalMail                      */
			/* ------------------------------------------------------ */
			//...transactionalMailProperties,
			{
				displayName: 'Transactional Mail',
				name: 'transactionalMailId',
				type: 'options' as const,
				required: true,
				noDataExpression: true,
				displayOptions: { show: { resource: ['transactionalMail'] } },
				typeOptions: {
					loadOptionsMethod: 'getTransactionalMails',
				},
				default: '',
				description: 'Pick which mailing should be sent out.',
			},
			{
				displayName: 'Recipient List',
				name: 'transactionalMailRecipientListId',
				type: 'options' as const,
				required: true,
				noDataExpression: true,
				displayOptions: { show: { resource: ['transactionalMail'] } },
				typeOptions: {
					loadOptionsMethod: 'getTransactionalMailRecipientLists',
					loadOptionsDependsOn: ['transactionalMailId'],
				},
				default: '',
				description: 'Choose the recipient list linked to this transactional mail.',
			},
			{
				displayName: 'Recipient ID Field',
				name: 'transactionalMailRecipientIdField',
				type: 'options' as const,
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['transactionalMail'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getRecipientListIdAttributes',
					loadOptionsDependsOn: ['transactionalMailRecipientListId'],
				},
				default: '',
				description:
					'Select the field that will be used as the unique recipient ID. This field will be used for matching.',
			},
			{
				displayName: 'Columns',
				name: 'txnColumns',
				type: 'resourceMapper' as const,
				default: { mappingMode: 'defineBelow', value: null },
				required: true,
				noDataExpression: true,
				displayOptions: { show: { resource: ['transactionalMail'] } },
				description:
					'Map incoming data to the recipient list attributes used by this transactional mail.',
				typeOptions: {
					loadOptionsDependsOn: [
						'transactionalMailRecipientListId',
						'transactionalMailRecipientIdField',
					],
					resourceMapper: {
						resourceMapperMethod: 'getCampaignAttributesForTransactional',
						mode: 'update',
						fieldWords: { singular: 'column', plural: 'columns' },
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			getRecipientLists,
			getTransactionalRecipientLists,
			getRecipientListIdAttributes,
			getOptInProcesses,
			getTransactionalMails,
			getTransactionalMailRecipientLists,
		},
		resourceMapping: {
			getCampaignAttributes: getCampaignAttributes,
			getCampaignAttributesForTransactional: getCampaignAttributesForTransactional,
		},
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
