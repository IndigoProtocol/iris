export type ProtocolParameterHistoryRow = {
    hash: string;
    slot: number;
    output_hash: string;
    output_index: number;
    proposal_deposit: bigint;
    voting_period: bigint;
    effective_delay: bigint;
    expiration_period: bigint;
    protocol_fee_percentage: bigint;
    proposing_period: bigint;
    total_shards: bigint;
    minimum_quorum?: bigint;
    max_treasury_lovelace_spend?: bigint;
    max_treasury_indy_spend?: bigint;
    treasury_indy_withdrawn_amt?: bigint;
    version: string;
};
