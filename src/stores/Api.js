import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const API_STORE = 'freemius/api';

const DEFAULT_STATE = {
	cache: {},
	isLoading: {},
	error: null,
	lastError: null,
	ongoingRequests: {}, // Track ongoing requests to prevent duplicates
};

const actions = {
	setLoading(endpoint, isLoading) {
		return {
			type: 'SET_LOADING',
			endpoint,
			isLoading,
		};
	},

	setCacheData(endpoint, data) {
		return {
			type: 'SET_CACHE_DATA',
			endpoint,
			data,
		};
	},

	setError(error) {
		return {
			type: 'SET_ERROR',
			error,
		};
	},

	clearError() {
		return {
			type: 'CLEAR_ERROR',
		};
	},

	clearCache() {
		return {
			type: 'CLEAR_CACHE',
		};
	},

	setOngoingRequest(cacheKey, promise) {
		return {
			type: 'SET_ONGOING_REQUEST',
			cacheKey,
			promise,
		};
	},

	clearOngoingRequest(cacheKey) {
		return {
			type: 'CLEAR_ONGOING_REQUEST',
			cacheKey,
		};
	},

	/**
	 * Fetch data from Freemius API proxy
	 *
	 * @param {string} endpoint The API endpoint to fetch from
	 * @param {Object} params Query parameters
	 * @param {boolean} forceRefresh Force refresh ignoring cache
	 */
	fetchFromApi(endpoint, params = {}, forceRefresh = false) {
		return async ({ dispatch, select }) => {
			const cacheKey = generateCacheKey(endpoint, params);

			// Return cached data if available and not forcing refresh
			if (!forceRefresh) {
				const cachedData = select.getCachedData(cacheKey);
				if (cachedData) {
					return cachedData;
				}
			}

			// Check if there's already an ongoing request for this cache key
			const ongoingRequest = select.getOngoingRequest(cacheKey);
			if (ongoingRequest && !forceRefresh) {
				// Return the existing promise to prevent duplicate requests
				return ongoingRequest;
			}

			dispatch.setLoading(cacheKey, true);
			dispatch.clearError();

			// Create the request promise
			const requestPromise = (async () => {
				try {
					// Build query string for params
					const queryString = new URLSearchParams(params).toString();
					const path = `/freemius/v1/proxy/${endpoint}${
						queryString ? `?${queryString}` : ''
					}`;

					const response = await apiFetch({
						path,
						method: 'GET',
					});

					dispatch.setCacheData(cacheKey, response);
					return response;
				} catch (error) {
					console.error('Freemius API fetch error:', error);
					dispatch.setError(error);
					throw error;
				} finally {
					dispatch.setLoading(cacheKey, false);
					dispatch.clearOngoingRequest(cacheKey);
				}
			})();

			// Store the ongoing request
			dispatch.setOngoingRequest(cacheKey, requestPromise);

			return requestPromise;
		};
	},

	/**
	 * Post data to Freemius API proxy
	 *
	 * @param {string} endpoint The API endpoint
	 * @param {Object} data Data to post
	 */
	postToApi(endpoint, data = {}) {
		return async ({ dispatch, select }) => {
			const requestId = generateCacheKey(endpoint, data);

			// Check if there's already an ongoing request for this operation
			const ongoingRequest = select.getOngoingRequest(requestId);
			if (ongoingRequest) {
				// Return the existing promise to prevent duplicate requests
				return ongoingRequest;
			}

			dispatch.setLoading(requestId, true);
			dispatch.clearError();

			// Create the request promise
			const requestPromise = (async () => {
				try {
					const response = await apiFetch({
						path: `/freemius/v1/proxy/${endpoint}`,
						method: 'POST',
						data,
					});

					// Clear cache after successful write operation
					dispatch.clearCache();

					return response;
				} catch (error) {
					console.error('Freemius API post error:', error);
					dispatch.setError(error);
					throw error;
				} finally {
					dispatch.setLoading(requestId, false);
					dispatch.clearOngoingRequest(requestId);
				}
			})();

			// Store the ongoing request
			dispatch.setOngoingRequest(requestId, requestPromise);

			return requestPromise;
		};
	},

	/**
	 * Put data to Freemius API proxy
	 *
	 * @param {string} endpoint The API endpoint
	 * @param {Object} data Data to put
	 */
	putToApi(endpoint, data = {}) {
		return async ({ dispatch, select }) => {
			const requestId = generateCacheKey(endpoint, data);

			// Check if there's already an ongoing request for this operation
			const ongoingRequest = select.getOngoingRequest(requestId);
			if (ongoingRequest) {
				// Return the existing promise to prevent duplicate requests
				return ongoingRequest;
			}

			dispatch.setLoading(requestId, true);
			dispatch.clearError();

			// Create the request promise
			const requestPromise = (async () => {
				try {
					const response = await apiFetch({
						path: `/freemius/v1/proxy/${endpoint}`,
						method: 'PUT',
						data,
					});

					// Clear cache after successful write operation
					dispatch.clearCache();

					return response;
				} catch (error) {
					console.error('Freemius API put error:', error);
					dispatch.setError(error);
					throw error;
				} finally {
					dispatch.setLoading(requestId, false);
					dispatch.clearOngoingRequest(requestId);
				}
			})();

			// Store the ongoing request
			dispatch.setOngoingRequest(requestId, requestPromise);

			return requestPromise;
		};
	},

	/**
	 * Delete from Freemius API proxy
	 *
	 * @param {string} endpoint The API endpoint
	 */
	deleteFromApi(endpoint) {
		return async ({ dispatch, select }) => {
			const requestId = endpoint;

			// Check if there's already an ongoing request for this operation
			const ongoingRequest = select.getOngoingRequest(requestId);
			if (ongoingRequest) {
				// Return the existing promise to prevent duplicate requests
				return ongoingRequest;
			}

			dispatch.setLoading(requestId, true);
			dispatch.clearError();

			// Create the request promise
			const requestPromise = (async () => {
				try {
					const response = await apiFetch({
						path: `/freemius/v1/proxy/${endpoint}`,
						method: 'DELETE',
					});

					// Clear cache after successful write operation
					dispatch.clearCache();

					return response;
				} catch (error) {
					console.error('Freemius API delete error:', error);
					dispatch.setError(error);
					throw error;
				} finally {
					dispatch.setLoading(requestId, false);
					dispatch.clearOngoingRequest(requestId);
				}
			})();

			// Store the ongoing request
			dispatch.setOngoingRequest(requestId, requestPromise);

			return requestPromise;
		};
	},

	/**
	 * Clear server-side cache
	 */
	clearServerCache() {
		return async ({ dispatch }) => {
			dispatch.setLoading('cache-clear', true);

			try {
				await apiFetch({
					path: '/freemius/v1/cache/clear',
					method: 'POST',
				});

				// Also clear local cache
				dispatch.clearCache();
			} catch (error) {
				console.error('Cache clear error:', error);
				dispatch.setError(error);
				throw error;
			} finally {
				dispatch.setLoading('cache-clear', false);
			}
		};
	},
};

