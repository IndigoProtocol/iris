import { DatumParameterKey, IndexerEventType } from './constants';
import { Asset } from './db/entities/Asset';
import { LiquidityPoolSwap } from './db/entities/LiquidityPoolSwap';
import { LiquidityPoolZap } from './db/entities/LiquidityPoolZap';
import { LiquidityPoolState } from './db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from './db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from './db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from './db/entities/OperationStatus';
import { OrderBookOrder } from './db/entities/OrderBookOrder';
import { OrderBookMatch } from './db/entities/OrderBookMatch';

export interface Utxo {
    forTxHash: TxHash;
    toAddress: string;
    datum?: string;
    index: number;
    lovelaceBalance: bigint;
    assetBalances: AssetBalance[];
}

export interface Transaction {
    hash: TxHash;
    blockHash: string;
    blockSlot: number;
    inputs: Utxo[];
    outputs: Utxo[];
    fee: bigint;
    mints: AssetBalance[];
    datums: {
        [hash: string]: Datum;
    },
    metadata?: {
        [label: string]: any;
    },
    redeemers: {
        [label: string]: any;
    },
    scriptHashes?: string[],
}

export interface AssetBalance {
    asset: Asset;
    quantity: bigint;
}

export type DatumParameters = {
    [key in DatumParameterKey | string]?: string | number | bigint
}

export type DefinitionBytes = {
    bytes: string | DatumParameterKey,
}

export type DefinitionInt = {
    int: number | DatumParameterKey,
}

export type DefinitionConstr = {
    constructor: number | DatumParameterKey,
    fields: DefinitionField[],
}

export type AmmDexOperation = LiquidityPoolState
    | LiquidityPoolDeposit
    | LiquidityPoolWithdraw
    | LiquidityPoolSwap
    | LiquidityPoolZap
    | OperationStatus;

export type OrderBookDexOperation = OrderBookOrder
    | OrderBookMatch;

export type StatusableEntity = LiquidityPoolDeposit
    | LiquidityPoolWithdraw
    | LiquidityPoolSwap
    | LiquidityPoolZap;

export type IndexerEvent = {
    type: IndexerEventType,
    data: AmmDexOperation | OrderBookDexOperation,
}

export type TokenMetadata = {
    policyId: string,
    nameHex: string,
    name: string,
    decimals: number,
    ticker: string,
    logo: string,
    description: string,
}

export type OrderRouteBreakdown = {
    swapInAmount: number,
    splitPercentage: number,
    poolFeePercent: number,
    estimatedReceive: number,
    priceImpactPercent: number,
    dexFees: number,
    liquidityPool: Object,
}

export type OrderRouteResult = {
    [dex: string]: OrderRouteBreakdown,
}

export type OrderRouteResults = {
    totalSwapInAmount: number,
    totalEstimatedReceive: number,
    results: OrderRouteResult,
}

export type LimiterResultBreakdown = {
    swapInAmount: number,
    estimatedReceive: number,
    percentAllocated: number,
    dexFees: number,
    price: number,
}

export type LimiterResults = {
    totalSwapInAmount: number,
    totalEstimatedReceive: number,
    results: LimiterResultBreakdown[],
}

export type Datum = string;
export type TxHash = string;
export type DefinitionField = DefinitionConstr | DefinitionBytes | DefinitionInt | Function | DefinitionField[];
export type BroadcastableEvent = IndexerEvent;
