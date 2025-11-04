import { loadOptions } from './loadOptions';
import { resourceMapping } from './resourceMapping';

export const {
	getRecipientLists,
	getTransactionalRecipientLists,
	getRecipientListAttributes,
	getRecipientListIdAttributes,
	getOptInProcesses,
	getTransactionalMails,
	getTransactionalMailRecipientLists,
} = loadOptions;
export const { getCampaignAttributes, getCampaignAttributesForTransactional } = resourceMapping;
