/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useLayoutEffect, useMemo, useRef, useState } from '@wordpress/element';
import {
	useBlockProps,
	__experimentalUseBorderProps as useBorderProps,
	InspectorControls,
	useSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	TextControl,
	ExternalLink,
	__experimentalInputControl as InputControl,
	__experimentalUnitControl as UnitControl,
	ResizableBox,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import PortalEmbed from './components/PortalEmbed';
import Icon from './icon';
import {
	normalizePreviewHeight,
	PREVIEW_HEIGHT_UNITS,
	sanitizePreviewHeight,
} from './lib/portal-preview-height';

const MIN_HEIGHT_PX = 300;
const DASHBOARD_STORES_URL = 'https://dashboard.freemius.com/#!/live/stores/';

/**
 * @param {number | undefined} storeId
 * @return {string}
 */
function getPublicKeySettingsUrl( storeId ) {
	if ( ! storeId ) return DASHBOARD_STORES_URL;

	return `https://dashboard.freemius.com/#!/live/stores/${ storeId }/settings/keys/`;
}

/**
 * @param {{
 *   label: string,
 *   linkHref?: string,
 *   linkText?: string,
 * }} props
 */
function FieldLabelWithLink( { label, linkHref, linkText } ) {
	return (
		<span className="freemius-portal-field-label">
			<span>{ label }</span>
			{ linkHref && linkText && (
				<ExternalLink href={ linkHref }>{ linkText }</ExternalLink>
			) }
		</span>
	);
}

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

/**
 * @param {{
 *   store_id?: number,
 *   public_key?: string,
 *   setAttributes: (attrs: Record<string, unknown>) => void,
 * }} props
 */
function PortalCredentialFields( { store_id, public_key, setAttributes } ) {
	return (
		<>
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
				onChange={ ( value ) => setAttributes( { public_key: value } ) }
			/>
		</>
	);
}

/**
 * Placeholder form modeled on core/embed and core/rss blocks.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/embed/embed-placeholder.js
 *
 * @param {{
 *   store_id?: number,
 *   public_key?: string,
 *   setAttributes: (attrs: Record<string, unknown>) => void,
 * }} props
 */
function PortalPlaceholderForm( { store_id, public_key, setAttributes } ) {
	const onSubmit = ( event ) => {
		event.preventDefault();
	};

	return (
		<form
			className="wp-block-freemius-portal__placeholder-form"
			onSubmit={ onSubmit }
		>
			<div className="freemius-portal-placeholder-field">
				<FieldLabelWithLink
					label={ __( 'Store ID', 'freemius' ) }
					linkHref={ DASHBOARD_STORES_URL }
					linkText={ __( 'Dashboard → Stores', 'freemius' ) }
				/>
				<InputControl
					__next40pxDefaultSize
					type="number"
					hideLabelFromVision
					label={ __( 'Store ID', 'freemius' ) }
					placeholder={ __( 'Enter store ID…', 'freemius' ) }
					value={ store_id ? String( store_id ) : '' }
					className="wp-block-freemius-portal__placeholder-input"
					onChange={ ( value ) =>
						setAttributes( {
							store_id: parsePositiveInt( value ?? '' ),
						} )
					}
				/>
			</div>
			<div className="freemius-portal-placeholder-field">
				<FieldLabelWithLink
					label={ __( 'Public Key', 'freemius' ) }
					linkHref={
						store_id
							? getPublicKeySettingsUrl( store_id )
							: undefined
					}
					linkText={
						store_id
							? __( 'Settings → Keys', 'freemius' )
							: undefined
					}
				/>
				<InputControl
					__next40pxDefaultSize
					hideLabelFromVision
					label={ __( 'Public Key', 'freemius' ) }
					placeholder={ __( 'Enter public key…', 'freemius' ) }
					value={ public_key || '' }
					className="wp-block-freemius-portal__placeholder-input"
					onChange={ ( value ) =>
						setAttributes( { public_key: value ?? '' } )
					}
				/>
			</div>
		</form>
	);
}

function usePreviewHeightUnits() {
	const [ spacingUnits ] = useSettings( 'spacing.units' );

	return useMemo( () => {
		if ( ! Array.isArray( spacingUnits ) || spacingUnits.length === 0 )
			return PREVIEW_HEIGHT_UNITS;

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

	const hasCredentials = Boolean( store_id && public_key );

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
		if ( ! hasCredentials ) return;

		const el = previewContainerRef.current;
		if ( ! el ) return;

		setResizableHeightPx( el.offsetHeight );
	}, [ hasCredentials, previewHeight ] );

	const blockProps = useBlockProps( {
		style: {
			borderStyle: 'none',
		},
	} );

	const borderProps = useBorderProps( attributes );

	const previewStyle = {
		...borderProps.style,
		...( hasCredentials && {
			textAlign: 'center',
			alignContent: 'space-evenly',
			height: previewHeight,
			overflow: 'hidden',
		} ),
	};

	const previewContent = hasCredentials ? (
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
		<Placeholder
			className="wp-block-freemius-portal freemius-portal-placeholder"
			icon={ <Icon /> }
			label={ __( 'Freemius Customer Portal', 'freemius' ) }
			instructions={ __(
				'Enter your Freemius store credentials to embed the customer portal.',
				'freemius'
			) }
			isColumnLayout
		>
			<PortalPlaceholderForm
				store_id={ store_id }
				public_key={ public_key }
				setAttributes={ setAttributes }
			/>
		</Placeholder>
	);

	const previewContainer = (
		<div
			ref={ hasCredentials ? previewContainerRef : undefined }
			className={
				hasCredentials
					? 'fs-dashboard-container fs-dashboard-container--preview'
					: 'fs-dashboard-container'
			}
			style={ previewStyle }
		>
			{ previewContent }
		</div>
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Portal Settings', 'freemius' ) }>
					<PortalCredentialFields
						store_id={ store_id }
						public_key={ public_key }
						setAttributes={ setAttributes }
					/>
					{ hasCredentials && (
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
									height: sanitizePreviewHeight(
										value || ''
									),
								} )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ hasCredentials ? (
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
								height: `${
									resizableHeightPx + delta.height
								}px`,
							} );
							toggleSelection( true );
						} }
						onResizeStart={ () => {
							toggleSelection( false );
						} }
					>
						{ previewContainer }
					</ResizableBox>
				) : (
					previewContainer
				) }
			</div>
		</>
	);
}
