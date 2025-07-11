import { useState } from '@wordpress/element';
import {
	Button,
	Notice,
	Spinner,
	Card,
	CardBody,
	CardHeader,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useApiGet } from '../hooks';

/**
 * Component that demonstrates request deduplication
 */
function DuplicateRequestComponent({ endpoint, componentId }) {
	const [requestCount, setRequestCount] = useState(0);

	const { data, isLoading, error, refetch, cacheKey } = useApiGet(
		endpoint,
		{},
		{
			onSuccess: () => {
				console.log(`Component ${componentId}: Request completed`);
			},
		}
	);

	const handleManualRefetch = () => {
		setRequestCount((prev) => prev + 1);
		console.log(
			`Component ${componentId}: Manual refetch #${requestCount + 1}`
		);
		refetch(true); // Force refresh
	};

	return (
		<Card style={{ minWidth: '250px' }}>
			<CardHeader>
				<h4>
					{__('Component', 'freemius')} {componentId}
				</h4>
			</CardHeader>
			<CardBody>
				<div style={{ marginBottom: '10px' }}>
					<strong>{__('Cache Key:', 'freemius')}</strong>
					<br />
					<code style={{ fontSize: '11px', wordBreak: 'break-all' }}>
						{cacheKey}
					</code>
				</div>

				<div style={{ marginBottom: '10px' }}>
					<strong>{__('Status:', 'freemius')}</strong>{' '}
					{isLoading ? (
						<span style={{ color: '#007cba' }}>
							<Spinner
								style={{ float: 'none', width: '16px', height: '16px' }}
							/>
							{__('Loading...', 'freemius')}
						</span>
					) : error ? (
						<span style={{ color: '#d63384' }}>{__('Error', 'freemius')}</span>
					) : data ? (
						<span style={{ color: '#198754' }}>{__('Loaded', 'freemius')}</span>
					) : (
						<span style={{ color: '#6c757d' }}>
							{__('No data', 'freemius')}
						</span>
					)}
				</div>

				<div style={{ marginBottom: '10px' }}>
					<strong>{__('Manual Requests:', 'freemius')}</strong> {requestCount}
				</div>

				<Button
					variant="secondary"
					size="small"
					onClick={handleManualRefetch}
					disabled={isLoading}
				>
					{__('Refetch', 'freemius')}
				</Button>

				{error && (
					<Notice
						status="error"
						isDismissible={false}
						style={{ marginTop: '10px' }}
					>
						{error.message || error}
					</Notice>
				)}

				{data && (
					<div style={{ marginTop: '10px', fontSize: '12px' }}>
						<strong>{__('Data preview:', 'freemius')}</strong>
						<br />
						<code
							style={{
								background: '#f6f7f7',
								padding: '5px',
								borderRadius: '3px',
								display: 'block',
							}}
						>
							{JSON.stringify(data, null, 2).substring(0, 100)}...
						</code>
					</div>
				)}
			</CardBody>
		</Card>
	);
}

/**
 * Example component demonstrating request deduplication
 */
