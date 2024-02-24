import { LiquidityPoolState } from './db/entities/LiquidityPoolState';

export enum DatumParameterKey {
    Action = 'Action',
    SenderPubKeyHash = 'SenderPubKeyHash',
    SenderStakingKeyHash = 'SenderStakingKeyHash',
    ReceiverPubKeyHash = 'ReceiverPubKeyHash',
    ReceiverStakingKeyHash = 'ReceiverStakingKeyHash',
    SwapInAmount = 'SwapInAmount',
    MinReceive = 'MinReceive',
    MinReceiveA = 'MinReceiveA',
    MinReceiveB = 'MinReceiveB',
    Expiration = 'Expiration',
    AllowPartialFill = 'AllowPartialFill',
    Deposit = 'Deposit',
    DepositA = 'DepositA',
    DepositB = 'DepositB',
    LpTokens = 'LpTokens',
    StakeAdminPolicy  = 'StakeAdminPolicy',

    TotalFees = 'TotalFees',
    BatcherFee = 'BatcherFee',
    DepositFee = 'DepositFee',
    ScooperFee = 'ScooperFee',
    ExecutionFee = 'ExecutionFee',
    MakerFee = 'MakerFee',
    TakerFee = 'TakerFee',
    ContainedFee = 'ContainedFee',
    ContainedFeePayment = 'ContainedFeePayment',
    PoolIdentifier = 'PoolIdentifier',
    TotalLpTokens = 'TotalLpTokens',
    LpFee = 'LpFee',
    LpFeeNumerator = 'LpFeeNumerator',
    LpFeeDenominator = 'LpFeeDenominator',

    TokenPolicyId = 'TokenPolicyId',
    TokenAssetName = 'TokenAssetName',
    SwapInTokenPolicyId = 'SwapInTokenPolicyId',
    SwapInTokenAssetName = 'SwapInTokenAssetName',
    SwapOutTokenPolicyId = 'SwapOutTokenPolicyId',
    SwapOutTokenAssetName = 'SwapOutTokenAssetName',
    PoolAssetAPolicyId = 'PoolAssetAPolicyId',
    PoolAssetAAssetName = 'PoolAssetAAssetName',
    PoolAssetATreasury = 'PoolAssetATreasury',
    PoolAssetBPolicyId = 'PoolAssetBPolicyId',
    PoolAssetBAssetName = 'PoolAssetBAssetName',
    LpTokenPolicyId = 'LpTokenPolicyId',
    LpTokenAssetName = 'LpTokenAssetName',

    PoolAssetBTreasury = 'PoolAssetBTreasury',
    RootKLast = 'RootKLast',
    LastInteraction = 'LastInteraction',
    RequestScriptHash = 'RequestScriptHash',
    LqBound = 'LqBound',
    OriginalOffer = 'OriginalOffer',
    LeftOverOffer = 'LeftOverOffer',
    PriceNumerator = 'PriceNumerator',
    PriceDenominator = 'PriceDenominator',
    PastOrderFills = 'PastOrderFills',
    ConsumedTxHash = 'ConsumedTxHash',
    Unknown = 'Unknown',
}

export enum Dex {
    Minswap = 'Minswap',
    SundaeSwap = 'SundaeSwap',
    WingRiders = 'WingRiders',
    MuesliSwap = 'MuesliSwap',
    Spectrum = 'Spectrum',
    TeddySwap = 'TeddySwap',
    GeniusYield = 'GeniusYield',
}

export enum IndexerEventType {
    AmmDexOperation = 'AmmDexOperation',
    OrderBookDexOperation = 'OrderBookDexOperation',
    Sync = 'Sync',
    LiquidityPool = 'LiquidityPool',
    LiquidityPoolState = 'LiquidityPoolState',
    OrderBook = 'OrderBook',
    Asset = 'Asset',
    LiquidityPoolTick = 'LiquidityPoolTick',
    OrderBookTick = 'OrderBookTick',
}

export enum DexOperationStatus {
    Pending = 0,
    OnChain = 1,
    Complete = 2,
    Cancelled = 3,
}

export enum SwapOrderType {
    Instant = 0,
    Limit = 1,
}

export enum ApplicationContext {
    Indexer = 'indexer',
    Api = 'api',
}

export enum TickInterval {
    Minute = '1m',
    Hour = '1h',
    Day = '1D',
}

export const FIRST_SYNC_SLOT: number = 50367177;
export const FIRST_SYNC_BLOCK_HASH: string = '91c16d5ae92f2eb791c3c2da9b38126b98623b07f611d4a4b913f0ab2af721d2';
