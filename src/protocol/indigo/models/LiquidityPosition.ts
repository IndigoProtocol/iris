export type LiquidityPositionRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string | undefined;
    value: string;
    utxo: string;
};

export type LiquidityPositionResult = {
    id: number;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string | undefined;
    value: string;
    utxo: string;
    created_at: string;
    updated_at: string;
};
