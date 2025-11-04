import { DatumParameterKey } from '../../../constants';

export default {
  constructor: 0,
  fields: [
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.SenderPubKeyHash,
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
              bytes: DatumParameterKey.SenderPubKeyHash,
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
                      bytes: DatumParameterKey.SenderStakingKeyHash,
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
    },
    {
      constructor: 0,
      fields: [
        {
          constructor: 0,
          fields: [
            {
              bytes: DatumParameterKey.SenderPubKeyHash,
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
                      bytes: DatumParameterKey.SenderStakingKeyHash,
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
    },
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.LpTokenAPolicyId
        },
        {
          bytes: DatumParameterKey.LpTokenAAssetName
        }
      ]
    },
    {
      constructor: DatumParameterKey.Unknown,
      fields: [
        [
          {
            constructor: 0,
            fields: [
              {
                constructor: 0,
                fields: [
                  {
                    bytes: DatumParameterKey.LpTokenAPolicyId
                  },
                  {
                    bytes: DatumParameterKey.LpTokenAAssetName
                  }
                ]
              },
              {
                constructor: 1,
                fields: []
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
                    bytes: DatumParameterKey.LpTokenBPolicyId
                  },
                  {
                    bytes: DatumParameterKey.LpTokenBAssetName
                  }
                ]
              },
              {
                constructor: 0,
                fields: []
              }
            ]
          }
        ],
        {
          constructor: 0,
          fields: [
            {
              int: DatumParameterKey.SwapInAmount
            }
          ]
        },
        {
          int: DatumParameterKey.MinReceive
        }
      ]
    },
    {
      int: DatumParameterKey.BatcherFee
    },
    {
      constructor: 1,
      fields: []
    }
  ]
}