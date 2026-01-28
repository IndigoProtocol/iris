export type PollShardRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    poll_id: bigint;
    yes_votes: bigint;
    no_votes: bigint;
    end_time: bigint;
    manager_address: string;
    utxo: string;
};

export type PollShardResult = {
    id: number;
    slot: number;
    output_hash: string;
    output_index: number;
    poll_id: bigint;
    yes_votes: bigint;
    no_votes: bigint;
    end_time: bigint;
    manager_address: string;
    utxo: string;
    created_at: string;
    updated_at: string;
};
