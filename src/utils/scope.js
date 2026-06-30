/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */

export const MODIFIER_QUERY_KEYS = [
	'currency',
	'billing_cycle',
	'licenses',
	'plan_id',
];
export const SCOPE_QUERY_KEYS = [ 'coupon' ];
export const QUERY_KEYS = [ ...MODIFIER_QUERY_KEYS, ...SCOPE_QUERY_KEYS ];

const BILLING_CYCLES = [ 'monthly', 'annual', 'lifetime' ];

const validatedOverridesCache = new Map();
let queryModifiersApplied = false;

/**
 * Parse supported query parameters from the current URL.
 *
 * @return {Object} Raw query parameter values keyed by param name.
 */
export function parseQueryParams() {
	const params = new URLSearchParams( window.location.search );
	const raw = {};

	QUERY_KEYS.forEach( ( key ) => {
		if ( params.has( key ) ) raw[ key ] = params.get( key );
	} );

	return raw;
}

/**
 * Whether query overrides are enabled for an element's scope chain.
 *
 * @param {HTMLElement} element - The element to check.
 * @return {boolean} True when this scope or an ancestor opted in.
 */
export function isQueryOverridesEnabled( element ) {
	let el = element?.closest( '[data-freemius-scope]' );

	while ( el ) {
		if ( el.dataset.freemiusQueryOverrides === 'true' ) return true;
		el = el.parentElement?.closest( '[data-freemius-scope]' );
	}

	return false;
}

/**
 * Read the pricing matrix for a product from the page.
 *
 * @param {string|number} productId - The product ID.
 * @return {Object|null} The pricing matrix or null.
 */
export function getMatrix( productId ) {
	const allMatrix = document.querySelectorAll( '.freemius-matrix-data' );

	for ( const m of allMatrix ) {
		if ( m.dataset.freemiusProductId == productId )
			return JSON.parse( m.textContent );
	}

	if ( allMatrix.length > 0 ) return JSON.parse( allMatrix[ 0 ].textContent );

	return null;
}

/**
 * Resolve the effective plan ID from scope data and matrix.
 *
 * @param {Object} scope  - The scope data.
 * @param {Object} matrix - The pricing matrix.
 * @return {string|undefined} The plan ID.
 */
function resolvePlanId( scope, matrix ) {
	return (
		scope.plan_id ??
		Object.values( matrix ).find( ( plan ) => plan.pricing !== null )?.id
	);
}

/**
 * Normalize a licenses query value to a matrix key.
 *
 * @param {string} value - The raw licenses value.
 * @return {string} The normalized licenses key.
 */
function normalizeLicensesKey( value ) {
	const normalized = String( value ).toLowerCase();

	if (
		normalized === '0' ||
		normalized === 'unlimited' ||
		normalized === 'null' ||
		normalized === ''
	)
		return 'unlimited';

	return String( parseInt( normalized, 10 ) );
}

/**
 * Validate matrix-backed modifier query parameters.
 *
 * @param {Object} raw            - Raw query params.
 * @param {Object} effectiveScope - The resolved scope before query overrides.
 * @param {Object} matrix         - The pricing matrix.
 * @return {Object} Validated modifier overrides.
 */
export function validateModifierParams( raw, effectiveScope, matrix ) {
	const validated = {};
	const scope = { ...effectiveScope };

	if ( raw.plan_id !== undefined && raw.plan_id !== null ) {
		const planId = String( raw.plan_id );

		if ( matrix[ planId ] ) {
			validated.plan_id = planId;
			scope.plan_id = planId;
		}
	}

	if ( raw.currency !== undefined && raw.currency !== null ) {
		const currency = String( raw.currency ).toLowerCase();
		const planId = resolvePlanId( scope, matrix );

		if ( matrix[ planId ]?.pricing?.[ currency ] ) {
			validated.currency = currency;
			scope.currency = currency;
		}
	}

	if ( raw.billing_cycle !== undefined && raw.billing_cycle !== null ) {
		const billingCycle = String( raw.billing_cycle ).toLowerCase();

		if ( BILLING_CYCLES.includes( billingCycle ) ) {
			const planId = resolvePlanId( scope, matrix );
			const currency = String( scope.currency || 'usd' ).toLowerCase();
			const licenses = normalizeLicensesKey( scope.licenses ?? '1' );
			const price =
				matrix[ planId ]?.pricing?.[ currency ]?.[ billingCycle ]?.[
					licenses
				];

			if ( price !== undefined && price !== null ) {
				validated.billing_cycle = billingCycle;
				scope.billing_cycle = billingCycle;
			}
		}
	}

	if ( raw.licenses !== undefined && raw.licenses !== null ) {
		const licenses = normalizeLicensesKey( raw.licenses );
		const planId = resolvePlanId( scope, matrix );
		const currency = String( scope.currency || 'usd' ).toLowerCase();
		const billingCycle = scope.billing_cycle || 'annual';
		const price =
			matrix[ planId ]?.pricing?.[ currency ]?.[ billingCycle ]?.[
				licenses
			];

		if ( price !== undefined && price !== null ) {
			validated.licenses = licenses;
		}
	}

	return validated;
}