const store = createReduxStore(API_STORE, {
	reducer(state = DEFAULT_STATE, action) {
		switch (action.type) {
			case 'SET_LOADING':
				return {
					...state,
					isLoading: {
						...state.isLoading,
						[action.endpoint]: action.isLoading,
					},
				};

			case 'SET_CACHE_DATA':
				return {
					...state,
					cache: {
						...state.cache,
						[action.endpoint]: {
							data: action.data,
							timestamp: Date.now(),
						},
					},
				};

			case 'SET_ERROR':
				return {
					...state,
					error: action.error,
					lastError: action.error,
				};

			case 'CLEAR_ERROR':
				return {
					...state,
					error: null,
				};

			case 'CLEAR_CACHE':
				return {
					...state,
					cache: {},
					ongoingRequests: {}, // Also clear ongoing requests when clearing cache
				};

			case 'SET_ONGOING_REQUEST':
				return {
					...state,
					ongoingRequests: {
						...state.ongoingRequests,
						[action.cacheKey]: action.promise,
					},
				};

			case 'CLEAR_ONGOING_REQUEST':
				const newOngoingRequests = { ...state.ongoingRequests };
				delete newOngoingRequests[action.cacheKey];
				return {
					...state,
					ongoingRequests: newOngoingRequests,
				};

			default:
				return state;
		}
	},

	actions,

	selectors: {
		/**
		 * Get cached data for a specific cache key
		 *
		 * @param {Object} state Store state
		 * @param {string} cacheKey The cache key
		 * @return {*} Cached data or null
		 */
		getCachedData(state, cacheKey) {
			const cached = state.cache[cacheKey];
			if (!cached) {
				return null;
			}

			// Check if cache is still valid (1 hour = 3600000 ms)
			const isExpired = Date.now() - cached.timestamp > 3600000;
			if (isExpired) {
				return null;
			}

			return cached.data;
		},

		/**
		 * Check if a request is loading
		 *
		 * @param {Object} state Store state
		 * @param {string} endpoint The endpoint identifier
		 * @return {boolean} Whether the request is loading
		 */
		isLoading(state, endpoint) {
			return state.isLoading[endpoint] || false;
		},

		/**
		 * Check if any request is loading
		 *
		 * @param {Object} state Store state
		 * @return {boolean} Whether any request is loading
		 */
		isAnyLoading(state) {
			return Object.values(state.isLoading).some((loading) => loading);
		},

		/**
		 * Get current error
		 *
		 * @param {Object} state Store state
		 * @return {*} Current error or null
		 */
		getError(state) {
			return state.error;
		},

		/**
		 * Get last error (persists until next error)
		 *
		 * @param {Object} state Store state
		 * @return {*} Last error or null
		 */
		getLastError(state) {
			return state.lastError;
		},

		/**
		 * Get all cached data
		 *
		 * @param {Object} state Store state
		 * @return {Object} All cached data
		 */
		getAllCachedData(state) {
			const result = {};
			Object.keys(state.cache).forEach((key) => {
				const cached = state.cache[key];
				const isExpired = Date.now() - cached.timestamp > 3600000;
				if (!isExpired) {
					result[key] = cached.data;
				}
			});
			return result;
		},

		/**
		 * Get ongoing request for a specific cache key
		 *
		 * @param {Object} state Store state
		 * @param {string} cacheKey The cache key
		 * @return {Promise|null} Ongoing request promise or null
		 */
		getOngoingRequest(state, cacheKey) {
			return state.ongoingRequests[cacheKey] || null;
		},
	},
});

/**
 * Generate a cache key for endpoint and parameters
 *
 * @param {string} endpoint API endpoint
 * @param {Object} params Parameters
 * @return {string} Cache key
 */
function generateCacheKey(endpoint, params = {}) {
	const normalizedParams = Object.keys(params)
		.sort()
		.reduce((result, key) => {
			result[key] = params[key];
			return result;
		}, {});

	return `${endpoint}:${JSON.stringify(normalizedParams)}`;
}

register(store);

export { API_STORE };
