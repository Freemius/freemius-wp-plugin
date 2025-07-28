/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	BaseControl,
	TextControl,
	CheckboxControl,
	ExternalLink,
	TextareaControl,
	__experimentalNumberControl as NumberControl,
	TreeSelect,
	__experimentalHStack as HStack,
	Button,
	Modal,
} from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useData, usePlans } from '../hooks';

const PropertyInputField = (properties) => {
	const {
		label,
		help,
		type,
		link,
		placeholder,
		value,
		onChange,
		defaultValue,
		formatedPlaceholder,
		props,
	} = properties;

	const { options } = props;

	let InputComponent = null;

	const [isModalOpen, setIsModalOpen] = useState(false);

	switch (type) {
		case 'boolean':
			InputComponent = (
				<CheckboxControl
					__nextHasNoMarginBottom
					checked={value != undefined ? value : defaultValue}
					label={label}
					help={help}
					indeterminate={!!placeholder && value == undefined}
					onChange={onChange}
				/>
			);
			break;

		case 'integer':
		case 'number':
			InputComponent = (
				<NumberControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					value={value || ''}
					label={label}
					help={help}
					isDragEnabled={false}
					min={0}
					placeholder={formatedPlaceholder}
					onChange={onChange}
					onWheel={(e) => {
						// do not allow to change the value by scrolling
						e.target.blur();
						return false;
					}}
				/>
			);
			break;
		case 'array':
			InputComponent = (
				<TreeSelect
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={label}
					help={help}
					onChange={onChange}
					selectedId={value}
					noOptionLabel={sprintf(__('Choose %s', 'freemius'), label)}
					tree={Object.keys(options).map((key) => {
						const label = options[key];
						return { name: label, id: key };
					})}
				/>
			);
			break;
		case 'code':
			InputComponent = (
				<>
					<BaseControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={label}
						help={help}
					>
						<TextareaControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							value={value || ''}
							onChange={onChange}
							placeholder={formatedPlaceholder}
						/>
						<HStack justify="flex-end">
							<Button
								icon="external"
								onClick={() => setIsModalOpen(true)}
								variant="tertiary"
								size="small"
							>
								{__('Popout Editor', 'freemius')}
							</Button>
						</HStack>
					</BaseControl>

					{isModalOpen && (
						<Modal
							title={label}
							size="large"
							onRequestClose={() => {
								setIsModalOpen(false);
							}}
						>
							<BaseControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								help={help}
							>
								{link && (
									<HStack justify="flex-end">
										<ExternalLink href={link}>
											{__('Documentation', 'freemius')}
										</ExternalLink>
									</HStack>
								)}
								<CodeEditor
									value={value}
									onChange={onChange}
									rows={value ? 10 : 3}
								/>
							</BaseControl>
						</Modal>
					)}
				</>
			);
			break;
		default:
			InputComponent = (
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					value={value || ''}
					label={label}
					help={help}
					placeholder={formatedPlaceholder}
					onChange={onChange}
				/>
			);
			break;
	}

	const SpecialComponent = getSpecial(properties);

	if (SpecialComponent) {
		InputComponent = SpecialComponent;
	}

	return (
		<>
			{link && (
				<HStack justify="flex-end">
					<ExternalLink href={link} />
				</HStack>
			)}
			{InputComponent}
		</>
	);
};

const CodeEditor = (props) => {
	const { value, onChange, codemirrorProps } = props;
	const textarea = useRef(null);
	const editorRef = useRef(null);

	useEffect(() => {
		if (editorRef.current && textarea.current) return;

		const editor = initCodeEditor(textarea.current, codemirrorProps);
		if (editor) {
			editor.setValue(value || '');
			editor.on('change', () => {
				onChange(editor.getValue() || undefined);
			});
			editor
				.getWrapperElement()
				.classList.add('components-text-control__input');

			editorRef.current = editor;
		}

		return () => {
			if (editorRef.current) {
				editorRef.current.toTextArea(); // clean up
				editorRef.current = null;
			}
		};
	}, [textarea]);

	return <textarea ref={textarea} defaultValue={value} />;
};

function initCodeEditor(textarea, props) {
	if (!window.wp || !window.wp.CodeMirror || !textarea) return;

	return wp.CodeMirror.fromTextArea(textarea, {
		mode: 'application/javascript',
		lineNumbers: true,
		indentUnit: 4,
		tabSize: 4,
		indentWithTabs: true,
		lint: true,
		...props,
	});
}

function getSpecial(properties) {
	const { value, onChange, props, help, label, inherited } = properties;

	const { data } = useData();

	if (!data?.product_id) return null;

	if (props.id === 'plan_id') {
		const { plans, isLoading, error } = usePlans(data.product_id);

		if (isLoading || error) return null;

		const currentPlan = plans.find((plan) => plan?.id == value) || null;

		let noOptionLabel = '';
		if (value === undefined || !inherited) {
			noOptionLabel = __('Use Default Plan', 'freemius');
		} else {
			noOptionLabel = sprintf(
				__('[%s] %s', 'freemius'),
				currentPlan?.id,
				currentPlan?.title
			);
		}

		if (plans) {
			return (
				<TreeSelect
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={label}
					help={help}
					onChange={onChange}
					selectedId={value}
					noOptionLabel={noOptionLabel}
					tree={Object.entries(plans).map(([i, plan]) => {
						return {
							name: `[${plan.id}] ${plan.title}`,
							id: plan.id,
						};
					})}
				/>
			);
		}
	}

	return null;
}

export default PropertyInputField;
