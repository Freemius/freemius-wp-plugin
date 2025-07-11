import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	Notice,
	Spinner,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { API_STORE } from '../stores';

/**
 * Example component demonstrating how to use the Freemius API store
 */
export default function FreemiusApiExample() {
	const [endpoint, setEndpoint] = useState('users/me');
	const [userInfo, setUserInfo] = useState(null);
	const [plugins, setPlugins] = useState(null);

	// Get actions from the API store
	const { fetchFromApi, clearServerCache, clearError } = useDispatch(API_STORE);

	// Get data from the API store
	const { isLoading, isAnyLoading, error, getAllCachedData } = useSelect(
		(select) => ({
			isLoading: (endpoint) => select(API_STORE).isLoading(endpoint),
			isAnyLoading: select(API_STORE).isAnyLoading(),
			error: select(API_STORE).getError(),
			getAllCachedData: select(API_STORE).getAllCachedData(),
		}),
		[]
	);

	/**
	 * Fetch user information
	 */
	const handleFetchUser = async () => {
		try {
			const response = await fetchFromApi('users/me');
			setUserInfo(response);
		} catch (err) {
			console.error('Failed to fetch user:', err);
		}
	};

	/**
	 * Fetch user plugins
	 */
	const handleFetchPlugins = async () => {
		try {
			const response = await fetchFromApi('plugins', {
				user_id: userInfo?.id || 'me',
			});
			setPlugins(response);
		} catch (err) {
			console.error('Failed to fetch plugins:', err);
		}
	};

	/**
	 * Fetch custom endpoint
	 */
	const handleFetchCustom = async () => {
		try {
			await fetchFromApi(endpoint);
		} catch (err) {
			console.error('Failed to fetch from custom endpoint:', err);
		}
	};

	/**
	 * Clear all caches
	 */
	const handleClearCache = async () => {
		try {
			await clearServerCache();
		} catch (err) {
			console.error('Failed to clear cache:', err);
		}
	};

	// Generate cache keys for loading states
	const userCacheKey = 'users/me:{}';
	const pluginsCacheKey = userInfo
		? `plugins:{"user_id":"${userInfo.id}"}`
		: null;
	const customCacheKey = `${endpoint}:{}`;

	return (
		<div className="freemius-api-example">
			<h2>{__('Freemius API Store Example', 'freemius')}</h2>

			{error && (
				<Notice status="error" onRemove={clearError} isDismissible>
					<strong>{__('API Error:', 'freemius')}</strong>{' '}
					{error.message || error}
				</Notice>
			)}

			<div
				style={{
					display: 'grid',
					gap: '20px',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
				}}
			>
				{/* User Information Card */}
				<Card>
					<CardHeader>
						<h3>{__('User Information', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<Button
							variant="primary"
							onClick={handleFetchUser}
							disabled={isLoading(userCacheKey)}
						>
							{isLoading(userCacheKey) && <Spinner />}
							{__('Fetch User Info', 'freemius')}
						</Button>

						{userInfo && (
							<div style={{ marginTop: '10px' }}>
								<h4>{__('User Details:', 'freemius')}</h4>
								<pre
									style={{
										background: '#f0f0f0',
										padding: '10px',
										borderRadius: '4px',
									}}
								>
									{JSON.stringify(userInfo, null, 2)}
								</pre>
							</div>
						)}
					</CardBody>
				</Card>

				{/* Plugins Card */}
				<Card>
					<CardHeader>
						<h3>{__('User Plugins', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<Button
							variant="primary"
							onClick={handleFetchPlugins}
							disabled={
								!userInfo || (pluginsCacheKey && isLoading(pluginsCacheKey))
							}
						>
							{pluginsCacheKey && isLoading(pluginsCacheKey) && <Spinner />}
							{__('Fetch Plugins', 'freemius')}
						</Button>

						{!userInfo && (
							<p style={{ color: '#888', marginTop: '10px' }}>
								{__('Fetch user information first', 'freemius')}
							</p>
						)}

						{plugins && (
							<div style={{ marginTop: '10px' }}>
								<h4>{__('Plugins:', 'freemius')}</h4>
								<pre
									style={{
										background: '#f0f0f0',
										padding: '10px',
										borderRadius: '4px',
									}}
								>
									{JSON.stringify(plugins, null, 2)}
								</pre>
							</div>
						)}
					</CardBody>
				</Card>

				{/* Custom Endpoint Card */}
				<Card>
					<CardHeader>
						<h3>{__('Custom Endpoint', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<div style={{ marginBottom: '10px' }}>
							<input
								type="text"
								value={endpoint}
								onChange={(e) => setEndpoint(e.target.value)}
								placeholder={__(
									'Enter API endpoint (e.g., plugins, users/123)',
									'freemius'
								)}
								style={{ width: '100%', padding: '5px' }}
							/>
						</div>
						<Button
							variant="primary"
							onClick={handleFetchCustom}
							disabled={!endpoint || isLoading(customCacheKey)}
						>
							{isLoading(customCacheKey) && <Spinner />}
							{__('Fetch from Endpoint', 'freemius')}
						</Button>
					</CardBody>
				</Card>

				{/* Cache Management Card */}
				<Card>
					<CardHeader>
						<h3>{__('Cache Management', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<div style={{ marginBottom: '10px' }}>
							<Button
								variant="secondary"
								onClick={handleClearCache}
								disabled={isLoading('cache-clear')}
							>
								{isLoading('cache-clear') && <Spinner />}
								{__('Clear Server Cache', 'freemius')}
							</Button>
						</div>

						<div>
							<h4>{__('Cached Data:', 'freemius')}</h4>
							<pre
								style={{
									background: '#f0f0f0',
									padding: '10px',
									borderRadius: '4px',
									maxHeight: '200px',
									overflow: 'auto',
								}}
							>
								{JSON.stringify(getAllCachedData, null, 2)}
							</pre>
						</div>
					</CardBody>
				</Card>
			</div>

			{isAnyLoading && (
				<div style={{ marginTop: '20px', textAlign: 'center' }}>
					<Spinner />
					<p>{__('Loading...', 'freemius')}</p>
				</div>
			)}

			{/* Usage Instructions */}
			<Card style={{ marginTop: '20px' }}>
				<CardHeader>
					<h3>{__('How to Use the API Store', 'freemius')}</h3>
				</CardHeader>
				<CardBody>
					<h4>{__('Basic Usage:', 'freemius')}</h4>
					<pre
						style={{
							background: '#f0f0f0',
							padding: '10px',
							borderRadius: '4px',
						}}
					>
						{`import { useDispatch, useSelect } from '@wordpress/data';
import { API_STORE } from '../stores';

function MyComponent() {
  const { fetchFromApi, postToApi } = useDispatch(API_STORE);
  const { isLoading, error } = useSelect((select) => ({
    isLoading: select(API_STORE).isLoading('users/me:{}'),
    error: select(API_STORE).getError(),
  }));

  const handleFetch = async () => {
    try {
      const user = await fetchFromApi('users/me');
      console.log(user);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handleFetch} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Fetch User'}
    </button>
  );
}`}
					</pre>

					<h4>{__('Available Methods:', 'freemius')}</h4>
					<ul>
						<li>
							<code>fetchFromApi(endpoint, params, forceRefresh)</code> -{' '}
							{__('GET requests with caching', 'freemius')}
						</li>
						<li>
							<code>postToApi(endpoint, data)</code> -{' '}
							{__('POST requests', 'freemius')}
						</li>
						<li>
							<code>putToApi(endpoint, data)</code> -{' '}
							{__('PUT requests', 'freemius')}
						</li>
						<li>
							<code>deleteFromApi(endpoint)</code> -{' '}
							{__('DELETE requests', 'freemius')}
						</li>
						<li>
							<code>clearServerCache()</code> -{' '}
							{__('Clear server-side cache', 'freemius')}
						</li>
					</ul>

					<h4>{__('Available Selectors:', 'freemius')}</h4>
					<ul>
						<li>
							<code>isLoading(cacheKey)</code> -{' '}
							{__('Check if specific request is loading', 'freemius')}
						</li>
						<li>
							<code>isAnyLoading()</code> -{' '}
							{__('Check if any request is loading', 'freemius')}
						</li>
						<li>
							<code>getError()</code> - {__('Get current error', 'freemius')}
						</li>
						<li>
							<code>getCachedData(cacheKey)</code> -{' '}
							{__('Get cached data for specific key', 'freemius')}
						</li>
						<li>
							<code>getAllCachedData()</code> -{' '}
							{__('Get all cached data', 'freemius')}
						</li>
					</ul>
				</CardBody>
			</Card>
		</div>
	);
}
