/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

export const ModifierButtons = (props) => {
	const { attributes, onChange = () => {} } = props;

	const {
		labels = {},
		options = [],
		current = '',
		className = '',
	} = attributes;

	const TagName = className.includes('is-style-link') ? 'a' : 'button';

	//const enabled = options.filter((option) => !disabled.includes(option.id));

	return options.map((option) => (
		<a
			key={option.id}
			href={current == option.id ? '#' : ''}
			onClick={() => {
				onChange(option.id);
			}}
			className={classnames({
				'is-active': current == option.id,
				'wp-block-button__link': !className.includes('is-style-link'),
			})}
		>
			{labels[option.id] || option.name}
		</a>
	));
};
