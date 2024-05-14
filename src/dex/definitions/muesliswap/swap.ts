import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

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
                  bytes: DatumParameterKey.SenderPubKeyHash
                }
              ]
            },
            (field: DefinitionField, foundParameters: DatumParameters) => {
              if ('fields' in field) {
                if (field.constructor === 1) {
                  return;
                }

                const constr: DefinitionField = field.fields[0];

                if ('fields' in constr && 'fields' in constr.fields[0] && 'bytes' in constr.fields[0].fields[0]) {
                  const field: DefinitionField = constr.fields[0].fields[0];
                  foundParameters[DatumParameterKey.SenderStakingKeyHash] = field.bytes;

                  return;
                }
              }

              throw new Error("Template definition does not match with 'bytes'");
            }
          ]
        },
        {
          bytes: DatumParameterKey.SwapOutTokenPolicyId
        },
        {
          bytes: DatumParameterKey.SwapOutTokenAssetName
        },
        {
          bytes: DatumParameterKey.SwapInTokenPolicyId
        },
        {
          bytes: DatumParameterKey.SwapInTokenAssetName
        },
        {
          int: DatumParameterKey.MinReceive
        },
        (field: DefinitionField, foundParameters: DatumParameters) => {
          if ('fields' in field) {
            foundParameters[DatumParameterKey.AllowPartialFill] = field.constructor;
            return;
          }

          if ('int' in field) {
            foundParameters[DatumParameterKey.TotalFees] = field['int'];
            return;
          }

          throw new Error("Template definition does not match with 'bytes'");
        },
        (field: DefinitionField, foundParameters: DatumParameters) => {
          if ('fields' in field) {
            foundParameters[DatumParameterKey.AllowPartialFill] = field.constructor;
            return;
          }

          if ('int' in field) {
            foundParameters[DatumParameterKey.TotalFees] = field['int'];
            return;
          }

          throw new Error("Template definition does not match with 'bytes'");
        },
      ]
    }
  ]
};
