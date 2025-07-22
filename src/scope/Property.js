/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useData } from '../hooks';
import PropertyInputField from './PropertyInputField';

const FREEMIUS_LINK_BASE =
	'https://freemius.com/help/documentation/selling-with-freemius/freemius-checkout-buy-button/';

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
	const the_link = link || FREEMIUS_LINK_BASE + '#' + id;

	const { data } = useData();

	const inherited = value == undefined && data?.[id];

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

	return (
		<ToolsPanelItem
			className="freemius-button-scope"
			hasValue={() => {
				return value != undefined;
			}}
			label={label}
			onDeselect={() => onChangeHandler(undefined)}
			isShownByDefault={(false && isRequired) || inherited}
		>
			<BaseControl __nextHasNoMarginBottom help={overwrite}>
				<PropertyInputField
					label={the_label}
					help={help}
					type={the_type}
					value={value}
					onChange={onChangeHandler}
					formatedPlaceholder={formatedPlaceholder}
					props={props}
					link={the_link}
					inherited={inherited}
				/>
			</BaseControl>
		</ToolsPanelItem>
	);
};

export default Property;
