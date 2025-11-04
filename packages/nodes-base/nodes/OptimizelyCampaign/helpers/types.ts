// RecipientLists
export enum IRecipientListFieldType {
	STRING,
	TEXT,
	DATE,
	BOOLEAN,
	INTEGER,
	DECIMAL,
	LONG,
}

export interface IRecipientListApiResponse {
	limit: number;
	elements: IRecipientList[];
	count: number;
	links: IApiLink[];
}

export interface IRecipientList {
	id: number;
	name: string;
	recipients: number;
	mediaTypes: string[];
	testList: boolean;
	forTransactionApi: boolean;
	created: string;
	modified: string;
	links: IApiLink[];
}

// SMART CAMPAIGNS //

interface ISmartCampaigns {
	id: number;
	name: string;
	mailingGroupId: number;
	status: string;
	type: string;
	created: string;
	modified: string;
	started: string;
	finished: string;
	links: Array<{ rel: string; href: string }>;
}

export interface ICreateSmartCampaignsApiResponse {
	id: number;
	name: string;
	mailingGroupId: number;
	status: string;
	type: string;
	created: string;
	modified: string;
	links: Array<{ rel: string; href: string }>;
	targetGroups: [];
	messages: [];
}

export interface IGetSmartCampaignsApiResponse {
	limit: number;
	elements: ISmartCampaigns[];
	count: number;
	links: IApiLink[];
}

export interface IGetSmartCampaignsMailingsApiResponse {
	nodeId: string;
	name: string;
	mailingId: number;
	mediaType: ITransactionalMailMediaType;
	status: string;
	created: string;
	modified: string;
	started: string;
	finished: string;
	subject: {};
	links: Array<{ rel: string; href: string }>;
	gridLocation: { x: number; y: number };
}

// RecipientListsFields
export interface IRecipientListFieldApiResponse {
	limit: number;
	elements: IRecipientListField[];
	count: number;
	links: IApiLink[];
}

export interface IRecipientListField {
	internalName: string;
	displayName: string;
	type: IRecipientListFieldType;
	required: boolean;
}

// OptInProcesses
export interface IOptInProcessesApiResponse {
	limit: number;
	elements: IOptInProcesses[];
	count: number;
	links: IApiLink[];
}

export interface IOptInProcesses {
	id: number;
	name: string;
	description: string;
	type: string;
	confirmationMailingId: number;
	confirmationUrl: string;
	created: string;
	modified: string;
	links: IApiLink[];
}

// TransactionalMails
type ITransactionalMailStatus =
	| 'invalid'
	| 'activationRequired'
	| 'activated'
	| 'canceled'
	| 'paused'
	| 'running'
	| 'finished';

type ITransactionalMailMediaType = 'email' | 'sms' | 'push' | 'print' | string;

export interface ITransactionalMail {
	id: number;
	name: string;
	mailingGroupId: number;
	status: ITransactionalMailStatus;
	type: string;
	created: string;
	modified: string;
	links: IApiLink[];
}

export interface ITransactionalMailsApiResponse {
	limit: number;
	elements: ITransactionalMail[];
	count: number;
	links: IApiLink[];
}

// TransactionalMail (singular)
export interface ITransactionalMailDetailsApiResponse extends ITransactionalMail {
	recipientLists: {
		nodeId: string;
		successorNodeId: string;
		recipientListIds: number[];
		links: IApiLink[];
		gridLocation: {};
	};
	targetGroups: string[];
	messages: [];
	message: {
		nodeId: string;
		name: string;
		mailingId: number;
		mediaType: ITransactionalMailMediaType;
		status: ITransactionalMailStatus;
		created: string;
		modified: string;
		senderAddress: string;
		senderName: string;
		replyToAddress: string;
		subject: {
			default: string;
		};
		links: IApiLink[];
		attachmentIds: [];
		gridLocation: {};
	};
}

export interface IApiLink {
	rel: string;
	href: string;
}

export interface IRecipientPollingTriggerStaticData {
	lastCreated?: string;
}

// Webhook

export type IWebhookType =
	| 'open'
	| 'click'
	| 'sent'
	| 'bounce'
	| 'unsubscribe'
	| 'spamcomplaint'
	| 'singleoptin'
	| 'confirmedoptin'
	| 'doubleoptin'
	| 'blocklist'
	| 'archive'
	| 'filteredbyblocklist';

export type IWebhookStatus = 'created' | 'active' | 'inactive' | 'deactivated';

export interface IOptiWebhookAuth {
	type: 'none' | 'basic' | 'oauth2' | string;
}

export interface IGetWebhookApiResponse {
	id: number;
	type: IWebhookType;
	status: IWebhookStatus;
	format: 'json';
	targetUrl: string;
	authentication: IOptiWebhookAuth;
	created: string;
	modified: string;
}

export interface ICreateWebhookResponse {
	id: number;
	webhookId: number;
	type: IWebhookType;
	targetUrl: string;
	status: IWebhookStatus;
	format: string;
}

export interface IVerifyWebhookApiResponse {
	id: number;
	httpStatusCode: number;
	responseBody: string;
	numberOfEvents: number;
	targetUrl: string;
}
