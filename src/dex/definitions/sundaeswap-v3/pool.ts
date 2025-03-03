import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

export default {
  constructor: 0,
  fields: [
    {
      bytes: DatumParameterKey.PoolIdentifier,
    },
    [
      [
        {
          bytes: DatumParameterKey.PoolAssetAPolicyId,
        },
        {
          bytes: DatumParameterKey.PoolAssetAAssetName,
        },
      ],
      [
        {
          bytes: DatumParameterKey.PoolAssetBPolicyId,
        },
        {
          bytes: DatumParameterKey.PoolAssetBAssetName,
        },
      ],
    ],
    {
      int: DatumParameterKey.TotalLpTokens,
    },
    {
      int: DatumParameterKey.FeeANumerator,
    },
    {
      int: DatumParameterKey.FeeBNumerator,
    },
    (field: DefinitionField, parameters: DatumParameters) => {
      return parameters;
    },
    (field: DefinitionField, parameters: DatumParameters) => {
      return parameters;
    },
    {
      // https://github.com/SundaeSwap-finance/sundae-contracts/blob/main/lib/types/pool.ak#L33C17-L33C18
      int: DatumParameterKey.ProtocolFee,
    },
  ],
};
