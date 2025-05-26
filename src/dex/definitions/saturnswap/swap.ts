import { DefinitionField } from '../../../types';
import { DatumParameterKey } from '../../../constants';

/**
 * SaturnSwap swap datum structure.
 * Maps the SwapDatum fields to DatumParameterKey values.
 */
export default {
    constructor: 0,
    fields: [
        // owner: Address (constructor with payment and stake credential)
        {
            constructor: 0,
            fields: [
                // payment_credential
                {
                    constructor: 0,
                    fields: [
                        {
                            bytes: DatumParameterKey.SenderPubKeyHash
                        }
                    ]
                },
                // stake_credential (optional)
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
        },
        // policy_id_sell
        {
            bytes: DatumParameterKey.SwapInTokenPolicyId
        },
        // asset_name_sell
        {
            bytes: DatumParameterKey.SwapInTokenAssetName
        },
        // amount_sell
        {
            int: DatumParameterKey.SwapInAmount
        },
        // policy_id_buy
        {
            bytes: DatumParameterKey.SwapOutTokenPolicyId
        },
        // asset_name_buy
        {
            bytes: DatumParameterKey.SwapOutTokenAssetName
        },
        // amount_buy (minimum expected)
        {
            int: DatumParameterKey.MinReceive
        },
        // valid_before_time: Option<Int>
        [
            {
                constructor: 0,
                fields: [
                    {
                        int: DatumParameterKey.Expiration
                    }
                ]
            },
            {
                constructor: 1,
                fields: []
            }
        ],
        // output_reference: OutputReference
        {
            constructor: 0,
            fields: [
                // transaction_id
                {
                    constructor: 0,
                    fields: [
                        {
                            bytes: DatumParameterKey.Unknown
                        }
                    ]
                },
                // output_index
                {
                    int: DatumParameterKey.Unknown
                }
            ]
        }
    ]
} as DefinitionField; 