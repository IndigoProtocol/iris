export type StakingManagerHistoryRow = {
    hash: string;
    slot: number;
    tx_block_index: number;
    output_hash: string;
    output_index: number;
    total_stake: bigint;
    snapshot_ada: bigint;
    version: string;
};
