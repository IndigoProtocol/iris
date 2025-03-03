import { DatumParameterKey } from '../../../constants';

/**
 * https://github.com/SundaeSwap-finance/sundae-sdk/blob/27bdb4b092a3180b05b79b3a8c8cb880dc211efe/packages/core/src/classes/Extensions/DatumBuilders/DatumBuilder.Lucid.class.ts#L137
 */
export default {
  constructor: 0,
  fields: [
    {
      bytes: DatumParameterKey.PoolIdentifier,
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
                  constructor: 1,
                  fields: [
                    {
                      bytes: DatumParameterKey.RequestScriptHash,
                    },
                  ],
                },
                {
                  constructor: 1,
                  fields: [],
                },
              ],
            },
            {
              constructor: 0,
              fields: [
                {
                  bytes: DatumParameterKey.Unknown,
                },
              ],
            },
          ],
        },
        {
          constructor: 0,
          fields: [
            {
              bytes: DatumParameterKey.ReceiverPubKeyHash,
            },
          ],
        },
      ],
    },
    {
      int: DatumParameterKey.ScooperFee,
    },
    {
      constructor: 0,
      fields: [
        {
          constructor: DatumParameterKey.Action, // 0 -> Token A, 1 -> Token B
          fields: [],
        },
        {
          int: DatumParameterKey.DepositA,
        },
        {
          constructor: 0,
          fields: [
            {
              int: DatumParameterKey.DepositB,
            },
          ],
        },
      ],
    },
  ],
};
