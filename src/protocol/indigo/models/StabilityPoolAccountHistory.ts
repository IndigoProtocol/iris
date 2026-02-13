import { StabilityPoolSnapshot } from './StabilityPoolSnapshot';

export type StabilityPoolAccountHistoryRow = {
    hash: string;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    asset: string;
    snapshot: StabilityPoolSnapshot;
    version: string;
};

export type StabilityPoolAccountHistoryResult = {
    hash: string;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    asset: string;
    snapshot: StabilityPoolSnapshot;
    created_at: string;
    updated_at: string;
};
