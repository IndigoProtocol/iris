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
import {
    Block,
    BlockPraos,
    Transaction as OgmiosTransaction,
    Origin,
    PointOrOrigin,
    Tip,
    TransactionOutput,
    TransactionOutputReference
} from '@cardano-ogmios/schema';
import PQueue from 'p-queue';
import { logError, logInfo } from './logger';

export const lucidUtils: Utils = new Utils(new Lucid());

export function toDefinitionDatum(unconstructedField: any): DefinitionField {
    if (unconstructedField?.fields) {
        return {
            constructor: unconstructedField.index,
            fields: unconstructedField.fields.map((field: any) => toDefinitionDatum(field)),
        } as DefinitionConstr;
    }

    if (unconstructedField instanceof Array) {
        return unconstructedField.map((field: any) => {
            return toDefinitionDatum(field);
        })
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

export function formatTransaction(block: BlockPraos | null, transaction: OgmiosTransaction): Transaction {
    return {
        hash: transaction.id,
        blockHash: block?.id ?? '',
        blockSlot: block?.slot ?? 0,
        inputs: transaction.inputs.map((input: TransactionOutputReference) => {
            return {
                forTxHash: input.transaction.id,
                index: input.index,
            } as Utxo;
        }) as Utxo[],
        outputs: transaction.outputs.map((output: TransactionOutput, index: number) => {
            return {
                forTxHash: transaction.id,
                toAddress: output.address,
                datum: output.datum
                    ? (transaction.datums && output.datum in transaction.datums ? transaction.datums[output.datum] : output.datum)
                    : (transaction.datums && output.datumHash ? transaction.datums[output.datumHash] : undefined),
                index: index,
                lovelaceBalance: BigInt(output.value.ada.lovelace),
                assetBalances: output.value
                    ? Object.keys(output.value)
                        .filter((key: string) => key !== 'ada')
                        .reduce((balances: AssetBalance[], policyId: string) => {
                            balances.push(
                                ...Object.keys(output.value[policyId]).map((nameHex: string) => {
                                    return {
                                        asset: Asset.fromId(`${policyId}${nameHex}`),
                                        quantity: BigInt(output.value ? output.value[policyId][nameHex] : 0),
                                    } as AssetBalance;
                                })
                            );

                            return balances;
                        }, [])
                    : [],
                script: output.script,
            } as Utxo;
        }) as Utxo[],
        fee: transaction.fee?.ada.lovelace ?? 0n,
        mints: transaction.mint?.assets
            ? Object.keys(transaction.mint)
                .reduce((mints: AssetBalance[], policyId: string) => {
                    if (! transaction.mint) return mints;

                    mints.push(
                        ...Object.keys(transaction.mint[policyId] ?? []).map((nameHex: string) => {
                            return {
                                asset: Asset.fromId(`${policyId}${nameHex}`),
                                quantity: BigInt(transaction.mint ? transaction.mint[policyId][nameHex] : 0),
                            } as AssetBalance;
                        })
                    );

                    return mints;
                }, [])
            : [],
        datums: transaction.datums ?? {},
        metadata: transaction.metadata
            ? Object.keys(transaction.metadata.labels).reduce((metadata: any, label: string) => {
                if (transaction.metadata) {
                    metadata[label] = transaction.metadata.labels[label].json;
                }

                return metadata;
            }, {})
            : undefined,
        redeemers: transaction.redeemers ?? [],
        scriptHashes: Object.keys(transaction.scripts ?? {}),
    };
}

type ForwardBlock = { block: Block, tip: Tip | Origin};
type BackwardBlock = { point: PointOrOrigin };

export class QueueProcessor {
    private queue: PQueue; // Use p-queue for queue management
    private maxSize: number;

    constructor(
        maxSize: number,
        private rollForward: (update: ForwardBlock) => Promise<void>,
        private rollBackward: (update: BackwardBlock) => Promise<void>
    ) {
        this.maxSize = maxSize;
        this.queue = new PQueue({
            concurrency: 1, // Ensure sequential processing
            autoStart: true, // Automatically start processing tasks
        });
    }

    async enqueue(response: ForwardBlock | BackwardBlock, requestNext: () => void): Promise<void> {
        try {
            // Add the task to the queue
            this.queue.add(async () => {
                if ('block' in response) {
                    await this.rollForward(response);
                } else {
                    await this.rollBackward(response);
                }
            });

            // Call next block when there's room
            await this.queue.onSizeLessThan(this.maxSize)
            requestNext();
        } catch (error) {
            logError(`BlockQueue.enqueue error: ${error}`);
        }
    }

    async stopProcessing(): Promise<void> {
        logInfo('Stopping Queue Processor...');
        this.queue.pause(); // Pause the queue
        await this.queue.onIdle(); // Wait until all tasks are finished
    }

    queueSize(): number {
        return this.queue.size;
    }
}