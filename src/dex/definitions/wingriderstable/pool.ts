import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/WingRiders/dex-v2-contracts/blob/master/src/DEX/Pool/Stableswap.hs#L127
 * Transaction datum example: https://cardanoscan.io/transaction/a8b780e1d394b96c9eb0c256604ceaef4618acdd1b6f0125ea84aa27145e483c
 */
export default {
  constructor: 0,
  fields: [
    {
      bytes: DatumParameterKey.RequestScriptHash,
    },
    {
      bytes: DatumParameterKey.PoolAssetAPolicyId,
    },
    {
      bytes: DatumParameterKey.PoolAssetAAssetName,
    },
    {
      bytes: DatumParameterKey.PoolAssetBPolicyId,
    },
    {
      bytes: DatumParameterKey.PoolAssetBAssetName,
    },
    {
      int: DatumParameterKey.SwapFeeInBasis,
    },
    {
      int: DatumParameterKey.ProtocolFeeInBasis,
    },
    {
      int: DatumParameterKey.ProjectFeeInBasis,
    },
    {
      int: DatumParameterKey.ReserveFeeInBasis,
    },
    {
      int: DatumParameterKey.FeeBasis,
    },
    {
      int: DatumParameterKey.AgentFee,
    },
    {
      int: DatumParameterKey.LastInteraction,
    },
    {
      int: DatumParameterKey.PoolAssetATreasury,
    },
    {
      int: DatumParameterKey.PoolAssetBTreasury,
    },
    {
      int: DatumParameterKey.ProjectTreasuryA,
    },
    {
      int: DatumParameterKey.ProjectTreasuryB,
    },
    {
      int: DatumParameterKey.ReserveTreasuryA,
    },
    {
      int: DatumParameterKey.ReserveTreasuryB,
    },
    (field: DefinitionField, parameters: DatumParameters) => {
      return parameters;
    },
    (field: DefinitionField, parameters: DatumParameters) => {
      return parameters;
    },
    {
      constructor: 0,
      fields: [
        {
          int: DatumParameterKey.InvariantD,
        },
        {
          int: DatumParameterKey.Multiplier0,
        },
        {
          int: DatumParameterKey.Multiplier1,
        },
      ],
    },
  ],
};
