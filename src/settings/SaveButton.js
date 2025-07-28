/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useSettings } from '../hooks';

const SaveButton = () => {
	const {
		settings,
		structure,
		isLoading,
		saveSettings,
		setSettings,
		isSaving,
		hasChanges,
	} = useSettings();

	return (
		<Button
			variant="primary"
			onClick={() => saveSettings()}
			isBusy={isSaving}
			disabled={isSaving || !hasChanges}
			className="freemius-save-button"
		>
			{isSaving ? __('Saving...', 'freemius') : __('Save Settings', 'freemius')}
		</Button>
	);
};

export default SaveButton;
