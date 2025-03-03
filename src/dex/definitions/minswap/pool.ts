import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/CatspersCoffee/contracts/blob/bd6831e6806798032f6bb754d94a06d72d4d28a1/dex/src/Minswap/ConstantProductPool/OnChain.hs
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
      int: DatumParameterKey.RootKLast,
    },
    (field: DefinitionField, foundParameters: DatumParameters) => {
      // Un-needed data for SenderPubKeyHash & SenderStakingKeyHash

      return;
    },
  ],
};
