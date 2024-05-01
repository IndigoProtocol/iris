import {
    AssetBalance,
    DefinitionBytes,
    DefinitionConstr,
    DefinitionField,
    DefinitionInt,
    Transaction,
    Utxo
} from './types';
import { Lucid, Utils } from 'lucid-cardano';
import { Asset, Token } from './db/entities/Asset';
import { LiquidityPool } from './db/entities/LiquidityPool';
import { BlockAlonzo, BlockBabbage, Datum, TxAlonzo, TxBabbage, TxIn, TxOut } from '@cardano-ogmios/schema';

export const lucidUtils: Utils = new Utils(new Lucid());

export function toDefinitionDatum(unconstructedField: any): DefinitionField {
    if (unconstructedField?.fields) {
        return {
            constructor: unconstructedField.index,
            fields: unconstructedField.fields.map((field: any) => toDefinitionDatum(field)),
        } as DefinitionConstr;
    }

    if (typeof unconstructedField === 'bigint') {
        return {
            int: Number(unconstructedField)
        } as DefinitionInt;
    }

    if (typeof unconstructedField === 'string') {
        return {
            bytes: unconstructedField
        } as DefinitionBytes;
    }

    return unconstructedField;
}

export function tokenId(token: Token): string {
    return token === 'lovelace' ? 'lovelace' : token.identifier();
}

export function tokensMatch(tokenA: Token, tokenB: Token): boolean {
    return tokenId(tokenA) === tokenId(tokenB);
}

export function stringify(value: any): string {
    return JSON.stringify(value, (key: string, value: any) =>
        typeof value === 'bigint'
            ? Number(value)
            : value
    )
}

export function scriptHashToAddress(scriptHash: string): string {
    return lucidUtils.credentialToAddress(
        lucidUtils.scriptHashToCredential(scriptHash)
    );
}

export function tokenDecimals(token: Token, pool: LiquidityPool): number {
    if (pool.tokenA && tokensMatch(token, pool.tokenA)) {
        return pool.tokenA.decimals;
    }

    return pool.tokenB.decimals;
}

export function formatTransaction(block: BlockBabbage | BlockAlonzo, transaction: TxBabbage | TxAlonzo): Transaction {
    return {
        hash: transaction.id,
        blockHash: block.headerHash,
        blockSlot: block.header.slot,
        inputs: transaction.body.inputs.map((input: TxIn) => {
            return {
                forTxHash: input.txId,
                index: input.index,
            } as Utxo;
        }) as Utxo[],
        outputs: transaction.body.outputs.map((output: TxOut, index: number) => {
            return {
                forTxHash: transaction.id,
                toAddress: output.address,
                datum: output.datum
                    ? transaction.witness.datums[output.datum as Datum] ?? output.datum
                    : (output.datumHash ? transaction.witness.datums[output.datumHash] : undefined),
                index: index,
                lovelaceBalance: BigInt(output.value.coins),
                assetBalances: output.value.assets
                    ? Object.keys(output.value.assets).map((unit: string) => {
                        return {
                            asset: Asset.fromId(unit),
                            quantity: BigInt(output.value.assets ? output.value.assets[unit] : 0),
                        } as AssetBalance;
                    })
                    : [],
                script: output.script,
            } as Utxo;
        }) as Utxo[],
        fee: transaction.body.fee,
        mints: transaction.body.mint.assets
            ? Object.keys(transaction.body.mint.assets).map((unit: string) => {
                return {
                    asset: Asset.fromId(unit),
                    quantity: BigInt(transaction.body.mint.assets ? transaction.body.mint.assets[unit] : 0),
                } as AssetBalance;
            })
            : [],
        datums: transaction.witness.datums,
        metadata: transaction.metadata
            ? Object.keys(transaction.metadata.body.blob as Object).reduce((metadata: any, label: string) => {
                if (transaction.metadata && transaction.metadata.body.blob) {
                    metadata[label] = Object.values(transaction.metadata.body.blob[label])[0];
                }

                return metadata;
            }, {})
            : undefined,
        redeemers: Object.keys(transaction.witness.redeemers as Object).reduce((redeemers: any, label: string) => {
            redeemers[label] = transaction.witness.redeemers[label].redeemer;

            return redeemers;
        }, {}),
        scriptHashes: Object.keys(transaction.witness.scripts),
    };
}
