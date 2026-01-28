export type StabilityPoolAccountRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    asset: string;
    snapshotP: bigint;
    snapshotD: bigint;
    snapshotS: bigint;
    snapshotEpoch: bigint;
    snapshotScale: bigint;
    request: string;
    version: string;
};

export type StabilityPoolAccountResult = {
    id: number;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string;
    asset: string;
    snapshotP: bigint;
    snapshotD: bigint;
    snapshotS: bigint;
    snapshotEpoch: bigint;
    snapshotScale: bigint;
    request: string;
    created_at: string;
    updated_at: string;
};
