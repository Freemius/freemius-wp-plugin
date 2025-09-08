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
	const { attributes, onChange = () => {}, isSave = false } = props;

	const {
		labels = {},
		options = [],
		current = '',
		className = '',
	} = attributes;

	if (className.includes('is-style-dropdown')) {
		return (
			<>
				<label htmlFor="modifier-select" className="screen-reader-text">
					{__('Select modifier', 'freemius')}
				</label>
				<select
					id="modifier-select"
					data-wp-on--change="actions.switchModifier"
					value={current}
					onChange={(e) => {
						onChange(e.target.value);
					}}
					aria-label={__('Select modifier', 'freemius')}
				>
					{options.map((option) => (
						<option
							key={option.id}
							value={option.id}
							data-option-id={option.id}
							data-wp-context={JSON.stringify({ optionId: option.id })}
							selected={isSave ? current == option.id : undefined}
							aria-selected={current == option.id}
						>
							{labels[option.id] || option.name}
						</option>
					))}
				</select>
			</>
		);
	}

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
				aria-pressed={isActive}
				tabIndex="0"
			>
				{labels[option.id] || option.name}
			</a>
		);
	});
};
