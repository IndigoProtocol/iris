import {
  AssetBalance,
  DefinitionBytes,
  DefinitionConstr,
  DefinitionField,
  DefinitionInt,
  Transaction,
  Utxo,
} from './types';
import { Asset, Token } from './db/entities/Asset';
import { LiquidityPool } from './db/entities/LiquidityPool';
import {
  BlockPraos,
  Transaction as OgmiosTransaction,
  TransactionOutput,
  TransactionOutputReference,
} from '@cardano-ogmios/schema';

export function toDefinitionDatum(unconstructedField: any): DefinitionField {
  if (unconstructedField?.fields) {
    return {
      constructor: unconstructedField.index,
      fields: unconstructedField.fields.map((field: any) =>
        toDefinitionDatum(field)
      ),
    } as DefinitionConstr;
  }

  if (unconstructedField instanceof Array) {
    return unconstructedField.map((field: any) => {
      return toDefinitionDatum(field);
    });
  }

  if (typeof unconstructedField === 'bigint') {
    return {
      int: unconstructedField,
    } as DefinitionInt;
  }

  if (typeof unconstructedField === 'string') {
    return {
      bytes: unconstructedField,
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
    typeof value === 'bigint' ? Number(value) : value
  );
}

export function tokenDecimals(token: Token, pool: LiquidityPool): number {
  if (pool.tokenA && tokensMatch(token, pool.tokenA)) {
    return pool.tokenA.decimals;
  }

  return pool.tokenB.decimals;
}

export function formatTransaction(
  block: BlockPraos | null,
  transaction: OgmiosTransaction
): Transaction {
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
    outputs: transaction.outputs.map(
      (output: TransactionOutput, index: number) => {
        return {
          forTxHash: transaction.id,
          toAddress: output.address,
          datum: output.datum
            ? transaction.datums && output.datum in transaction.datums
              ? transaction.datums[output.datum]
              : output.datum
            : transaction.datums && output.datumHash
              ? transaction.datums[output.datumHash]
              : undefined,
          index: index,
          lovelaceBalance: BigInt(output.value.ada.lovelace),
          assetBalances: output.value
            ? Object.keys(output.value)
                .filter((key: string) => key !== 'ada')
                .reduce((balances: AssetBalance[], policyId: string) => {
                  balances.push(
                    ...Object.keys(output.value[policyId]).map(
                      (nameHex: string) => {
                        return {
                          asset: Asset.fromId(`${policyId}${nameHex}`),
                          quantity: BigInt(
                            output.value ? output.value[policyId][nameHex] : 0
                          ),
                        } as AssetBalance;
                      }
                    )
                  );

                  return balances;
                }, [])
            : [],
          script: output.script,
        } as Utxo;
      }
    ) as Utxo[],
    references:
      transaction.references?.map((reference: TransactionOutputReference) => {
        return {
          forTxHash: reference.transaction.id,
          index: reference.index,
        } as Utxo;
      }) ?? ([] as Utxo[]),
    fee: transaction.fee?.ada.lovelace ?? 0n,
    mints: transaction.mint
      ? Object.keys(transaction.mint).reduce(
          (mints: AssetBalance[], policyId: string) => {
            if (!transaction.mint) return mints;

            mints.push(
              ...Object.keys(transaction.mint[policyId] ?? []).map(
                (nameHex: string) => {
                  return {
                    asset: Asset.fromId(`${policyId}${nameHex}`),
                    quantity: BigInt(
                      transaction.mint ? transaction.mint[policyId][nameHex] : 0
                    ),
                  } as AssetBalance;
                }
              )
            );

            return mints;
          },
          []
        )
      : [],
    datums: transaction.datums ?? {},
    metadata: transaction.metadata
      ? Object.keys(transaction.metadata.labels).reduce(
          (metadata: any, label: string) => {
            if (transaction.metadata) {
              metadata[label] = transaction.metadata.labels[label].json;
            }

            return metadata;
          },
          {}
        )
      : undefined,
    redeemers: transaction.redeemers ?? [],
    scriptHashes: Object.keys(transaction.scripts ?? {}),
  };
}
