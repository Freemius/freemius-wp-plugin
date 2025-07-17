/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */

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
import { useSettings, useFreemiusPageMeta, usePlans } from '../hooks';

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
	} = useSettings('freemius_button');

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

	const data = {
		...defaults,
		...settings,
		//	...metaData,
		...contextData,
	};

	const { plans, isLoading: isPlansLoading } = usePlans(data?.product_id);

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

	// the plan is free. undefined if data is still loading
	const isFree =
		isSettingsLoading || isPlansLoading ? undefined : !currentPlan?.pricing;

	// the plan is invalid if no Pricing and not free or when the plan is not defined. undefined if data is still loading.
	const isInvalid =
		isSettingsLoading || isPlansLoading
			? undefined
			: (!currentPricing && !isFree) || !data?.plan_id;

	const DataView = useMemo(() => {
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
								<FlexBlock>{value}</FlexBlock>
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
		//metaData,
		contextData,
		clientId,
		currentPlan,
		isFree,
		isInvalid,
		currentPricing,
		DataView,
		selectScope,
	};
};

export default useData;
