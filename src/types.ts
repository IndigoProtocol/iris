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
import { OrderBook } from './db/entities/OrderBook';
import { LiquidityPool } from '@indigo-labs/dexter';
import { Sync } from './db/entities/Sync';
import { LiquidityPoolTick } from './db/entities/LiquidityPoolTick';
import { OrderBookTick } from './db/entities/OrderBookTick';

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

export type OrderBookOrderCancellation = {
    type: 'OrderBookOrderCancellation',
    senderPubKeyHash: string | null,
    senderStakeKeyHash: string | null,
    txHash: string,
}

export type OrderBookDexOperation = OrderBookOrder
    | OrderBookMatch
    | OrderBookOrderCancellation;

export type CreatedEntity = Sync
    | OrderBook
    | LiquidityPool
    | LiquidityPoolTick
    | OrderBookTick
    | Asset;

export type StatusableEntity = LiquidityPoolDeposit
    | LiquidityPoolWithdraw
    | LiquidityPoolSwap
    | LiquidityPoolZap;

export type IndexerEvent = {
    type: IndexerEventType,
    data: AmmDexOperation | OrderBookDexOperation | CreatedEntity,
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

export type Datum = string;
export type TxHash = string;
export type DefinitionField = DefinitionConstr | DefinitionBytes | DefinitionInt | Function | DefinitionField[];
export type BroadcastableEvent = IndexerEvent;
