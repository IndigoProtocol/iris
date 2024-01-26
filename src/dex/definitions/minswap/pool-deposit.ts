import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/minswap/sdk/blob/main/src/types/order.ts
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
    (field: DefinitionField, foundParameters: DatumParameters) => {
      return;
    },
    {
      constructor: 2,
      fields: [
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
