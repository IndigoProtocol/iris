import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/MuesliSwapTeam/muesliswap-cardano-pool-contracts/blob/main/dex/src/MuesliSwapPools/ConstantProductPool/OnChain.hs
 */
export default {
  constructor: 0,
  fields: [
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.PoolAssetAPolicyId,
        },
        {
          bytes: DatumParameterKey.PoolAssetAAssetName,
        },
      ],
    },
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.PoolAssetBPolicyId,
        },
        {
          bytes: DatumParameterKey.PoolAssetBAssetName,
        },
      ],
    },
    {
      int: DatumParameterKey.TotalLpTokens,
    },
    {
      int: DatumParameterKey.LpFee,
    },
    (field: DefinitionField, foundParameters: DatumParameters) => {
      return; // Concentrated LPs
    },
    (field: DefinitionField, foundParameters: DatumParameters) => {
      return; // Concentrated LPs
    },
    (field: DefinitionField, foundParameters: DatumParameters) => {
      return; // Concentrated LPs
    },
    (field: DefinitionField, foundParameters: DatumParameters) => {
      return; // Concentrated LPs
    },
  ],
};
