export type SyncRow = {
    block_hash: string;
    slot: number;
};

export type SyncResult = {
    id: number;
    block_hash: string;
    slot: number;
    created_at: string;
    updated_at: string;
};
