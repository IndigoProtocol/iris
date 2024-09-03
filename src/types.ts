import { DatumParameterKey } from './constants';
import { Asset, Token } from './db/entities/Asset';
import { LiquidityPoolSwap } from './db/entities/LiquidityPoolSwap';
import { LiquidityPoolZap } from './db/entities/LiquidityPoolZap';
import { LiquidityPoolState } from './db/entities/LiquidityPoolState';
import { LiquidityPoolDeposit } from './db/entities/LiquidityPoolDeposit';
import { LiquidityPoolWithdraw } from './db/entities/LiquidityPoolWithdraw';
import { OperationStatus } from './db/entities/OperationStatus';
import { OrderBookOrder } from './db/entities/OrderBookOrder';
import { OrderBookMatch } from './db/entities/OrderBookMatch';
import { Redeemer, Script } from '@cardano-ogmios/schema';

export interface Utxo {
    forTxHash: TxHash;
    toAddress: string;
    datum?: string;
    index: number;
    lovelaceBalance: bigint;
    assetBalances: AssetBalance[];
    script?: Script;
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
    redeemers: Redeemer[],
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

export type AddressMapping = {
    tokenA: Token,
    tokenB: Asset,
    lpToken: Asset,
    poolAddress: string,
    orderAddress: string,
    nftPolicyId: string,
    feePercent: number,
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

export type StatusableEntity = LiquidityPoolDeposit
    | LiquidityPoolWithdraw
    | LiquidityPoolSwap
    | LiquidityPoolZap;

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
export type DefinitionField = DefinitionConstr | DefinitionBytes | DefinitionInt | Function  | DefinitionField[];
export type HybridOperation = AmmDexOperation | OrderBookDexOperation;
