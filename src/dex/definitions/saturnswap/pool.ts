import { DefinitionField } from '../../../types';
import { DatumParameterKey } from '../../../constants';

/**
 * SaturnSwap ControlDatum structure.
 * Used for liquidity management - represents price ranges and parameters.
 */
export default {
    constructor: 2, // ControlDatum constructor index
    fields: [
        // policy_id_one
        {
            bytes: DatumParameterKey.PoolAssetAPolicyId
        },
        // asset_name_one
        {
            bytes: DatumParameterKey.PoolAssetAAssetName
        },
        // min_one_price
        {
            int: DatumParameterKey.Unknown // MinPrice not in standard keys
        },
        // max_one_price
        {
            int: DatumParameterKey.Unknown // MaxPrice not in standard keys
        },
        // precision_one
        {
            int: DatumParameterKey.AScale
        },
        // policy_id_two
        {
            bytes: DatumParameterKey.PoolAssetBPolicyId
        },
        // asset_name_two
        {
            bytes: DatumParameterKey.PoolAssetBAssetName
        },
        // min_two_price
        {
            int: DatumParameterKey.Unknown // MinPrice not in standard keys
        },
        // max_two_price
        {
            int: DatumParameterKey.Unknown // MaxPrice not in standard keys
        },
        // precision_two
        {
            int: DatumParameterKey.BScale
        },
        // is_active: Bool
        [
            {
                constructor: 0, // False
                fields: []
            },
            {
                constructor: 1, // True
                fields: []
            }
        ]
    ]
} as DefinitionField; 