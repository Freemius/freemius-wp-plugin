/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	__experimentalNumberControl as NumberControl,
	ResizableBox,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import PortalEmbed from './components/PortalEmbed';

const MIN_HEIGHT = 300;

function getEditorCanvasWindow() {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	return iframe?.contentWindow ?? window;
}

function getEditorCanvasDocument() {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	return iframe?.contentDocument ?? document;
}

function parseHeight( value, fallback ) {
	const parsed = parseInt( value, 10 );
	return Number.isFinite( parsed ) ? parsed : fallback;
}

export default function Edit( { attributes, setAttributes, toggleSelection } ) {
	const { store_id, public_key, height = MIN_HEIGHT } = attributes;

	const editorPortalCss = useMemo(
		() => ( {
			position: 'relative',
			pointerEvents: 'none',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
		} ),
		[]
	);

	const blockProps = useBlockProps( {
		style: {
			borderStyle: 'none',
		},
	} );

	const borderProps = useBorderProps( attributes );

	const innerStyle = {
		...borderProps.style,
		textAlign: 'center',
		alignContent: 'space-evenly',
		height: height + 'px',
		overflow: 'hidden',
	};

	const hasCredentials = Boolean( store_id && public_key );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Portal Settings', 'freemius' ) }>
					<NumberControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Store ID', 'freemius' ) }
						min={ 1 }
						value={ store_id }
						onChange={ ( value ) =>
							setAttributes( {
								store_id: parseHeight( value, undefined ),
							} )
						}
					/>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Public Key', 'freemius' ) }
						value={ public_key || '' }
						onChange={ ( value ) =>
							setAttributes( { public_key: value } )
						}
					/>
					<NumberControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Height', 'freemius' ) }
						min={ MIN_HEIGHT }
						max={ 9000 }
						value={ height }
						onChange={ ( value ) =>
							setAttributes( {
								height: parseHeight( value, MIN_HEIGHT ),
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<ResizableBox
					className="freemius-portal-resizable-box"
					size={ {
						height,
					} }
					minHeight={ MIN_HEIGHT }
					enable={ {
						top: false,
						right: false,
						bottom: true,
						left: false,
						topRight: false,
						bottomRight: false,
						bottomLeft: false,
						topLeft: false,
					} }
					onResizeStop={ ( event, direction, elt, delta ) => {
						setAttributes( {
							height: height + delta.height,
						} );
						toggleSelection( true );
					} }
					onResizeStart={ () => {
						toggleSelection( false );
					} }
				>
					<div
						className="fs-dashboard-container"
						style={ innerStyle }
					>
						{ hasCredentials ? (
							<PortalEmbed
								storeId={ store_id }
								publicKey={ public_key }
								height={ height }
								allowInIframe
								targetWindow={ getEditorCanvasWindow() }
								targetDocument={ getEditorCanvasDocument() }
								containerCss={ editorPortalCss }
							/>
						) : (
							<div className="freemius-portal-placeholder">
								{ __(
									'Enter Store ID and Public Key in the block sidebar.',
									'freemius'
								) }
							</div>
						) }
					</div>
				</ResizableBox>
			</div>
		</>
	);
}
