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
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalNumberControl as NumberControl,
	TreeSelect,
	__experimentalHStack as HStack,
	Button,
	Modal,
} from '@wordpress/components';
import { useState, useRef, useEffect } from '@wordpress/element';

const Property = (props) => {
	const {
		label,
		id,
		help,
		type,
		options,
		link,
		isDeprecated,
		isRequired,
		placeholder,
		value,
		code,
		onChange,
		defaultValue,
	} = props;

	const overwrite = '';
	let the_label = label;
	const the_link =
		link ||
		'https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/#' +
			id;
	const inherited = !!placeholder && value == undefined;
	let the_type = type;
	if (options) {
		the_type = 'array';
	} else if (code) {
		the_type = 'code';
	}

	const formatedPlaceholder = placeholder ? '[' + placeholder + ']' : '';

	if (inherited) {
		the_label += ' (' + __('inherited', 'freemius') + ')';
	} else if (isRequired) {
		the_label += ' (' + __('required', 'freemius') + ')';
	}
	if (isDeprecated) {
		the_label += ' (' + __('deprecated', 'freemius') + ')';
	}

	const onChangeHandler = (val) => {
		if (onChange) {
			if (val === '') {
				onChange(undefined);
				return;
			}

			switch (type) {
				case 'integer':
				case 'number':
					onChange(parseInt(val));
					break;
				default:
					onChange(val);
			}
		}
	};

	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<ToolsPanelItem
			className="freemius-button-scope"
			hasValue={() => {
				return value != undefined || inherited;
			}}
			label={label}
			onDeselect={() => onChangeHandler(undefined)}
			isShownByDefault={isRequired}
		>
			<BaseControl __nextHasNoMarginBottom help={overwrite}>
				<ExternalLink className="freemius-link" href={the_link} />
				{(() => {
					switch (the_type) {
						case 'boolean':
							return (
								<CheckboxControl
									__nextHasNoMarginBottom
									checked={value != undefined ? value : defaultValue}
									label={the_label}
									help={help}
									indeterminate={!!placeholder && value == undefined}
									onChange={(val) => {
										onChangeHandler(val);
									}}
								/>
							);

						case 'integer':
						case 'number':
							return (
								<NumberControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									value={value || ''}
									label={the_label}
									help={help}
									isDragEnabled={false}
									min={0}
									placeholder={formatedPlaceholder}
									onChange={onChangeHandler}
									onWheel={(e) => {
										e.target.blur();
										return false;
									}}
								/>
							);

						case 'array':
							return (
								<TreeSelect
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									label={the_label}
									help={help}
									onChange={onChangeHandler}
									selectedId={value}
									noOptionLabel={sprintf(
										__('Choose %s', 'freemius'),
										the_label
									)}
									tree={Object.keys(options).map((key) => {
										const label = options[key];
										return { name: label, id: key };
									})}
								/>
							);
						case 'code':
							return (
								<>
									<BaseControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize
										label={the_label}
										help={help}
									>
										<TextareaControl
											__nextHasNoMarginBottom
											__next40pxDefaultSize
											value={value || ''}
											onChange={onChangeHandler}
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
											title={the_label}
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
												<HStack justify="flex-end">
													<ExternalLink href={the_link}>
														{__('Documentation', 'freemius')}
													</ExternalLink>
												</HStack>
												<CodeEditor
													value={value || ''}
													onChange={onChangeHandler}
													codemirrorProps={{
														placeholder: formatedPlaceholder,
													}}
													rows={value ? 10 : 3}
												/>
											</BaseControl>
										</Modal>
									)}
								</>
							);
						default:
							return (
								<TextControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									value={value || ''}
									label={the_label}
									help={help}
									placeholder={formatedPlaceholder}
									onChange={onChangeHandler}
								/>
							);
					}
				})()}
			</BaseControl>
		</ToolsPanelItem>
	);
};

const CodeEditor = (props) => {
	const { type, value, onChange, codemirrorProps } = props;
	const textarea = useRef(null);
	const editorRef = useRef(null);
	s;

	useEffect(() => {
		if (editorRef.current && textarea.current) return;

		const editor = initCodeEditor(textarea.current, codemirrorProps);
		if (editor) {
			editor.on('change', () => {
				onChange(editor.getValue());
			});
			editor.setValue(value);
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

export default Property;
