export type CdpHistoryRow = {
    hash: string;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    asset: string;
    mintedAmount: number;
    collateralAmount: number;
};

export type CdpHistoryResult = {
    hash: string;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    asset: string;
    mintedAmount: number;
    collateralAmount: number;
    created_at: string;
    updated_at: string;
};
