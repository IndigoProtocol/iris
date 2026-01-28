export type TreasuryHistoryRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    lovelace_value: bigint;
    version: string;
};

export type TreasuryHistoryResult = {
    slot: number;
    output_hash: string;
    output_index: number;
    lovelace_value: bigint | undefined;
    version: string;
};
