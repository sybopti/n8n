import { INodeProperties } from 'n8n-workflow';

export const recipientProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'recipientOperation',
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
		displayName: 'Recipient List',
		name: 'recipientListId',
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
			'Mode for updating fields of type "string": set (overwrite), prepend (before), append (after).',
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
];
