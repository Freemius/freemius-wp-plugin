/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useContext, useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	Flex,
	FlexItem,
	FlexBlock,
	Button,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { FreemiusContext } from '../context';
import { useSettings, usePlans } from '../hooks';

const DataViewContainer = styled.div`
	grid-column: span 2;
	overflow: hidden;
	margin-bottom: 10px;
`;

const useData = (scopeData) => {
	const {
		settings,
		structure,
		isLoading: isSettingsLoading,
	} = useSettings('freemius_defaults');

	const context = useContext(FreemiusContext);

	const { selectBlock } = useDispatch('core/block-editor');

	const contextData = scopeData?.freemius || context?.freemius || {};

	// const [freemiusPageMetaData, setFreemiusPageMeta] = useFreemiusPageMeta();
	// const metaData = freemiusPageMetaData;

	// TODO: review this if needed. Also check default plan_id
	// we need this to get a price, also the plan_id
	const defaults = {
		licenses: 1,
		currency: 'usd',
		billing_cycle: 'annual',
	};

	const dataWithoutWithDefaultPlan = useMemo(
		() => ({
			...defaults,
			...settings,
			...contextData,
		}),
		[settings, contextData]
	);

	const {
		plans,
		isLoading: isPlansLoading,
		isApiAvailable,
	} = usePlans(dataWithoutWithDefaultPlan?.product_id);

	// get the first, non-free plan
	const defaultPlan = useMemo(() => {
		return plans?.find((plan) => plan.pricing);
	}, [plans]);

	const data = useMemo(() => {
		let data = { ...dataWithoutWithDefaultPlan };

		// add the default plan if no plan_id is set
		if (defaultPlan && !data.plan_id) {
			data.plan_id = +defaultPlan.id;
		}

		// special case for licenses
		if (data?.licenses === 0) {
			data.licenses = null;
		}

		return data;
	}, [defaultPlan, dataWithoutWithDefaultPlan]);

	const currentPlan = useMemo(() => {
		return plans?.find((plan) => plan.id == data?.plan_id);
	}, [plans, data?.plan_id]);

	const currentPricing = useMemo(() => {
		return currentPlan?.pricing?.find((pricing) => {
			return (
				pricing.currency == data?.currency && pricing.licenses == data?.licenses
			);
		});
	}, [currentPlan, data?.currency, data?.licenses]);

	const clientId = scopeData?.clientID || context?.clientID;

	const matrix = useMemo(() => {
		if (!plans) return [];

		return plans.map((plan) => {
			const pricingByCurrency = {};

			plan?.pricing?.forEach((pricing) => {
				const currency = pricing.currency?.toLowerCase();

				if (!pricingByCurrency[currency]) {
					pricingByCurrency[currency] = {};
				}

				pricingByCurrency[currency] = {
					monthly: pricing.monthly_price,
					annual: pricing.annual_price,
					lifetime: pricing.lifetime_price,
				};
			});

			return {
				name: plan.name,
				title: plan.title,
				description: plan.description,
				pricing: pricingByCurrency,
			};
		});
	}, [plans]);

	// the plan is free. undefined if data is still loading
	const isFree =
		isSettingsLoading || isPlansLoading ? undefined : !currentPlan?.pricing;

	// the plan is invalid if no Pricing and not free or when the plan is not defined. undefined if data is still loading.
	const isInvalid =
		isSettingsLoading || isPlansLoading
			? undefined
			: (!currentPricing && !isFree) ||
			  !data?.plan_id ||
			  !data?.product_id ||
			  !data?.public_key;

	const errorMessage = useMemo(() => {
		let message = [];

		if (!data?.product_id) {
			message.push(__('Product ID is required', 'freemius'));
		}
		if (!data?.public_key) {
			message.push(__('Public Key is required', 'freemius'));
		}
		if (!data?.plan_id) {
			message.push(__('Plan ID is required.', 'freemius'));
		}

		return message.join(', ');
	}, [isInvalid, data]);

	const DataView = useMemo(() => {
		return () => <></>;

		// only for development
		return () => (
			<DataViewContainer>
				<ItemGroup isSeparated isBorderd size="small">
					<Item>
						<Flex>
							<FlexBlock>isFree</FlexBlock>
							<FlexBlock>{isFree ? 'true' : 'false'}</FlexBlock>
						</Flex>
					</Item>
					<Item>
						<Flex>
							<FlexBlock>isInvalid</FlexBlock>
							<FlexBlock>{isInvalid ? 'true' : 'false'}</FlexBlock>
						</Flex>
					</Item>
					{Object.entries(data).map(([key, value]) => (
						<Item key={key}>
							<Flex>
								<FlexBlock>{key}</FlexBlock>
								<FlexBlock>
									{value === null ? <i>{'null'}</i> : <span>{value}</span>}
								</FlexBlock>
							</Flex>
						</Item>
					))}
				</ItemGroup>
			</DataViewContainer>
		);
	}, [data, isFree, isInvalid]);

	const selectScope = () => {
		selectBlock(clientId);
	};

	return {
		data,
		settings,
		isLoading: isSettingsLoading || isPlansLoading,
		isApiAvailable,
		//metaData,
		contextData,
		clientId,
		currentPlan,
		isFree,
		isInvalid,
		currentPricing,
		DataView,
		selectScope,
		errorMessage,
		matrix,
	};
};

export default useData;
