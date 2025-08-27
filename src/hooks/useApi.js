import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { API_STORE } from '../stores';

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

/**
 * Custom hook for interacting with the Freemius API
 *
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} options - Configuration options
 * @param {Object} options.params - Query parameters for GET requests
 * @param {boolean} options.immediate - Whether to fetch immediately on mount
 * @param {boolean} options.enabled - Whether the hook should be active
 * @param {number} options.refetchInterval - Auto-refetch interval in milliseconds
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Base delay between retries in milliseconds (default: 1000)
 * @param {function} options.onSuccess - Callback for successful requests
 * @param {function} options.onError - Callback for failed requests
 * @return {Object} Hook return object
 */
export function useApi(endpoint, options = {}) {
	const {
		params = {},
		immediate = true,
		enabled = true,
		refetchInterval = null,
		maxRetries = 3,
		retryDelay = 1000,
		onSuccess = null,
		onError = null,
	} = options;

	// State
	const [data, setData] = useState(null);
	const [localError, setLocalError] = useState(null);
	const [lastFetchTime, setLastFetchTime] = useState(null);
	const [retryCount, setRetryCount] = useState(0);
	const [hasErrored, setHasErrored] = useState(false);
	const [isRetrying, setIsRetrying] = useState(false);

	// Store actions and selectors
	const {
		fetchFromApi,
		postToApi,
		putToApi,
		deleteFromApi,
		clearError,
		clearCache,
		clearServerCache,
		resetApiHealth,
	} = useDispatch(API_STORE);

	const cacheKey = useMemo(
		() => generateCacheKey(endpoint, params),
		[endpoint, params]
	);

	const {
		isLoading,
		error: storeError,
		cachedData,
		isAnyLoading,
		apiHealth,
		isApiAvailable,
	} = useSelect(
		(select) => ({
			isLoading: select(API_STORE).isLoading(cacheKey),
			error: select(API_STORE).getError(),
			cachedData: select(API_STORE).getCachedData(cacheKey),
			isAnyLoading: select(API_STORE).isAnyLoading(),
			apiHealth: select(API_STORE).getApiHealth(),
			isApiAvailable: select(API_STORE).isApiAvailable(),
		}),
		[cacheKey]
	);

	// Combined error (local or store)
	const error = localError || storeError;

	/**
	 * Reset error state and retry counters
	 */
	const resetErrorState = useCallback(() => {
		setLocalError(null);
		setRetryCount(0);
		setHasErrored(false);
		setIsRetrying(false);
		clearError();
	}, [clearError]);

	/**
	 * Fetch data from the API
	 */
	const refetch = useCallback(
		async (forceRefresh = false, isRetryAttempt = false) => {
			if (!enabled || !endpoint) return;

			// Check if API is blocked and return early if so
			if (apiHealth.blockUntil && Date.now() < apiHealth.blockUntil) {
				const blockError = new Error(
					'API is temporarily blocked due to consecutive failures'
				);
				blockError.code = 'API_BLOCKED';
				setLocalError(blockError);
				setHasErrored(true);
				setIsRetrying(false);

				if (onError) {
					onError(blockError);
				}
				return;
			}

			// Don't retry if we've exceeded max retries and this is a retry attempt
			if (isRetryAttempt && retryCount >= maxRetries) {
				setIsRetrying(false);
				return;
			}

			// Reset error state if this is not a retry attempt
			if (!isRetryAttempt) {
				resetErrorState();
			}

			try {
				const response = await fetchFromApi(endpoint, params, forceRefresh);
				setData(response);
				setLastFetchTime(Date.now());

				// Reset error state on success
				setRetryCount(0);
				setHasErrored(false);
				setIsRetrying(false);

				if (onSuccess) {
					onSuccess(response);
				}

				return response;
			} catch (err) {
				setLocalError(err);
				setHasErrored(true);

				// Don't retry if API is blocked
				if (err.code === 'API_BLOCKED') {
					setIsRetrying(false);
					if (onError) {
						onError(err);
					}
					return;
				}

				// Handle retry logic for other errors
				if (isRetryAttempt) {
					setRetryCount((prev) => prev + 1);

					// If we haven't exceeded max retries, schedule another retry
					if (retryCount + 1 < maxRetries) {
						setIsRetrying(true);
						const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff

						setTimeout(() => {
							refetch(forceRefresh, true);
						}, delay);
					} else {
						setIsRetrying(false);
					}
				}

				if (onError) {
					onError(err);
				}

				// Don't throw for API_BLOCKED to prevent uncaught promise rejections
				if (err.code !== 'API_BLOCKED') {
					throw err;
				}
			}
		},
		[
			enabled,
			endpoint,
			params,
			fetchFromApi,
			onSuccess,
			onError,
			maxRetries,
			retryCount,
			retryDelay,
			resetErrorState,
			apiHealth,
		]
	);

	/**
	 * POST request
	 */
	const post = useCallback(
		async (data = {}) => {
			if (!enabled || !endpoint) return;

			resetErrorState();

			try {
				const response = await postToApi(endpoint, data);
				setLastFetchTime(Date.now());

				if (onSuccess) {
					onSuccess(response);
				}

				return response;
			} catch (err) {
				setLocalError(err);
				setHasErrored(true);

				if (onError) {
					onError(err);
				}

				throw err;
			}
		},
		[enabled, endpoint, postToApi, onSuccess, onError, resetErrorState]
	);

	/**
	 * PUT request
	 */
	const put = useCallback(
		async (data = {}) => {
			if (!enabled || !endpoint) return;

			resetErrorState();

			try {
				const response = await putToApi(endpoint, data);
				setLastFetchTime(Date.now());

				if (onSuccess) {
					onSuccess(response);
				}

				return response;
			} catch (err) {
				setLocalError(err);
				setHasErrored(true);

				if (onError) {
					onError(err);
				}

				throw err;
			}
		},
		[enabled, endpoint, putToApi, onSuccess, onError, resetErrorState]
	);

	/**
	 * DELETE request
	 */
	const remove = useCallback(async () => {
		if (!enabled || !endpoint) return;

		resetErrorState();

		try {
			const response = await deleteFromApi(endpoint);
			setLastFetchTime(Date.now());

			if (onSuccess) {
				onSuccess(response);
			}

			return response;
		} catch (err) {
			setLocalError(err);
			setHasErrored(true);

			if (onError) {
				onError(err);
			}

			throw err;
		}
	}, [enabled, endpoint, deleteFromApi, onSuccess, onError, resetErrorState]);

	/**
	 * External refetch function (without isRetryAttempt parameter)
	 */
	const externalRefetch = useCallback(
		(forceRefresh = false) => refetch(forceRefresh, false),
		[refetch]
	);

	// Set data from cache if available
	useEffect(() => {
		if (cachedData && !data) {
			setData(cachedData);
		}
	}, [cachedData, data]);

	// Immediate fetch on mount
	useEffect(() => {
		if (
			immediate &&
			enabled &&
			endpoint &&
			!data &&
			!hasErrored &&
			isApiAvailable
		) {
			externalRefetch();
		}
	}, [
		immediate,
		enabled,
		endpoint,
		data,
		hasErrored,
		isApiAvailable,
		externalRefetch,
	]);

	// Auto-refetch interval
	useEffect(() => {
		if (!refetchInterval || !enabled || !endpoint) return;

		const interval = setInterval(() => {
			// Only refetch if not loading, not retrying, no persistent errors, and API is available
			if (!isLoading && !isRetrying && !hasErrored && isApiAvailable) {
				externalRefetch(true); // Force refresh on interval
			}
		}, refetchInterval);

		return () => clearInterval(interval);
	}, [
		refetchInterval,
		enabled,
		endpoint,
		isLoading,
		isRetrying,
		hasErrored,
		isApiAvailable,
		externalRefetch,
	]);

	// Return hook interface
	return {
		// Data and state
		data,
		isLoading: endpoint ? (isLoading || !data) : false,
		error,
		lastFetchTime,
		isAnyLoading,
		retryCount,
		hasErrored,
		isRetrying,
		isApiAvailable,
		apiHealth,

		// Actions
		refetch: externalRefetch,
		post,
		put,
		remove: remove,
		clearError: resetErrorState,
		clearCache,
		clearServerCache,
		resetApiHealth,

		// Utilities
		cacheKey,
		endpoint,
		params,
	};
}

