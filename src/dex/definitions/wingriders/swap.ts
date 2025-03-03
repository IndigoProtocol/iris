import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/WingRiders/dex-serializer/blob/main/src/RequestDatum.ts
 */
export default {
  constructor: 0,
  fields: [
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
                  bytes: DatumParameterKey.ReceiverPubKeyHash,
                },
              ],
            },
            (field: DefinitionField, foundParameters: DatumParameters) => {
              if ('fields' in field) {
                if (field.constructor === 1) {
                  return;
                }

                const constr: DefinitionField = field.fields[0];

                if (
                  'fields' in constr &&
                  'fields' in constr.fields[0] &&
                  'bytes' in constr.fields[0].fields[0]
                ) {
                  const field: DefinitionField = constr.fields[0].fields[0];
                  foundParameters[DatumParameterKey.ReceiverStakingKeyHash] =
                    field.bytes;

                  return;
                }
              }

              throw new Error(
                "Template definition does not match with 'bytes'"
              );
            },
          ],
        },
        {
          bytes: DatumParameterKey.SenderPubKeyHash,
        },
        {
          int: DatumParameterKey.Expiration,
        },
        {
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
          ],
        },
      ],
    },
    {
      constructor: 0,
      fields: [
        {
          constructor: DatumParameterKey.Action,
          fields: [],
        },
        {
          int: DatumParameterKey.MinReceive,
        },
      ],
    },
  ],
};
