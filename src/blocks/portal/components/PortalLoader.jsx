/**
 * WordPress dependencies
 */
import { MAX_ZINDEX } from '../lib/portal-utils';

export default function PortalLoader() {
	return (
		<div
			className="freemius-portal-loader-overlay"
			style={ {
				position: 'absolute',
				zIndex: MAX_ZINDEX,
				width: '100%',
				height: '100%',
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
				textAlign: 'left',
				background: 'rgba(0,0,0,0.6)',
			} }
		>
			<svg
				width="52"
				height="52"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
				role="img"
				aria-label="Loading animation"
				style={ {
					position: 'absolute',
					top: '40%',
					left: '50%',
					marginLeft: -26,
					display: 'block',
					background: '#fff',
					padding: 10,
					borderRadius: '50%',
					boxSizing: 'border-box',
					boxShadow: '2px 2px 2px rgba(0,0,0,0.1)',
					color: 'var(--fs-spinner-color, #6753FF)',
				} }
			>
				<path
					d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
					opacity=".25"
				/>
				<path
					d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
					fill="currentColor"
				>
					<animateTransform
						attributeName="transform"
						type="rotate"
						dur="0.75s"
						values="0 12 12;360 12 12"
						repeatCount="indefinite"
					/>
				</path>
			</svg>
		</div>
	);
}
