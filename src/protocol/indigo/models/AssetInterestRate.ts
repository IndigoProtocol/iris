type AssetInterestRate = {
    slot: number;
    output_hash: string;
    output_index: number;
    asset: string;
    unitary_interest: bigint;
    interest_rate: bigint;
    last_interest_update: bigint;
    address: string;
};

export default AssetInterestRate;
