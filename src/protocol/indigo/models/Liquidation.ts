export type LiquidationRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    asset: string;
    collateral_absorbed: bigint;
    iasset_burned: bigint;
    oracle_price?: bigint;
    ada_price?: bigint;
};

export type LiquidationResult = {
    id: number;
    slot: number;
    output_hash: string;
    output_index: number;
    asset: string;
    collateral_absorbed: bigint;
    iasset_burned: bigint;
    oracle_price?: bigint;
    ada_price?: bigint;
    created_at: string;
    updated_at: string;
};
