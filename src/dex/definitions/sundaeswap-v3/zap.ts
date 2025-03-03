import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

export default {
  constructor: 0,
  fields: [
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.PoolIdentifier,
        },
      ],
    },
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.SenderStakingKeyHash,
        },
      ],
    },
    {
      int: DatumParameterKey.ProtocolFee,
    },
    {
      constructor: 0,
      fields: [
        {
          constructor: 0,
          fields: [
            {
              constructor: 1,
              fields: [
                {
                  bytes: DatumParameterKey.SenderPubKeyHash,
                },
              ],
            },
            {
              constructor: 0,
              fields: [
                {
                  constructor: 0,
                  fields: [
                    {
                      constructor: 0,
                      fields: [
                        {
                          bytes: DatumParameterKey.SenderStakingKeyHash,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        (
          field: DefinitionField,
          parameters: DatumParameters,
          shouldExtract: boolean = true
        ) => {
          return;
        },
      ],
    },
    {
      constructor: 1,
      fields: [
        [
          {
            bytes: DatumParameterKey.PoolAssetAPolicyId,
          },
          {
            bytes: DatumParameterKey.PoolAssetAAssetName,
          },
          {
            int: DatumParameterKey.DepositA,
          },
        ],
        [
          {
            bytes: DatumParameterKey.PoolAssetBPolicyId,
          },
          {
            bytes: DatumParameterKey.PoolAssetBAssetName,
          },
          {
            int: DatumParameterKey.DepositB,
          },
        ],
      ],
    },
    {
      bytes: DatumParameterKey.CancelDatum,
    },
  ],
};
