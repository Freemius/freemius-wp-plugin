import { useState } from '@wordpress/element';
import {
	Button,
	Notice,
	Spinner,
	Card,
	CardBody,
	CardHeader,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useApiGet,
	useApiMutation,
	useMultipleApi,
	useApiPagination,
} from '../hooks';

/**
 * Example component demonstrating how to use the useApi hooks
 */
export default function UseApiHookExample() {
	const [userId, setUserId] = useState('me');

	// Example 1: Simple GET request with automatic fetching
	const {
		data: user,
		isLoading: userLoading,
		error: userError,
		refetch: refetchUser,
	} = useApiGet(
		'users/me',
		{},
		{
			onSuccess: (data) => console.log('User loaded:', data),
			onError: (error) => console.error('User error:', error),
		}
	);

	// Example 2: GET request with parameters
	const {
		data: plugins,
		isLoading: pluginsLoading,
		error: pluginsError,
		refetch: refetchPlugins,
	} = useApiGet(
		'plugins',
		{ user_id: userId },
		{
			enabled: !!userId, // Only fetch if userId is set
		}
	);

	// Example 3: Mutation hooks for write operations
	const {
		mutate: createPlugin,
		mutatePost: postPlugin,
		mutatePut: updatePlugin,
		mutateDelete: deletePlugin,
		isLoading: mutationLoading,
		error: mutationError,
		data: mutationData,
	} = useApiMutation('plugins', {
		onSuccess: (data) => {
			console.log('Mutation successful:', data);
			// Refetch plugins after mutation
			refetchPlugins();
		},
		onError: (error) => console.error('Mutation error:', error),
	});

	// Example 4: Multiple API endpoints
	const apiResults = useMultipleApi({
		userProfile: {
			endpoint: 'users/me',
			immediate: true,
		},
		userStats: {
			endpoint: 'users/me/stats',
			immediate: true,
		},
		userPlans: {
			endpoint: 'users/me/plans',
			immediate: false, // Load on demand
		},
	});

	// Example 5: Paginated results
	const {
		data: paginatedData,
		allData: allPlugins,
		isLoading: paginationLoading,
		hasMore,
		loadMore,
		reset: resetPagination,
		currentPage,
	} = useApiPagination('plugins', {
		pageSize: 5,
		params: { user_id: 'me' },
	});

	// Example handlers
	const handleCreatePlugin = async () => {
		try {
			await createPlugin({
				title: 'Test Plugin',
				slug: 'test-plugin',
				type: 'plugin',
			});
		} catch (error) {
			// Error is already handled by onError callback
		}
	};

	const handleUpdatePlugin = async () => {
		if (!plugins?.length) return;

		try {
			await updatePlugin({
				id: plugins[0].id,
				title: 'Updated Plugin Title',
			});
		} catch (error) {
			// Error is already handled by onError callback
		}
	};

	const handleLoadUserPlans = () => {
		apiResults.userPlans.refetch();
	};

	return (
		<div className="use-api-hook-example">
			<h2>{__('useApi Hook Examples', 'freemius')}</h2>

			{/* Global Loading Indicator */}
			{(userLoading ||
				pluginsLoading ||
				mutationLoading ||
				paginationLoading) && (
				<div style={{ textAlign: 'center', margin: '20px 0' }}>
					<Spinner />
					<p>{__('Loading...', 'freemius')}</p>
				</div>
			)}

			<div
				style={{
					display: 'grid',
					gap: '20px',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
				}}
			>
				{/* Example 1: Simple GET */}
				<Card>
					<CardHeader>
						<h3>{__('1. Simple GET Request', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<p>
							<strong>Hook:</strong> <code>useApiGet('users/me')</code>
						</p>

						{userError && (
							<Notice status="error" isDismissible={false}>
								{userError.message || userError}
							</Notice>
						)}

						<Button
							variant="secondary"
							onClick={() => refetchUser(true)}
							disabled={userLoading}
						>
							{__('Refetch User', 'freemius')}
						</Button>

						{user && (
							<div style={{ marginTop: '10px' }}>
								<strong>{__('User ID:', 'freemius')}</strong> {user.id}
								<br />
								<strong>{__('Email:', 'freemius')}</strong> {user.email}
								<br />
								<strong>{__('First Name:', 'freemius')}</strong>{' '}
								{user.first || 'N/A'}
							</div>
						)}
					</CardBody>
				</Card>

				{/* Example 2: GET with Parameters */}
				<Card>
					<CardHeader>
						<h3>{__('2. GET with Parameters', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<p>
							<strong>Hook:</strong> <code>useApiGet('plugins', params)</code>
						</p>

						<TextControl
							label={__('User ID', 'freemius')}
							value={userId}
							onChange={setUserId}
							help={__('Change to see how params work', 'freemius')}
						/>

						{pluginsError && (
							<Notice status="error" isDismissible={false}>
								{pluginsError.message || pluginsError}
							</Notice>
						)}

						{plugins && (
							<div style={{ marginTop: '10px' }}>
								<strong>{__('Plugins found:', 'freemius')}</strong>{' '}
								{plugins.length || 0}
								{plugins.length > 0 && (
									<ul style={{ marginTop: '5px' }}>
										{plugins.slice(0, 3).map((plugin, index) => (
											<li key={index}>{plugin.title || plugin.slug}</li>
										))}
									</ul>
								)}
							</div>
						)}
					</CardBody>
				</Card>

				{/* Example 3: Mutations */}
				<Card>
					<CardHeader>
						<h3>{__('3. Mutations (POST/PUT/DELETE)', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<p>
							<strong>Hook:</strong> <code>useApiMutation('plugins')</code>
						</p>

						{mutationError && (
							<Notice status="error" isDismissible={false}>
								{mutationError.message || mutationError}
							</Notice>
						)}

						{mutationData && (
							<Notice status="success" isDismissible={false}>
								{__('Operation successful!', 'freemius')}
							</Notice>
						)}

						<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
							<Button
								variant="primary"
								onClick={handleCreatePlugin}
								disabled={mutationLoading}
							>
								{__('Create Plugin', 'freemius')}
							</Button>

							<Button
								variant="secondary"
								onClick={handleUpdatePlugin}
								disabled={mutationLoading || !plugins?.length}
							>
								{__('Update First Plugin', 'freemius')}
							</Button>
						</div>
					</CardBody>
				</Card>

				{/* Example 4: Multiple APIs */}
				<Card>
					<CardHeader>
						<h3>{__('4. Multiple API Endpoints', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<p>
							<strong>Hook:</strong> <code>useMultipleApi(endpoints)</code>
						</p>

						<div style={{ marginBottom: '10px' }}>
							<strong>{__('Profile:', 'freemius')}</strong>{' '}
							{apiResults.userProfile.isLoading
								? 'Loading...'
								: apiResults.userProfile.data
								? '✓ Loaded'
								: apiResults.userProfile.error
								? '✗ Error'
								: 'Not loaded'}
						</div>

						<div style={{ marginBottom: '10px' }}>
							<strong>{__('Stats:', 'freemius')}</strong>{' '}
							{apiResults.userStats.isLoading
								? 'Loading...'
								: apiResults.userStats.data
								? '✓ Loaded'
								: apiResults.userStats.error
								? '✗ Error'
								: 'Not loaded'}
						</div>

						<div style={{ marginBottom: '10px' }}>
							<strong>{__('Plans:', 'freemius')}</strong>{' '}
							{apiResults.userPlans.isLoading
								? 'Loading...'
								: apiResults.userPlans.data
								? '✓ Loaded'
								: apiResults.userPlans.error
								? '✗ Error'
								: 'Not loaded'}
						</div>

						<Button
							variant="secondary"
							onClick={handleLoadUserPlans}
							disabled={apiResults.userPlans.isLoading}
						>
							{__('Load Plans', 'freemius')}
						</Button>
					</CardBody>
				</Card>

				{/* Example 5: Pagination */}
				<Card>
					<CardHeader>
						<h3>{__('5. Pagination', 'freemius')}</h3>
					</CardHeader>
					<CardBody>
						<p>
							<strong>Hook:</strong> <code>useApiPagination('plugins')</code>
						</p>

						<div style={{ marginBottom: '10px' }}>
							<strong>{__('Current Page:', 'freemius')}</strong> {currentPage}
							<br />
							<strong>{__('Items Loaded:', 'freemius')}</strong>{' '}
							{allPlugins.length}
							<br />
							<strong>{__('Has More:', 'freemius')}</strong>{' '}
							{hasMore ? __('Yes', 'freemius') : __('No', 'freemius')}
						</div>

						<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
							<Button
								variant="primary"
								onClick={loadMore}
								disabled={paginationLoading || !hasMore}
							>
								{__('Load More', 'freemius')}
							</Button>

							<Button
								variant="secondary"
								onClick={resetPagination}
								disabled={paginationLoading}
							>
								{__('Reset', 'freemius')}
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Code Examples */}
			<Card style={{ marginTop: '20px' }}>
				<CardHeader>
					<h3>{__('Code Examples', 'freemius')}</h3>
				</CardHeader>
				<CardBody>
					<h4>{__('1. Simple GET Request:', 'freemius')}</h4>
					<pre
						style={{
							background: '#f0f0f0',
							padding: '10px',
							borderRadius: '4px',
						}}
					>
						{`import { useApiGet } from '../hooks';

function UserProfile() {
  const { data: user, isLoading, error, refetch } = useApiGet('users/me');
  
  if (isLoading) return <Spinner />;
  if (error) return <Notice status="error">{error.message}</Notice>;
  
  return (
    <div>
      <h2>Welcome, {user.email}!</h2>
      <button onClick={() => refetch(true)}>Refresh</button>
    </div>
  );
}`}
					</pre>

					<h4>{__('2. Mutation Example:', 'freemius')}</h4>
					<pre
						style={{
							background: '#f0f0f0',
							padding: '10px',
							borderRadius: '4px',
						}}
					>
						{`import { useApiMutation } from '../hooks';

function CreatePlugin() {
  const { mutate, isLoading, error } = useApiMutation('plugins', {
    onSuccess: (data) => alert('Plugin created!'),
    onError: (error) => console.error(error)
  });
  
  const handleCreate = () => {
    mutate({
      title: 'My Plugin',
      slug: 'my-plugin'
    });
  };
  
  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Plugin'}
    </button>
  );
}`}
					</pre>

					<h4>{__('3. Multiple APIs:', 'freemius')}</h4>
					<pre
						style={{
							background: '#f0f0f0',
							padding: '10px',
							borderRadius: '4px',
						}}
					>
						{`import { useMultipleApi } from '../hooks';

function Dashboard() {
  const apis = useMultipleApi({
    user: { endpoint: 'users/me', immediate: true },
    plugins: { endpoint: 'plugins', immediate: true },
    stats: { endpoint: 'stats', immediate: false }
  });
  
  return (
    <div>
      <h2>User: {apis.user.data?.email}</h2>
      <p>Plugins: {apis.plugins.data?.length}</p>
      <button onClick={() => apis.stats.refetch()}>
        Load Stats
      </button>
    </div>
  );
}`}
					</pre>

					<h4>{__('4. Pagination:', 'freemius')}</h4>
					<pre
						style={{
							background: '#f0f0f0',
							padding: '10px',
							borderRadius: '4px',
						}}
					>
						{`import { useApiPagination } from '../hooks';

function PluginsList() {
  const { 
    allData, 
    hasMore, 
    loadMore, 
    isLoading 
  } = useApiPagination('plugins', { pageSize: 10 });
  
  return (
    <div>
      {allData.map(plugin => (
        <div key={plugin.id}>{plugin.title}</div>
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          Load More
        </button>
      )}
    </div>
  );
}`}
					</pre>
				</CardBody>
			</Card>
		</div>
	);
}
