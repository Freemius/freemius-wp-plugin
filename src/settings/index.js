/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { createRoot } from 'react-dom/client';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import {
	Card,
	CardBody,
	CardHeader,
	TextControl,
	CheckboxControl,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	TextareaControl,
	Notice,
	Flex,
	FlexItem,
	__experimentalSpacer as Spacer,
	TabPanel,
	BaseControl,
	ExternalLink,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

import FreemiusHeader from './header';
import SaveButton from './SaveButton';
import { useSettings } from '../hooks';

const TabContainer = styled.div`
	max-width: 800px;
	margin-top: 20px;
`;

const ContentContainer = styled.div`
	padding: 20px;
`;

const TabDescription = styled.p`
	font-size: 14px;
	color: #666;
`;

const SETTINGS = [
	'freemius_general',
	'freemius_api',
	'freemius_editor_settings',
];

const FreemiusSettings = () => {
	const {
		settings,
		structure,
		isLoading,
		setSettings,
		saveMessage,
		saveMessageType,
	} = useSettings();

	const [activeTab, setActiveTab] = useState(
		window.location.hash.replace('#', '') || 'general'
	);

	const getValueFor = (setting, key) => {
		const type = structure[setting].properties[key].type;
		const defaultValue = structure[setting].properties[key].default;

		return settings[setting][key] !== undefined
			? settings[setting][key]
			: defaultValue || '';
	};

	const getLabelFor = (prop) => {
		let label = prop.label;

		if (prop.isDeprecated) {
			label += ' (Deprecated)';
		}

		return label;
	};

	const updateSetting = (setting, key, value) => {
		let newSettings = { ...settings };
		const type = structure[setting].properties[key].type;
		const defaultValue = structure[setting].properties[key].default;
		if (value === '' || value === defaultValue) {
			delete newSettings[setting][key];
		} else if (type === 'boolean') {
			newSettings[setting][key] = value ? true : false;
		} else if (type === 'number' || type === 'integer') {
			newSettings[setting][key] = parseInt(value);
		} else {
			newSettings[setting][key] = value;
		}
		setSettings(newSettings);
	};

	if (isLoading) {
		return (
			<Card>
				<CardBody>
					<p>{__('Loading settings...', 'freemius')}</p>
				</CardBody>
			</Card>
		);
	}

	const tabs = Object.entries(structure).map(([setting, schema], i) => ({
		name: setting,
		title: schema.title,
		content: (
			<TabContainer>
				<Card isRounded={false}>
					<CardHeader>
						<h3>{schema.title}</h3>
					</CardHeader>
					<CardBody>
						<TabDescription>{schema.description}</TabDescription>
						{Object.entries(schema.properties).map(([key, prop]) => {
							if (prop.isDeprecated) {
								return null;
							}

							return (
								<BaseControl __nextHasNoMarginBottom key={key}>
									{prop.link && <ExternalLink href={prop.link} />}
									{prop.enum ? (
										<SelectControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											value={getValueFor(setting, key)}
											onChange={(value) => updateSetting(setting, key, value)}
											label={getLabelFor(prop)}
											help={prop.description}
											options={prop.enum.map((item) => ({
												label: item,
												value: item,
											}))}
										/>
									) : prop.code ? (
										<TextareaControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											value={getValueFor(setting, key)}
											onChange={(value) => updateSetting(setting, key, value)}
											label={getLabelFor(prop)}
											help={prop.description}
										/>
									) : prop.type === 'string' ? (
										<TextControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											value={getValueFor(setting, key)}
											type={prop.input_type ? prop.input_type : 'text'}
											onChange={(value) => updateSetting(setting, key, value)}
											label={getLabelFor(prop)}
											help={prop.description}
										/>
									) : prop.type === 'boolean' ? (
										<CheckboxControl
											__nextHasNoMarginBottom
											checked={getValueFor(setting, key)}
											onChange={(value) => updateSetting(setting, key, value)}
											label={getLabelFor(prop)}
											help={prop.description}
										/>
									) : prop.type === 'number' ? (
										<NumberControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											value={getValueFor(setting, key)}
											onChange={(value) => updateSetting(setting, key, value)}
											label={getLabelFor(prop)}
											help={prop.description}
										/>
									) : prop.type === 'integer' ? (
										<NumberControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											value={getValueFor(setting, key)}
											onChange={(value) => updateSetting(setting, key, value)}
											label={getLabelFor(prop)}
											help={prop.description}
										/>
									) : null}

									<Spacer margin={6} />
								</BaseControl>
							);
						})}
					</CardBody>
				</Card>
			</TabContainer>
		),
	}));

	return (
		<>
			<FreemiusHeader />
			<ContentContainer>
				{saveMessage && (
					<Notice
						status={saveMessageType}
						isDismissible
						onRemove={() => setSaveMessage('')}
					>
						{saveMessage}
					</Notice>
				)}
				<TabPanel
					tabs={tabs}
					initialTabName={activeTab ? `freemius_${activeTab}` : null}
					onSelect={(tab) => {
						const hash = tab.replace('freemius_', '');
						if (window.location.hash !== `#${hash}`) {
							window.history.pushState(null, '', `#${hash}`);
						}
					}}
				>
					{(tab) => <>{tab.content}</>}
				</TabPanel>
				<Flex justify="flex-start">
					<FlexItem>
						<SaveButton />
					</FlexItem>
				</Flex>
			</ContentContainer>
		</>
	);
};

domReady(() => {
	const rootElement = document.getElementById('freemius-settings-app');

	if (rootElement) {
		const root = createRoot(rootElement);
		root.render(<FreemiusSettings />);
	}
});

export default FreemiusSettings;
