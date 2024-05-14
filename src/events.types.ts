import { LiquidityPool } from './db/entities/LiquidityPool';
import { LiquidityPoolState } from './db/entities/LiquidityPoolState';
import { LiquidityPoolSwap } from './db/entities/LiquidityPoolSwap';
import { LiquidityPoolDeposit } from './db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from './db/entities/LiquidityPoolWithdraw';
import { LiquidityPoolZap } from './db/entities/LiquidityPoolZap';
import { LiquidityPoolTick } from './db/entities/LiquidityPoolTick';
import { OperationStatus } from './db/entities/OperationStatus';
import { OrderBook } from './db/entities/OrderBook';
import { OrderBookOrder } from './db/entities/OrderBookOrder';
import { OrderBookMatch } from './db/entities/OrderBookMatch';
import { Asset } from './db/entities/Asset';
import { OrderBookTick } from './db/entities/OrderBookTick';
import { Sync } from './db/entities/Sync';

/**
 * Universal
 */
export type SyncUpdated = {
    type: 'SyncUpdated',
    data: Sync,
}

export type AssetCreated = {
    type: 'AssetCreated',
    data: Asset,
}

export type AssetUpdated = {
    type: 'AssetUpdated',
    data: Asset,
}

/**
 * AMM
 */
export type LiquidityPoolCreated = {
    type: 'LiquidityPoolCreated',
    data: LiquidityPool,
}
export type LiquidityPoolUpdated = {
    type: 'LiquidityPoolUpdated',
    data: LiquidityPool,
}

export type LiquidityPoolStateCreated = {
    type: 'LiquidityPoolStateCreated',
    data: LiquidityPoolState,
}

export type LiquidityPoolStateUpdated = {
    type: 'LiquidityPoolStateUpdated',
    data: LiquidityPoolState,
}

export type LiquidityPoolSwapCreated = {
    type: 'LiquidityPoolSwapCreated',
    data: LiquidityPoolSwap,
}

export type LiquidityPoolSwapUpdated = {
    type: 'LiquidityPoolSwapUpdated',
    data: LiquidityPoolSwap,
}

export type LiquidityPoolZapCreated = {
    type: 'LiquidityPoolZapCreated',
    data: LiquidityPoolZap,
}

export type LiquidityPoolZapUpdated = {
    type: 'LiquidityPoolZapUpdated',
    data: LiquidityPoolZap,
}

export type LiquidityPoolDepositCreated = {
    type: 'LiquidityPoolDepositCreated',
    data: LiquidityPoolDeposit,
}

export type LiquidityPoolDepositUpdated = {
    type: 'LiquidityPoolDepositUpdated',
    data: LiquidityPoolDeposit,
}

export type LiquidityPoolWithdrawCreated = {
    type: 'LiquidityPoolWithdrawCreated',
    data: LiquidityPoolWithdraw,
}

export type LiquidityPoolWithdrawUpdated = {
    type: 'LiquidityPoolWithdrawUpdated',
    data: LiquidityPoolWithdraw,
}

export type LiquidityPoolTickCreated = {
    type: 'LiquidityPoolTickCreated',
    data: LiquidityPoolTick,
}

export type LiquidityPoolTickUpdated = {
    type: 'LiquidityPoolTickUpdated',
    data: LiquidityPoolTick,
}

export type OperationStatusCreated = {
    type: 'OperationStatusCreated',
    data: OperationStatus,
}

/**
 * OrderBook
 */
export type OrderBookCreated = {
    type: 'OrderBookCreated',
    data: OrderBook,
}

export type OrderBookUpdated = {
    type: 'OrderBookUpdated',
    data: OrderBook,
}

export type OrderBookOrderCreated = {
    type: 'OrderBookOrderCreated',
    data: OrderBookOrder,
}

export type OrderBookOrderUpdated = {
    type: 'OrderBookOrderUpdated',
    data: OrderBookOrder,
}

export type OrderBookMatchCreated = {
    type: 'OrderBookMatchCreated',
    data: OrderBookMatch,
}

export type OrderBookTickCreated = {
    type: 'OrderBookTickCreated',
    data: OrderBookTick,
}

export type OrderBookTickUpdated = {
    type: 'OrderBookTickUpdated',
    data: OrderBookTick,
}

export type IrisEvent =
    | SyncUpdated
    | AssetCreated
    | AssetUpdated
    | LiquidityPoolCreated
    | LiquidityPoolUpdated
    | LiquidityPoolStateCreated
    | LiquidityPoolStateUpdated
    | LiquidityPoolSwapCreated
    | LiquidityPoolSwapUpdated
    | LiquidityPoolZapCreated
    | LiquidityPoolZapUpdated
    | LiquidityPoolDepositCreated
    | LiquidityPoolDepositUpdated
    | LiquidityPoolWithdrawCreated
    | LiquidityPoolWithdrawUpdated
    | LiquidityPoolTickCreated
    | LiquidityPoolTickUpdated
    | OperationStatusCreated
    | OrderBookCreated
    | OrderBookUpdated
    | OrderBookOrderCreated
    | OrderBookOrderUpdated
    | OrderBookMatchCreated
    | OrderBookTickCreated
    | OrderBookTickUpdated;