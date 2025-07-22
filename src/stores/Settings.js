import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const SETTINGS_STORE = 'freemius/settings';

const SETTINGS = [
	'freemius_general',
	'freemius_api',
	'freemius_editor_settings',
];

const DEFAULT_STATE = {
	settings: {},
	structure: {},
	isLoading: false,
	isSaving: false,
	saveMessage: '',
	saveMessageType: 'success',
	error: null,
};

const actions = {
	setSettings(settings) {
		return {
			type: 'SET_SETTINGS',
			settings,
		};
	},

	setStructure(structure) {
		return {
			type: 'SET_STRUCTURE',
			structure,
		};
	},

	setLoading(isLoading) {
		return {
			type: 'SET_LOADING',
			isLoading,
		};
	},

	setSaving(isSaving) {
		return {
			type: 'SET_SAVING',
			isSaving,
		};
	},

	setSaveMessage(message, messageType = 'success') {
		return {
			type: 'SET_SAVE_MESSAGE',
			message,
			messageType,
		};
	},

	setError(error) {
		return {
			type: 'SET_ERROR',
			error,
		};
	},

	updateSetting(settingKey, value) {
		return {
			type: 'UPDATE_SETTING',
			settingKey,
			value,
		};
	},

	clearSaveMessage() {
		return {
			type: 'CLEAR_SAVE_MESSAGE',
		};
	},

	reloadSettings() {
		return async ({ dispatch }) => {
			dispatch.setLoading(true);
			dispatch.setError(null);

			try {
				const [schema, allSettings] = await Promise.all([
					apiFetch({
						path: '/wp/v2/settings',
						method: 'OPTIONS',
					}),
					apiFetch({
						path: '/wp/v2/settings',
					}),
				]);

				const structure = SETTINGS.reduce((acc, setting) => {
					acc[setting] = schema.schema.properties[setting];
					return acc;
				}, {});

				const settings = SETTINGS.reduce((acc, setting) => {
					acc[setting] = allSettings[setting] || {};
					return acc;
				}, {});

				dispatch.setStructure(structure);
				dispatch.setSettings(settings);
			} catch (error) {
				console.error('Failed to reload settings:', error);
				dispatch.setError(error);
				dispatch.setSaveMessage(
					__('Failed to reload settings', 'freemius'),
					'error'
				);
			} finally {
				dispatch.setLoading(false);
			}
		};
	},

	saveSettings() {
		return async ({ dispatch, select }) => {
			dispatch.setSaving(true);
			dispatch.setSaveMessage('');

			try {
				const settings = select.getSettings();

				await Promise.all(
					SETTINGS.map((setting) => {
						return apiFetch({
							path: '/wp/v2/settings',
							method: 'POST',
							data: {
								[setting]: settings[setting],
							},
						});
					})
				);

				dispatch.setSaveMessage(
					__('Settings saved successfully!', 'freemius'),
					'success'
				);

				// Clear message after 5 seconds
				setTimeout(() => dispatch.clearSaveMessage(), 5000);
			} catch (error) {
				console.error('Failed to save settings:', error);
				dispatch.setError(error);
				dispatch.setSaveMessage(
					__('Failed to save settings', 'freemius'),
					'error'
				);
			} finally {
				dispatch.setSaving(false);
			}
		};
	},
};

const store = createReduxStore(SETTINGS_STORE, {
	reducer(state = DEFAULT_STATE, action) {
		switch (action.type) {
			case 'SET_SETTINGS':
				return {
					...state,
					settings: action.settings,
				};

			case 'SET_STRUCTURE':
				return {
					...state,
					structure: action.structure,
				};

			case 'SET_LOADING':
				return {
					...state,
					isLoading: action.isLoading,
				};

			case 'SET_SAVING':
				return {
					...state,
					isSaving: action.isSaving,
				};

			case 'SET_SAVE_MESSAGE':
				return {
					...state,
					saveMessage: action.message,
					saveMessageType: action.messageType,
				};

			case 'SET_ERROR':
				return {
					...state,
					error: action.error,
					isLoading: false,
					isSaving: false,
				};

			case 'UPDATE_SETTING':
				const newSettings = {
					...state.settings,
					[action.settingKey]: action.value,
				};

				return {
					...state,
					settings: newSettings,
				};

			case 'CLEAR_SAVE_MESSAGE':
				return {
					...state,
					saveMessage: '',
				};

			default:
				return state;
		}
	},

	actions,

	selectors: {
		getSettings(state, settingKey = null) {
			return settingKey ? state.settings[settingKey] : state.settings;
		},

		getStructure(state, settingKey = null) {
			return settingKey ? state.structure[settingKey] : state.structure;
		},

		isLoading(state) {
			return state.isLoading;
		},

		isSaving(state) {
			return state.isSaving;
		},

		getSaveMessage(state) {
			return state.saveMessage;
		},

		getSaveMessageType(state) {
			return state.saveMessageType;
		},

		getError(state) {
			return state.error;
		},
	},

	resolvers: {
		getSettings:
			() =>
			async ({ dispatch }) => {
				dispatch.setLoading(true);
				dispatch.setError(null);

				try {
					const [schema, allSettings] = await Promise.all([
						apiFetch({
							path: '/wp/v2/settings',
							method: 'OPTIONS',
						}),
						apiFetch({
							path: '/wp/v2/settings',
						}),
					]);

					const structure = SETTINGS.reduce((acc, setting) => {
						acc[setting] = schema.schema.properties[setting];
						return acc;
					}, {});

					const settings = SETTINGS.reduce((acc, setting) => {
						acc[setting] = allSettings[setting] || {};
						if (Object.keys(acc[setting]).length === 0) {
							acc[setting] = {};
						}
						return acc;
					}, {});

					dispatch.setStructure(structure);
					dispatch.setSettings(settings);
				} catch (error) {
					console.error('Failed to load settings:', error);
					dispatch.setError(error);
					dispatch.setSaveMessage(
						__('Failed to load settings', 'freemius'),
						'error'
					);
				} finally {
					dispatch.setLoading(false);
				}
			},
	},
});

if (!select(SETTINGS_STORE)) {
	register(store);
}

export { SETTINGS_STORE };
