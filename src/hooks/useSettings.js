/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { SETTINGS_STORE } from '../stores';

const useSettings = (setting) => {
	const {
		settings,
		structure,
		isLoading,
		isSaving,
		saveMessage,
		saveMessageType,
		error,
	} = useSelect(
		(select) => {
			const store = select(SETTINGS_STORE);
			return {
				settings: store.getSettings(setting),
				structure: store.getStructure(setting),
				isLoading: store.isLoading(),
				isSaving: store.isSaving(),
				saveMessage: store.getSaveMessage(),
				saveMessageType: store.getSaveMessageType(),
				error: store.getError(),
			};
		},
		[setting]
	);

	const [initialSettings, setInitialSettings] = useState();

	// store initial settings
	useEffect(() => {
		if (!settings) return;
		setInitialSettings(JSON.stringify(settings));
	}, [structure]);

	const {
		saveSettings: saveSettingsAction,
		updateSetting,
		setSettings,
		reloadSettings: reloadSettingsAction,
	} = useDispatch(SETTINGS_STORE);

	// Load settings on mount
	useEffect(() => {
		// This will trigger the resolver to load settings
		if (!settings || Object.keys(settings).length === 0) {
			// The resolver will automatically run when we access getSettings
		}
	}, []);

	// Backward compatibility: provide the same API as the original hook
	const saveSettings = () => {
		saveSettingsAction();
		// Set initial settings to the current settings
		setInitialSettings(JSON.stringify(settings));
	};

	// Load settings function for backward compatibility
	const loadSettings = () => {
		reloadSettingsAction();
	};

	const hasChanges = JSON.stringify(settings) !== initialSettings;

	return {
		settings,
		structure,
		loadSettings,
		saveSettings,
		isLoading: settings === undefined || structure === undefined || isLoading,
		isSaving,
		hasChanges,
		saveMessage,
		saveMessageType,
		error,
		updateSetting,
		setSettings,
	};
};

export default useSettings;
