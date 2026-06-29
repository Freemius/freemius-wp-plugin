/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './style.scss';

export default function Save( { attributes } ) {
	const { store_id, public_key } = attributes;

	const blockProps = useBlockProps.save( {
		'data-freemius-portal': JSON.stringify( {
			store_id,
			public_key,
		} ),
	} );

	return <div { ...blockProps } />;
}
