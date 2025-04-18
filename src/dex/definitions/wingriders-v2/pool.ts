import { DatumParameterKey } from '../../../constants';
import { DatumParameters, DefinitionField } from '../../../types';

/**
 * https://github.com/WingRiders/dex-v2-contracts/blob/master/src/DEX/Pool/ConstantProduct.hs
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
      int: DatumParameterKey.SwapFee,
    },
    {
      int: DatumParameterKey.ProtocolFee,
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
    (field: DefinitionField, parameters: DatumParameters) => {
      return parameters;
    },
  ],
};
