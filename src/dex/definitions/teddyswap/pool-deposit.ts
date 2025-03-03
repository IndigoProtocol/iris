import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/spectrum-finance/cardano-dex-contracts/blob/master/cardano-dex-contracts-offchain/ErgoDex/Contracts/Proxy/Deposit.hs
 */
export default {
  constructor: 0,
  fields: [
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
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.LpTokenPolicyId,
        },
        {
          bytes: DatumParameterKey.LpTokenAssetName,
        },
      ],
    },
    {
      int: DatumParameterKey.ExecutionFee,
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
      int: DatumParameterKey.Deposit,
    },
  ],
};
