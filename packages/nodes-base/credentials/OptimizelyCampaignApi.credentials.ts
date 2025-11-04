import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class OptimizelyCampaignApi implements ICredentialType {
	name = 'OptimizelyCampaignApi';
	displayName = 'Optimizely Campaign';
	properties: INodeProperties[] = [
		{
			displayName: 'API-User',
			name: 'apiuser',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'apipassword',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
		},
		{
			displayName: 'Client',
			name: 'client',
			type: 'string',
			default: '',
		},
	];

	// Basic Auth per username / password
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{ $credentials.apiuser }}',
				password: '={{ $credentials.apipassword }}',
			},
		},
	};

	// Test-Request
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ `https://api.campaign.episerver.net/rest/${$credentials.client}` }}',
			url: '/users/authenticated',
		},
	};
}
