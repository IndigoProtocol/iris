import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/CatspersCoffee/contracts/blob/bd6831e6806798032f6bb754d94a06d72d4d28a1/dex/src/Minswap/BatchOrder/Types.hs
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
    (field: DefinitionField, foundParameters: DatumParameters) => {
      if ('fields' in field) {
        if (field.constructor === 1) {
          return;
        }

        const constr: DefinitionField = field.fields[0];

        if ('fields' in constr && 'bytes' in constr.fields[0]) {
          const nestedField: DefinitionField = constr.fields[0];
          foundParameters[DatumParameterKey.ReceiverPubKeyHash] = nestedField.bytes;
        }

        if ('fields' in field.fields[1] && 'fields' in field.fields[1].fields[0] && 'fields' in field.fields[1].fields[0].fields[0] && 'bytes' in field.fields[1].fields[0].fields[0].fields[0]) {
          foundParameters[DatumParameterKey.ReceiverStakingKeyHash] = field.fields[1].fields[0].fields[0].fields[0].bytes;
        }
        return;
      }

      throw new Error("Template definition does not match with 'bytes'");
    },
    {
      constructor: 1,
      fields: []
    },
    {
      constructor: 0,
      fields: [
        {
          constructor: DatumParameterKey.Action,
          fields: [
            {
              bytes: DatumParameterKey.SwapOutTokenPolicyId
            },
            {
              bytes: DatumParameterKey.SwapOutTokenAssetName
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
      int: DatumParameterKey.DepositFee
    }
  ]
}
