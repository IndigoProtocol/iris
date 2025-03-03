import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { DatumParameterKey, Dex } from "../../constants";
import { Utxo } from "../../types";
import { Asset, Token } from "./Asset";
import { LiquidityPool } from "./LiquidityPool";
import { OperationStatus } from "./OperationStatus";

export type PoolStateExtraData = {
  feeNumerator: number;
  feeDenominator: number;
  minAda: string;
  batcherFee: string;
} & { [key in DatumParameterKey]?: string | number | undefined };

@Entity({ name: "liquidity_pool_states" })
export class LiquidityPoolState extends BaseEntity {
  dex: Dex;
  address: string;
  liquidityPoolIdentifier: string;
  tokenA: Asset | undefined;
  tokenB: Asset;
  possibleOperationInputs: OperationStatus[];
  transactionInputs: Utxo[];
  transactionOutputs: Utxo[];

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LiquidityPool)
  @JoinColumn()
  liquidityPool: Relation<LiquidityPool>;

  @OneToOne(() => Asset)
  @JoinColumn()
  tokenLp: Asset;

  @Column({ type: "bigint", unsigned: true })
  reserveA: number;

  @Column({ type: "bigint", unsigned: true })
  reserveB: number;

  @Column({ type: "bigint", unsigned: true })
  lpTokens: number;

  @Column({ type: "bigint", unsigned: true })
  tvl: number;

  @Column({ type: "float" })
  feePercent: number;

  @Column({ type: "bigint", unsigned: true })
  slot: number;

  @Column()
  txHash: string;

  @Column("simple-json")
  extra: PoolStateExtraData;

  static make(
    dex: Dex,
    address: string,
    liquidityPoolIdentifier: string,
    tokenA: Token,
    tokenB: Token,
    tokenLp: Asset,
    reserveA: number,
    reserveB: number,
    lpTokens: number,
    feePercent: number,
    slot: number,
    txHash: string,
    spentInputs: OperationStatus[] = [],
    transactionInputs: Utxo[] = [],
    transactionOutputs: Utxo[] = [],
    extra: PoolStateExtraData = {
      batcherFee: "0",
      feeDenominator: 10_000,
      feeNumerator: 0,
      minAda: "0",
    },
  ): LiquidityPoolState {
    let instance: LiquidityPoolState = new LiquidityPoolState();

    instance.dex = dex;
    instance.address = address;
    instance.liquidityPoolIdentifier = liquidityPoolIdentifier;
    instance.tokenLp = tokenLp;
    instance.lpTokens = lpTokens;
    instance.feePercent = feePercent;
    instance.slot = slot;
    instance.txHash = txHash;
    instance.possibleOperationInputs = spentInputs;
    instance.transactionInputs = transactionInputs;
    instance.transactionOutputs = transactionOutputs;
    instance.tvl = 0;
    instance.extra = extra;

    if (tokenA === "lovelace" && tokenB === "lovelace") {
      throw new Error("Both assets for pool are lovelace.");
    }

    // Always force tokenA to the ADA token
    if (tokenA === "lovelace") {
      instance.tokenA = undefined;
      instance.tokenB = tokenB as Asset;
      instance.reserveA = reserveA;
      instance.reserveB = reserveB;
    } else if (tokenB === "lovelace") {
      instance.tokenA = undefined;
      instance.tokenB = tokenA as Asset;
      instance.reserveA = reserveB;
      instance.reserveB = reserveA;
    } else {
      instance.tokenA = tokenA;
      instance.tokenB = tokenB;
      instance.reserveA = reserveA;
      instance.reserveB = reserveB;
    }

    return instance;
  }
}
