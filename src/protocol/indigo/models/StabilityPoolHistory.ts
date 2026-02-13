import { StabilityPoolSnapshot } from './StabilityPoolSnapshot';

export type StabilityPoolHistoryRow = {
    hash: string;
    slot: number;
    tx_block_index: number;
    output_hash: string;
    output_index: number;
    asset: string;
    snapshot: StabilityPoolSnapshot;
    epochToScaleToSum: string;
    version: string;
};

export type StabilityPoolHistoryResult = {
    hash: string;
    slot: number;
    tx_block_index: number;
    output_hash: string;
    output_index: number;
    asset: string;
    snapshot: StabilityPoolSnapshot;
    epochToScaleToSum: string;
    created_at: string;
    updated_at: string;
};
