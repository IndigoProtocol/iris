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
          bytes: DatumParameterKey.PoolAssetAPolicyId
        },
        {
          bytes: DatumParameterKey.PoolAssetAAssetName
        }
      ],
      [
        {
          bytes: DatumParameterKey.PoolAssetBPolicyId
        },
        {
          bytes: DatumParameterKey.PoolAssetBAssetName
        }
      ]
    ],
    {
      int: DatumParameterKey.TotalLpTokens
    },
    {
      int: DatumParameterKey.OpeningFee
    },
    {
      int: DatumParameterKey.FinalFee
    },
    (field: DefinitionField, parameters: DatumParameters) => {
      return parameters;
    },
  ],
};