export default function DeduplicationExample() {
	const [endpoint, setEndpoint] = useState('users/me');
	const [showComponents, setShowComponents] = useState(false);

	return (
		<div className="deduplication-example">
			<h2>{__('Request Deduplication Example', 'freemius')}</h2>

			<Card style={{ marginBottom: '20px' }}>
				<CardHeader>
					<h3>{__('How It Works', 'freemius')}</h3>
				</CardHeader>
				<CardBody>
					<p>
						{__(
							'This example demonstrates how multiple components requesting the same data will only trigger one actual API request. When you mount multiple components with the same endpoint, they will:',
							'freemius'
						)}
					</p>
					<ul>
						<li>
							{__(
								'Share the same ongoing request if one is already in progress',
								'freemius'
							)}
						</li>
						<li>
							{__(
								'All receive the same response when it completes',
								'freemius'
							)}
						</li>
						<li>{__('Use cached data for subsequent requests', 'freemius')}</li>
					</ul>

					<div style={{ marginTop: '15px' }}>
						<label style={{ display: 'block', marginBottom: '5px' }}>
							<strong>{__('API Endpoint:', 'freemius')}</strong>
						</label>
						<input
							type="text"
							value={endpoint}
							onChange={(e) => setEndpoint(e.target.value)}
							placeholder={__(
								'Enter API endpoint (e.g., users/me, plugins)',
								'freemius'
							)}
							style={{ width: '300px', padding: '5px', marginRight: '10px' }}
						/>
						<Button
							variant="primary"
							onClick={() => setShowComponents(!showComponents)}
						>
							{showComponents
								? __('Hide Components', 'freemius')
								: __('Show Components', 'freemius')}
						</Button>
					</div>
				</CardBody>
			</Card>

			{showComponents && (
				<>
					<Notice
						status="info"
						isDismissible={false}
						style={{ marginBottom: '20px' }}
					>
						<strong>{__('Watch the Network Tab:', 'freemius')}</strong>{' '}
						{__(
							"Open your browser's developer tools and watch the Network tab. You should see only ONE request being made even though there are multiple components.",
							'freemius'
						)}
					</Notice>

					<Notice
						status="warning"
						isDismissible={false}
						style={{ marginBottom: '20px' }}
					>
						<strong>{__('Check the Console:', 'freemius')}</strong>{' '}
						{__(
							'All components will log when their request completes, but only one actual network request is made.',
							'freemius'
						)}
					</Notice>

					<h3>{__('Multiple Components Requesting Same Data', 'freemius')}</h3>
					<div
						style={{
							display: 'grid',
							gap: '15px',
							gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
							marginBottom: '20px',
						}}
					>
						<DuplicateRequestComponent endpoint={endpoint} componentId="A" />
						<DuplicateRequestComponent endpoint={endpoint} componentId="B" />
						<DuplicateRequestComponent endpoint={endpoint} componentId="C" />
						<DuplicateRequestComponent endpoint={endpoint} componentId="D" />
					</div>

					<Card>
						<CardHeader>
							<h3>{__('Test Instructions', 'freemius')}</h3>
						</CardHeader>
						<CardBody>
							<ol>
								<li>
									<strong>{__('Open Network Tab:', 'freemius')}</strong>{' '}
									{__('Press F12 → Network tab', 'freemius')}
								</li>
								<li>
									<strong>{__('Clear Network Log:', 'freemius')}</strong>{' '}
									{__('Click the clear button in Network tab', 'freemius')}
								</li>
								<li>
									<strong>{__('Mount Components:', 'freemius')}</strong>{' '}
									{__('Click "Show Components" above', 'freemius')}
								</li>
								<li>
									<strong>{__('Watch Network:', 'freemius')}</strong>{' '}
									{__(
										'You should see only ONE request despite 4 components',
										'freemius'
									)}
								</li>
								<li>
									<strong>{__('Test Manual Refetch:', 'freemius')}</strong>{' '}
									{__(
										'Click "Refetch" on any component while others are loading',
										'freemius'
									)}
								</li>
								<li>
									<strong>{__('Force Refresh:', 'freemius')}</strong>{' '}
									{__(
										'Multiple "Refetch" clicks should use cached data',
										'freemius'
									)}
								</li>
							</ol>

							<div
								style={{
									marginTop: '15px',
									padding: '10px',
									background: '#f0f6fc',
									borderLeft: '4px solid #0969da',
								}}
							>
								<strong>{__('Expected Behavior:', 'freemius')}</strong>
								<ul style={{ marginTop: '5px', marginBottom: '0' }}>
									<li>
										{__(
											'Only 1 network request for all 4 components',
											'freemius'
										)}
									</li>
									<li>
										{__(
											'All components show "Loading..." simultaneously',
											'freemius'
										)}
									</li>
									<li>
										{__(
											'All components receive data at the same time',
											'freemius'
										)}
									</li>
									<li>
										{__('Subsequent requests use cached data', 'freemius')}
									</li>
								</ul>
							</div>
						</CardBody>
					</Card>
				</>
			)}
		</div>
	);
}
