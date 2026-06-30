/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	applyQueryModifiers,
	applyScopeOverrides,
} from '../../utils/scope';

store( 'freemius/modifier', {
	state: {
		get current() {
			return getContext().current;
		},
	},
	actions: {
		switchModifier: ( event ) => {
			const context = getContext();

			const optionId =
				event.target.tagName === 'SELECT'
					? JSON.parse(
							event.target.selectedOptions[ 0 ]?.dataset
								?.wpContext
					  )?.optionId
					: context.optionId;

			context.current = optionId;

			const scope = event.target.closest( '[data-freemius-scope]' );

			if ( ! scope ) return;

			applyScopeOverrides( scope, {
				[ context.type ]: optionId,
			} );
		},
	},
	callbacks: {
		init: () => {
			getContext();
			getElement();
			applyQueryModifiers();
		},
	},
} );

applyQueryModifiers();