/**
 * Specialized hook for GET requests with automatic fetching
 *
 * @param {string} endpoint - The API endpoint
 * @param {Object} params - Query parameters
 * @param {Object} options - Additional options
 * @return {Object} Hook return object
 */
export function useApiGet(endpoint, params = {}, options = {}) {
	return useApi(endpoint, {
		params,
		immediate: true,
		...options,
	});
}

/**
 * Specialized hook for mutations (POST, PUT, DELETE)
 *
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Additional options
 * @return {Object} Hook return object with mutation functions
 */
export function useApiMutation(endpoint, options = {}) {
	const hook = useApi(endpoint, {
		immediate: false,
		...options,
	});

	return {
		...hook,
		// Alias for clarity in mutations
		mutate: hook.post,
		mutatePost: hook.post,
		mutatePut: hook.put,
		mutateDelete: hook.remove,
	};
}

/**
 * Hook for managing multiple API endpoints
 *
 * @param {Object} endpoints - Object with endpoint configurations
 * @return {Object} Object with hook results for each endpoint
 */
export function useMultipleApi(endpoints) {
	const results = {};

	Object.keys(endpoints).forEach((key) => {
		const config = endpoints[key];
		const { endpoint, ...options } = config;

		// eslint-disable-next-line react-hooks/rules-of-hooks
		results[key] = useApi(endpoint, options);
	});

	return results;
}

/**
 * Hook for paginated API results
 *
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Items per page
 * @param {number} options.initialPage - Starting page
 * @return {Object} Hook return object with pagination utilities
 */
export function useApiPagination(endpoint, options = {}) {
	const { pageSize = 20, initialPage = 1, ...hookOptions } = options;
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [allData, setAllData] = useState([]);

	const params = {
		page: currentPage,
		per_page: pageSize,
		...hookOptions.params,
	};

	const hook = useApi(endpoint, {
		...hookOptions,
		params,
		immediate: true,
		onSuccess: (response) => {
			if (currentPage === 1) {
				setAllData(response.items || response);
			} else {
				setAllData((prev) => [...prev, ...(response.items || response)]);
			}

			if (hookOptions.onSuccess) {
				hookOptions.onSuccess(response);
			}
		},
	});

	const loadMore = useCallback(() => {
		setCurrentPage((prev) => prev + 1);
	}, []);

	const reset = useCallback(() => {
		setCurrentPage(1);
		setAllData([]);
	}, []);

	const hasMore = useMemo(() => {
		if (!hook.data) return false;
		const total = hook.data.total || hook.data.length;
		return allData.length < total;
	}, [hook.data, allData.length]);

	return {
		...hook,
		currentPage,
		allData,
		hasMore,
		loadMore,
		reset,
		pageSize,
	};
}
