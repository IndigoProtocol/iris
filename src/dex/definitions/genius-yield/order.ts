import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/geniusyield/dex-contracts-api/blob/8add6b608235095fa019fb6566d8ef1cd81080bf/src/GeniusYield/Scripts/Dex/PartialOrder.hs#L75-L108
 */
export default {
  constructor: 0,
  fields: [
    {
      bytes: DatumParameterKey.SenderPubKeyHash
    },
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
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.SwapInTokenPolicyId
        },
        {
          bytes: DatumParameterKey.SwapInTokenAssetName
        }
      ]
    },
    {
      int: DatumParameterKey.OriginalOffer
    },
    {
      int: DatumParameterKey.LeftOverOffer
    },
    {
      constructor: 0,
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
      constructor: 0,
      fields: [
        {
          int: DatumParameterKey.PriceDenominator
        },
        {
          int: DatumParameterKey.PriceNumerator
        }
      ]
    },
    {
      bytes: DatumParameterKey.TokenAssetName
    },
    {
      constructor: 1,
      fields: []
    },
    {
      constructor: 1,
      fields: []
    },
    {
      int: DatumParameterKey.PastOrderFills
    },
    {
      int: DatumParameterKey.MakerFee
    },
    {
      int: DatumParameterKey.TakerFee
    },
    {
      constructor: 0,
      fields: [
        {
          int: DatumParameterKey.ContainedFee
        },
        {
          int: DatumParameterKey.ContainedFeePayment
        },
        {
          int: DatumParameterKey.Unknown
        }
      ]
    },
    {
      int: DatumParameterKey.Unknown
    }
  ]
}
