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
		type,
	} = attributes;

	return options.map((option) => {
		const isActive = current == option.id;
		const buttonClasses = classnames({
			'is-active': isActive,
			'wp-block-button__link': !className.includes('is-style-link'),
		});

		return (
			<a
				key={option.id}
				onClick={() => {
					onChange(option.id);
				}}
				className={buttonClasses}
				data-option-id={option.id}
				data-wp-on--click="actions.switchModifier"
				data-wp-context={JSON.stringify({ optionId: option.id })}
			>
				{labels[option.id] || option.name}
			</a>
		);
	});
};
