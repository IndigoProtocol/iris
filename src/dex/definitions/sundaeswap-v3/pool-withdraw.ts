import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

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
          bytes: DatumParameterKey.SenderStakingKeyHash
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
      constructor: 3,
      fields: [
        [
          {
            bytes: DatumParameterKey.LpTokenPolicyId
          },
          {
            bytes: DatumParameterKey.LpTokenAssetName
          },
          {
            int: DatumParameterKey.LpTokens
          }
        ]
      ]
    },
    {
      bytes: DatumParameterKey.CancelDatum
    }
  ]
}
