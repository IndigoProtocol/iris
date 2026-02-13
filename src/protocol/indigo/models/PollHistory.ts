import { TreasuryWithdrawalValue } from "../indexers/V2/PollV2Indexer";

export type PollHistoryRow = {
    hash: string;
    slot: number;
    output_hash: string;
    output_index: number;
    poll_id: bigint;
    owner: string;
    type: string;
    content: string;
    tallied_yes: bigint;
    tallied_no: bigint;
    end_time: bigint;
    created_shards: bigint;
    tallied_shards: bigint;
    total_shards: bigint;
    propose_end_time: bigint;
    expiration_time: bigint;
    protocol_version: bigint;
    version: string;
    treasury_withdrawal_address: string | null;
    treasury_withdrawal_value: TreasuryWithdrawalValue[] | null;
};

export type PollHistoryResult = {
    hash: string;
    slot: number;
    output_hash: string;
    output_index: number;
    poll_id: bigint;
    owner: string;
    type: string;
    content: string;
    tallied_yes: bigint;
    tallied_no: bigint;
    end_time: bigint;
    created_shards: bigint;
    tallied_shards: bigint;
    total_shards: bigint;
    propose_end_time: bigint;
    expiration_time: bigint;
    protocol_version: bigint;
    created_at: string;
    updated_at: string;
};
