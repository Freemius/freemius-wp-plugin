/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */

import { useContext } from '@wordpress/element';
import { useSettings, useFreemiusPageMeta } from '../hooks';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	Flex,
	FlexItem,
	FlexBlock,
} from '@wordpress/components';

import { FreemiusContext } from '../context';

const DataViewContainer = styled.div`
	grid-column: span 2;
	overflow: hidden;
`;

const useData = () => {
	const { settings, structure, isLoading } = useSettings('freemius_button');

	const context = useContext(FreemiusContext);
	const contextData = context?.freemius;

	const [freemiusPageMetaData, setFreemiusPageMeta] = useFreemiusPageMeta();
	const metaData = freemiusPageMetaData;

	const data = {
		...settings,
		...metaData,
		...contextData,
	};

	const DataView = () => {
		return (
			<DataViewContainer>
				{Object.entries(data).map(([key, value]) => (
					<ItemGroup isBordered={true} size="small" key={key}>
						<Item>
							<Flex>
								<FlexBlock>{key}</FlexBlock>
								<FlexBlock>{value}</FlexBlock>
							</Flex>
						</Item>
					</ItemGroup>
				))}
			</DataViewContainer>
		);
	};

	return {
		data,
		settings,
		metaData,
		contextData,
		DataView,
	};
};

export default useData;
