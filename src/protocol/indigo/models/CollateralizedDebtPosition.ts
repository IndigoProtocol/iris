export type CollateralizedDebtPositionRow = {
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string | undefined;
    asset: string;
    mintedAmount: number;
    collateralAmount: number;
    interest_last_updated?: number;
    interest_iasset_amount?: number;
    fee_lovelaces_treasury?: number;
    fee_lovelaces_indy_stakers?: number;
    frozen_cdp_accumulated_lovelaces_indy_stakers?: number;
    frozen_cdp_accumulated_lovelaces_treasury?: number;
    active_interest_tracking_unitary_interest_snapshot?: number;
    active_interest_tracking_last_settled?: number;
    version: string;
};

export type CollateralizedDebtPositionResult = {
    id: number;
    slot: number;
    output_hash: string;
    output_index: number;
    owner: string | undefined;
    asset: string;
    mintedAmount: number;
    collateralAmount: number;
    created_at: string;
    updated_at: string;
};
