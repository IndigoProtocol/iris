export type RedemptionRow = {
    slot: number;
    tx_hash: string;
    asset: string;
    type: 'CDP' | 'LRP';
    cdp_owner: string | undefined;
    redeemed_amount: bigint;
    interest: bigint;
    lovelaces_returned: bigint;
    processing_fee_lovelaces: bigint;
    reimbursement_fee_lovelaces: bigint;
    oracle_price?: bigint;
    ada_price?: bigint;
};

export type RedemptionResult = {
    id: number;
    slot: number;
    tx_hash: string;
    asset: string;
    cdp_owner: string | undefined;
    redeemed_amount: bigint;
    interest: bigint;
    lovelaces_returned: bigint;
    processing_fee_lovelaces: bigint;
    reimbursement_fee_lovelaces: bigint;
    oracle_price?: bigint;
    ada_price?: bigint;
    created_at: string;
    updated_at: string;
};
