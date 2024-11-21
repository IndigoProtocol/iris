import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/WingRiders/dex-v2-contracts/blob/master/src/DEX/Pool/ConstantProduct.hs#L104
 */
export default {
  constructor: 0,
  fields: [
    {
      int: DatumParameterKey.Deposit
    },
    {
      constructor: 0,
      fields: [
        {
          constructor: DatumParameterKey.Unknown,
          fields: [
            {
              bytes: DatumParameterKey.ReceiverPubKeyHash
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
              foundParameters[DatumParameterKey.ReceiverStakingKeyHash] = field.bytes;

              return;
            }
          }

          throw new Error("Template definition does not match with 'bytes'");
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
              bytes: DatumParameterKey.ReceiverPubKeyHash
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
              foundParameters[DatumParameterKey.ReceiverStakingKeyHash] = field.bytes;

              return;
            }
          }

          throw new Error("Template definition does not match with 'bytes'");
        }
      ]
    },
    (field: DefinitionField, parameters: DatumParameters) => {
      return parameters;
    },
    {
      constructor: DatumParameterKey.Unknown,
      fields: []
    },
    {
      int: DatumParameterKey.Expiration
    },
    {
      bytes: DatumParameterKey.PoolAssetAPolicyId
    },
    {
      bytes: DatumParameterKey.PoolAssetAAssetName
    },
    {
      bytes: DatumParameterKey.PoolAssetBPolicyId
    },
    {
      bytes: DatumParameterKey.PoolAssetBAssetName
    },
    {
      constructor: 0,
      fields: [
        {
          constructor: DatumParameterKey.Action,
          fields: []
        },
        {
          int: DatumParameterKey.MinReceive
        }
      ]
    },
    {
      int: DatumParameterKey.AScale
    },
    {
      int: DatumParameterKey.BScale
    }
  ]
};