/**
 * Normalize scope/checkout query parameters (e.g. coupon).
 *
 * @param {Object} raw - Raw query params.
 * @return {Object} Normalized scope overrides.
 */
export function normalizeScopeParams( raw ) {
	const normalized = {};

	if ( raw.coupon !== undefined && raw.coupon !== null ) {
		const coupon = String( raw.coupon ).trim();

		if ( coupon ) normalized.coupon = coupon;
	}

	return normalized;
}

/**
 * Get validated query overrides for a product, with caching.
 *
 * @param {Object} effectiveScope - The resolved scope before query overrides.
 * @return {Object} Validated overrides.
 */
function getValidatedOverrides( effectiveScope ) {
	const productId = effectiveScope?.product_id;

	if ( ! productId ) return {};

	if ( validatedOverridesCache.has( productId ) )
		return validatedOverridesCache.get( productId );

	const raw = parseQueryParams();

	if ( Object.keys( raw ).length === 0 ) return {};

	const matrix = getMatrix( productId );
	if ( ! matrix ) return {};

	const overrides = {
		...validateModifierParams( raw, effectiveScope, matrix ),
		...normalizeScopeParams( raw ),
	};

	validatedOverridesCache.set( productId, overrides );

	return overrides;
}

/**
 * Build scope data from a scope broker element and its ancestors.
 *
 * @param {HTMLElement} scopeEl - The scope broker element.
 * @return {Object} The merged scope data without query overrides.
 */
function getScopeDataFromScopeElement( scopeEl ) {
	const data = JSON.parse( scopeEl.dataset.freemiusScope || '{}' );
	const parent = scopeEl.parentElement?.closest( '[data-freemius-scope]' );

	if ( parent ) return { ...getScopeDataFromScopeElement( parent ), ...data };

	const globalScope = document.querySelector( '.freemius-global-scope-data' );

	if ( ! globalScope ) return data;

	const globalScopeData = JSON.parse( globalScope.textContent );

	return { ...globalScopeData, ...data };
}

/**
 * Get the scope data from an element and all its ancestors.
 *
 * @param {HTMLElement} element - The element to get the scope data from.
 * @return {Object} The scope data.
 */
export function getScopeData( element ) {
	const scope = element?.closest( '[data-freemius-scope]' );

	if ( ! scope ) return {};

	const base = getScopeDataFromScopeElement( scope );

	if ( ! isQueryOverridesEnabled( element ) ) return base;

	return { ...base, ...getValidatedOverrides( base ) };
}

/**
 * Get the mapping content based on the mapping type and data.
 *
 * @param {Object} scopeData   - The scope data.
 * @param {Object} mappingData - The mapping data.
 * @return {string} The mapping content.
 */
