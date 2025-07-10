/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';

const useFreemiusPageMeta = () => {
	const postType = useSelect((select) =>
		select('core/editor').getCurrentPostType()
	);

	const [pageMeta, setPageMeta] = useEntityProp('postType', postType, 'meta');

	const freemiusPageMetaData =
		pageMeta?.freemius_button.length > 0 ? pageMeta?.freemius_button : {};

	const setFreemiusPageMeta = (key, value) => {
		setPageMeta({ ...pageMeta, [key]: value });
	};

	return [freemiusPageMetaData, setFreemiusPageMeta];
};

export default useFreemiusPageMeta;
