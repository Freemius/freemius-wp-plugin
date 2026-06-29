/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useLayoutEffect, useMemo, useRef, useState } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	InspectorControls,
	useSetting,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	__experimentalUnitControl as UnitControl,
	ResizableBox,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import PortalEmbed from './components/PortalEmbed';
import {
	normalizePreviewHeight,
	PREVIEW_HEIGHT_UNITS,
	sanitizePreviewHeight,
} from './lib/portal-preview-height';

const MIN_HEIGHT_PX = 300;

function getEditorCanvasWindow() {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	return iframe?.contentWindow ?? window;
}

function getEditorCanvasDocument() {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	return iframe?.contentDocument ?? document;
}

function parsePositiveInt( value ) {
	const parsed = parseInt( value, 10 );
	return Number.isFinite( parsed ) ? parsed : undefined;
}

function usePreviewHeightUnits() {
	const spacingUnits = useSetting( 'spacing.units' );

	return useMemo( () => {
		if ( ! Array.isArray( spacingUnits ) || spacingUnits.length === 0 ) {
			return PREVIEW_HEIGHT_UNITS;
		}

		return spacingUnits.map( ( unit ) => ( {
			value: unit,
			label: unit,
			...( unit === 'px' ? { default: 0 } : {} ),
		} ) );
	}, [ spacingUnits ] );
}

export default function Edit( { attributes, setAttributes, toggleSelection } ) {
	const { store_id, public_key, height } = attributes;
	const previewHeight = normalizePreviewHeight( height );
	const previewHeightUnits = usePreviewHeightUnits();

	const previewContainerRef = useRef( null );
	const [ resizableHeightPx, setResizableHeightPx ] =
		useState( MIN_HEIGHT_PX );

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

	useLayoutEffect( () => {
		const el = previewContainerRef.current;
		if ( ! el ) {
			return;
		}

		setResizableHeightPx( el.offsetHeight );
	}, [ previewHeight ] );

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
		height: previewHeight,
		overflow: 'hidden',
	};

	const hasCredentials = Boolean( store_id && public_key );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Portal Settings', 'freemius' ) }>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Store ID', 'freemius' ) }
						type="number"
						min={ 1 }
						value={ store_id ? String( store_id ) : '' }
						onChange={ ( value ) =>
							setAttributes( {
								store_id: parsePositiveInt( value ),
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
					<UnitControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Preview height', 'freemius' ) }
						value={ previewHeight }
						units={ previewHeightUnits }
						help={ __(
							'Editor preview only. The live portal resizes to fit its content.',
							'freemius'
						) }
						onChange={ ( value ) =>
							setAttributes( {
								height: sanitizePreviewHeight( value || '' ),
							} )
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<ResizableBox
					className="freemius-portal-resizable-box"
					size={ {
						height: resizableHeightPx,
					} }
					minHeight={ MIN_HEIGHT_PX }
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
							height: `${ resizableHeightPx + delta.height }px`,
						} );
						toggleSelection( true );
					} }
					onResizeStart={ () => {
						toggleSelection( false );
					} }
				>
					<div
						ref={ previewContainerRef }
						className="fs-dashboard-container"
						style={ innerStyle }
					>
						{ hasCredentials ? (
							<PortalEmbed
								storeId={ store_id }
								publicKey={ public_key }
								height={ previewHeight }
								autoHeight={ false }
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
