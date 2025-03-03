import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/spectrum-finance/cardano-dex-contracts/blob/master/cardano-dex-contracts-offchain/ErgoDex/Contracts/Proxy/Swap.hs
 */
export default {
  constructor: 0,
  fields: [
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.SwapInTokenPolicyId,
        },
        {
          bytes: DatumParameterKey.SwapInTokenAssetName,
        },
      ],
    },
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.SwapOutTokenPolicyId,
        },
        {
          bytes: DatumParameterKey.SwapOutTokenAssetName,
        },
      ],
    },
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.TokenPolicyId, // Pool NFT
        },
        {
          bytes: DatumParameterKey.TokenAssetName,
        },
      ],
    },
    {
      int: DatumParameterKey.LpFee,
    },
    {
      int: DatumParameterKey.LpFeeNumerator, // Execution fee numerator
    },
    {
      int: DatumParameterKey.LpFeeDenominator, // Execution fee denominator
    },
    {
      bytes: DatumParameterKey.SenderPubKeyHash,
    },
    (field: DefinitionField, foundParameters: DatumParameters) => {
      if ('fields' in field) {
        if (field.constructor === 1) {
          return;
        }

        if (field.fields.length > 0 && 'bytes' in field.fields[0]) {
          foundParameters[DatumParameterKey.SenderStakingKeyHash] =
            field.fields[0].bytes;
        }
      }
    },
    {
      int: DatumParameterKey.SwapInAmount,
    },
    {
      int: DatumParameterKey.MinReceive,
    },
  ],
};
