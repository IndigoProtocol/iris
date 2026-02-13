export type LimitedRedemptionPositionHistoryRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    version: string;
    owner: string;
    asset: string;
    lovelace_amount: number;
    max_price: number;
    claimable_amount: number;
    consumed?: number;
};

export type LimitedRedemptionPositionHistoryResult = {
    slot: number;
    output_hash: string;
    output_index: number;
    version: string;
    owner: string;
    asset: string;
    lovelace_amount: number;
    max_price: number;
    claimable_amount: number;
    consumed?: number;
};

