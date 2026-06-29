/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './style.scss';

export default function Save( { attributes } ) {
	const { store_id, public_key, height = 300 } = attributes;

	const blockProps = useBlockProps.save( {
		style: {
			height: height + 'px',
		},
		'data-freemius-portal': JSON.stringify( {
			store_id,
			public_key,
			height,
		} ),
	} );

	return <div { ...blockProps } />;
}
