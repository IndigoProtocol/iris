import { DatumParameterKey } from '../../../constants';

export default {
  constructor: 0,
  fields: [
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.PoolIdentifier
        }
      ]
    },
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.SenderPubKeyHash
        }
      ]
    },
    {
      int: DatumParameterKey.ProtocolFee
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
                  bytes: DatumParameterKey.SenderPubKeyHash
                }
              ]
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
                          bytes: DatumParameterKey.SenderStakingKeyHash
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          constructor: 0,
          fields: []
        }
      ]
    },
    {
      constructor: 2,
      fields: [
        [
          [
            {
              bytes: DatumParameterKey.PoolAssetAPolicyId
            },
            {
              bytes: DatumParameterKey.PoolAssetAAssetName
            },
            {
              int: DatumParameterKey.DepositA
            }
          ],
          [
            {
              bytes: DatumParameterKey.PoolAssetBPolicyId
            },
            {
              bytes: DatumParameterKey.PoolAssetBAssetName
            },
            {
              int: DatumParameterKey.DepositB
            }
          ]
        ]
      ]
    },
    {
      bytes: DatumParameterKey.CancelDatum
    }
  ]
}