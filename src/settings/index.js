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
	Button,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import './style.scss';

import Header from './header';
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

const Settings = () => {
	const {
		settings,
		structure,
		isLoading,
		setSettings,
		saveMessage,
		saveMessageType,
	} = useSettings();

	const [activeTab, setActiveTab] = useState(
		window.location.hash.replace('#', '') || 'settings'
	);

	if (isLoading) {
		return (
			<Card>
				<CardBody>
					<p>{__('Loading settings...', 'og_image')}</p>
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
						{schema.type && schema.type === 'array' ? (
							<>
								{(Object.entries(settings[setting]) || []).map((item, i) => (
									<Card key={i} elevation={3} style={{ marginBottom: '10px' }}>
										<CardBody>
											<Flex justify="flex-end">
												<Button
													variant="tertiary"
													isDestructive
													onClick={() => {
														const newSettings = {
															...settings,
															[setting]: settings[setting]
																.slice(0, i)
																.concat(settings[setting].slice(i + 1)),
														};

														setSettings(newSettings);
													}}
												>
													{__('Delete', 'freemius')}
												</Button>
											</Flex>
											{Object.entries(schema.properties).map(([key, prop]) => {
												return (
													<Element
														key={key}
														index={i}
														id={key}
														prop={prop}
														setting={setting}
													/>
												);
											})}
										</CardBody>
									</Card>
								))}
								<Button
									variant="secondary"
									onClick={() => {
										const newSettings = { ...settings };
										const newEntry = {};
										Object.entries(schema.properties).forEach(([key, prop]) => {
											newEntry[key] = prop.default;
										});
										newSettings[setting].push(newEntry);

										setSettings(newSettings);
									}}
								>
									{__('Add a new product', 'freemius')}
								</Button>
							</>
						) : (
							Object.entries(schema.properties).map(([key, prop]) => {
								return (
									<Element key={key} id={key} prop={prop} setting={setting} />
								);
							})
						)}
					</CardBody>
				</Card>
			</TabContainer>
		),
	}));

	return (
		<>
			<Header />
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
				<Flex justify="flex-start" wrap={true}>
					<FlexItem>
						<Spacer />
						<SaveButton />
					</FlexItem>
				</Flex>
			</ContentContainer>
		</>
	);
};

const Element = ({ id, prop, setting, index }) => {
	const {
		settings,
		structure,
		isLoading,
		setSettings,
		saveMessage,
		saveMessageType,
	} = useSettings();

	const isArray = structure[setting]?.type === 'array' && index !== undefined;

	const getValueFor = (setting, id) => {
		const type = structure[setting]?.properties[id]?.type;
		const defaultValue = structure[setting]?.properties[id]?.default;

		if (isArray) {
			return settings[setting][index][id] !== undefined
				? settings[setting][index][id]
				: defaultValue || '';
		}

		return settings[setting][id] !== undefined
			? settings[setting][id]
			: defaultValue || '';
	};

	const getLabelFor = (prop) => {
		let label = prop.label;

		if (prop.isDeprecated) {
			label += ' (Deprecated)';
		}

		return label;
	};

	const updateSetting = (setting, id, value) => {
		let newSettings = { ...settings };
		const type = structure[setting]?.properties[id]?.type;
		const defaultValue = structure[setting]?.properties[id]?.default;
		if (value === '' || value === defaultValue) {
			if (isArray) {
				delete newSettings[setting][index][id];
			} else {
				delete newSettings[setting][id];
			}
		} else if (type === 'boolean') {
			if (isArray) {
				newSettings[setting][index][id] = value ? true : false;
			} else {
				newSettings[setting][id] = value ? true : false;
			}
		} else if (type === 'number' || type === 'integer') {
			if (isArray) {
				newSettings[setting][index][id] = parseInt(value);
			} else {
				newSettings[setting][id] = parseInt(value);
			}
		} else {
			if (isArray) {
				newSettings[setting][index][id] = value;
			} else {
				newSettings[setting][id] = value;
			}
		}
		setSettings(newSettings);
	};

	if (prop.isDeprecated) {
		return null;
	}

	return (
		<BaseControl __nextHasNoMarginBottom>
			{prop.link && <ExternalLink href={prop.link} />}
			{prop.enum ? (
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					value={getValueFor(setting, id)}
					onChange={(value) => updateSetting(setting, id, value)}
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
					value={getValueFor(setting, id)}
					onChange={(value) => updateSetting(setting, id, value)}
					label={getLabelFor(prop)}
					help={prop.description}
				/>
			) : prop.type === 'string' ? (
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					value={getValueFor(setting, id)}
					type={prop.input_type ? prop.input_type : 'text'}
					onChange={(value) => updateSetting(setting, id, value)}
					label={getLabelFor(prop)}
					help={prop.description}
				/>
			) : prop.type === 'boolean' ? (
				<CheckboxControl
					__nextHasNoMarginBottom
					checked={getValueFor(setting, id)}
					onChange={(value) => updateSetting(setting, id, value)}
					label={getLabelFor(prop)}
					help={prop.description}
				/>
			) : prop.type === 'number' || prop.type === 'integer' ? (
				<NumberControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					value={getValueFor(setting, id)}
					min={prop.min}
					max={prop.max}
					onChange={(value) => updateSetting(setting, id, value)}
					label={getLabelFor(prop)}
					help={prop.description}
				/>
			) : null}

			<Spacer margin={6} />
		</BaseControl>
	);
};

domReady(() => {
	const rootElement = document.getElementById('freemius-settings-app');

	if (rootElement) {
		const root = createRoot(rootElement);
		root.render(<Settings />);
	}
});

export default Settings;
