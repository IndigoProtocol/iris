export type CollectorHistoryRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    ada_value: bigint;
    version: string;
};

export type CollectorHistoryResult = {
    id: number;
    slot: number;
    output_hash: string;
    output_index: number;
    ada_value: number;
    consumed: number;
};
