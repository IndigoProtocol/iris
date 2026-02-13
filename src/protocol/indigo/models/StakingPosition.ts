export type StakingPositionRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    staked_indy: bigint;
    snapshot_ada: bigint;
    locked_amount: any; // TODO
    version: string;
};

export type StakingPositionResult = {
    id: number;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    staked_indy: bigint;
    snapshot_ada: bigint;
    locked_amount: any; // TODO
    utxo: string;
    created_at: string;
    updated_at: string;
};
