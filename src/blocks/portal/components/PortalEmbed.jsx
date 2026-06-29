/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { usePortalEmbed } from '../hooks/usePortalEmbed';
import PortalLoader from './PortalLoader';

/**
 * @param {{
 *   storeId: number,
 *   publicKey: string,
 *   height: number,
 *   allowInIframe?: boolean,
 *   targetWindow?: Window,
 *   targetDocument?: Document,
 *   baseUrl?: string,
 *   containerCss?: Record<string, string>,
 *   onLoad?: () => void,
 *   onLogin?: (param: unknown) => void,
 *   onLogout?: (param: unknown) => void,
 * }} props
 */
export default function PortalEmbed( {
	storeId,
	publicKey,
	height,
	allowInIframe = false,
	targetWindow,
	targetDocument,
	baseUrl,
	containerCss,
	onLoad,
	onLogin,
	onLogout,
} ) {
	const containerRef = useRef( null );

	const { isLoading, error } = usePortalEmbed( {
		storeId,
		publicKey,
		height,
		allowInIframe,
		targetWindow,
		targetDocument,
		baseUrl,
		containerRef,
		onLoad,
		onLogin,
		onLogout,
	} );

	return (
		<div
			className="freemius-portal-root fs_dashboard_container"
			style={ {
				width: '100%',
				minHeight: height,
				position: 'relative',
				overflow: 'hidden',
				...( containerCss || {} ),
			} }
		>
			<div
				ref={ containerRef }
				className="freemius-portal-iframe-host"
				style={ {
					width: '100%',
					height: '100%',
					minHeight: height,
					position: 'relative',
				} }
			/>
			{ isLoading && <PortalLoader /> }
			{ error && (
				<div className="freemius-portal-error" role="alert">
					{ error }
				</div>
			) }
		</div>
	);
}