export function getMappingContent( scopeData, mappingData ) {
	const matrix = getMatrix( scopeData.product_id );

	if ( ! matrix ) return '';

	const plan_id =
		scopeData.plan_id ??
		Object.values( matrix ).find( ( plan ) => plan.pricing !== null )?.id;

	const sd = {
		currency: 'usd',
		licenses: '1',
		billing_cycle: 'annual',
		plan_id,
		...scopeData,
	};

	const md = {
		field: null,
		prefix: '',
		suffix: '',
		currency_symbol: 'show',
		...mappingData,
	};

	let content = '';

	switch ( md.field ) {
		case 'billing_cycle':
			content = md.labels?.[ sd.billing_cycle ] ?? sd.billing_cycle;
			break;
		case 'licenses':
			content = md.labels?.[ sd.licenses ] ?? sd.licenses;
			break;
		case 'price':
			content =
				matrix[ sd.plan_id ]?.pricing?.[ sd.currency ]?.[
					sd.billing_cycle
				]?.[ sd.licenses || 'unlimited' ] ?? 0;

			if ( ! content && matrix[ sd.plan_id ]?.pricing !== null ) {
				content = '-';
				break;
			}

			{
				const symbol = md.currency_symbol;

				content = new Intl.NumberFormat( 'en-US', {
					style: symbol !== 'hide' ? 'currency' : 'decimal',
					currency: symbol !== 'hide' ? sd.currency : undefined,
					minimumFractionDigits: 0,
				} ).format( content );

				if ( symbol === 'symbol' )
					content = content.replace( /[\d\s.,]/g, '' ).trim();
			}
			break;
		default:
			content = matrix[ sd.plan_id ]?.[ md.field ] ?? '';
			break;
	}

	return md.prefix + content + md.suffix;
}

/**
 * Sync modifier UI state for a single modifier container.
 *
 * @param {HTMLElement} modifierContainer - The modifier block container.
 * @param {string}      type              - The modifier type.
 * @param {string}      optionId          - The active option ID.
 */
function syncModifierUI( modifierContainer, type, optionId ) {
	if ( modifierContainer.dataset.freemiusModifierType !== type ) return;

	const buttons = modifierContainer.querySelectorAll( '[data-wp-on--click]' );

	buttons.forEach( ( button ) => {
		if ( button.dataset.optionId == optionId )
			button.classList.add( 'is-active' );
		else button.classList.remove( 'is-active' );
	} );

	const select = modifierContainer.querySelector( 'select' );
	if ( select ) select.value = optionId;
}

/**
 * Refresh mapped content nodes within a scope element.
 *
 * @param {HTMLElement} scopeEl - The scope broker element.
 */
function refreshMappings( scopeEl ) {
	const mappings = scopeEl.querySelectorAll( '.has-freemius-mapping' );

	mappings.forEach( ( mapping ) => {
		const scopeData = getScopeData( mapping );
		const mappingData = JSON.parse(
			mapping.dataset.freemiusMapping || '{}'
		);
		const mappingContent = getMappingContent( scopeData, mappingData );

		if ( mapping.classList.contains( 'wp-block-button' ) ) {
			const button = mapping.querySelector( '.wp-element-button' );
			if ( button ) button.innerHTML = mappingContent;
		} else {
			mapping.innerHTML = mappingContent;
		}
	} );
}

/**
 * Apply scope overrides to a broker element and refresh dependent UI.
 *
 * @param {HTMLElement} scopeEl   - The scope broker element.
 * @param {Object}      overrides - Key/value overrides to merge into scope.
 */
export function applyScopeOverrides( scopeEl, overrides ) {
	if ( ! scopeEl || ! Object.keys( overrides ).length ) return;

	const scopeData = JSON.parse( scopeEl.dataset.freemiusScope || '{}' );
	const newScopeData = { ...scopeData, ...overrides };

	scopeEl.setAttribute(
		'data-freemius-scope',
		JSON.stringify( newScopeData )
	);

	refreshMappings( scopeEl );

	Object.keys( overrides ).forEach( ( key ) => {
		if ( ! MODIFIER_QUERY_KEYS.includes( key ) ) return;

		scopeEl
			.querySelectorAll( '[data-freemius-modifier-type]' )
			.forEach( ( modifierContainer ) => {
				syncModifierUI( modifierContainer, key, overrides[ key ] );
			} );
	} );
}

/**
 * Apply validated URL query overrides to all opted-in scopes on the page.
 */
export function applyQueryModifiers() {
	if ( queryModifiersApplied ) return;

	const raw = parseQueryParams();

	if ( Object.keys( raw ).length === 0 ) return;

	document
		.querySelectorAll( '[data-freemius-scope]' )
		.forEach( ( scopeEl ) => {
			if ( ! isQueryOverridesEnabled( scopeEl ) ) return;

			const base = getScopeDataFromScopeElement( scopeEl );
			const matrix = getMatrix( base.product_id );

			if ( ! matrix ) return;

			const overrides = {
				...validateModifierParams( raw, base, matrix ),
				...normalizeScopeParams( raw ),
			};

			applyScopeOverrides( scopeEl, overrides );
		} );

	queryModifiersApplied = true;
}
