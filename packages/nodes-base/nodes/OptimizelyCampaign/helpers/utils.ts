/**
 * Converts the recipient list types to n8n / TypeScript types
 */
export function mapApiTypeToN8nType(apiType: string) {
	switch (apiType.toUpperCase()) {
		case 'STRING':
		case 'TEXT':
			return 'string' as const;
		case 'DATE':
			return 'dateTime' as const;
		case 'BOOLEAN':
			return 'boolean' as const;
		case 'DECIMAL':
		case 'LONG':
		case 'INTEGER':
			return 'number' as const;
		default:
			return 'string' as const;
	}
}

/**
 * Checks if a given string is a Optimizely Campaign system field
 */
export function isCampaignSystemField(value: string) {
	const systemRecipientListFields: Array<string> = ['created', 'modified', 'bmOptinFinishedDate'];

	if (systemRecipientListFields.includes(value)) {
		return true;
	}

	return false;
}
