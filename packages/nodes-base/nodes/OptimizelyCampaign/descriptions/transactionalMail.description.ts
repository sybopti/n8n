import { INodeProperties } from 'n8n-workflow';

export const transactionalMailProperties: INodeProperties[] = [
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
				'transactionalMailRecipientIdField', // 👈 neu, wichtig
			],
			resourceMapper: {
				resourceMapperMethod: 'getCampaignAttributesForTransactional',
				mode: 'update',
				fieldWords: { singular: 'column', plural: 'columns' },
			},
		},
	},
];
