import { PointOrOrigin } from '@cardano-ogmios/schema';
import { AssetHistoryRow } from '../models/AssetHistory';
import {
    StabilityPoolHistoryResult,
    StabilityPoolHistoryRow,
} from '../models/StabilityPoolHistory';
import {
    CollateralizedDebtPositionResult,
    CollateralizedDebtPositionRow,
} from '../models/CollateralizedDebtPosition';
import OracleRow from '../models/OracleRow';
import { PriceRow } from '../models/Price';
import {
    StabilityPoolAccountResult,
    StabilityPoolAccountRow,
} from '../models/StabilityPoolAccount';
import { SyncResult, SyncRow } from '../models/Sync';
import { StakingManagerHistoryRow } from '../models/StakingManagerHistory';
import {
    StakingPositionResult,
    StakingPositionRow,
} from '../models/StakingPosition';
import { PollHistoryRow } from '../models/PollHistory';
import { ProtocolParameterHistoryRow } from '../models/ProtocolParameterHistory';
import { PollShardResult, PollShardRow } from '../models/PollShard';
import { LiquidityPositionRow } from '../models/LiquidityPosition';
import { LiquidationRow } from '../models/Liquidation';
import {
    CollectorHistoryResult,
    CollectorHistoryRow,
} from '../models/CollectorHistory';
import { DistributionEventRow } from '../models/DistributionEvent';
import { VoteHistory } from '../models/VoteHistory';
import { RedemptionRow } from '../models/Redemption';
import { CdpCreatorHistoryRow } from '../models/CdpCreatorHistory';
import { TreasuryHistoryResult, TreasuryHistoryRow } from '../models/TreasuryHistory';
import { VersionRecordHistoryRow } from '../models/VersionRecordHistory';
import InterestOracleRow from '../models/InterestOracleRow';
import AssetInterestRate from '../models/AssetInterestRate';
import { MinswapFeeDistribution } from '../models/MinswapFeeDistribution';
import { LimitedRedemptionPositionHistoryResult, LimitedRedemptionPositionHistoryRow } from '../models/LimitedRedemptionPositionHistory';

export interface CoreDatabase {
    connect(): Promise<void>;
    
    createStakingPositionRecord(owner: string, id: string, index: number, stakedAmount: bigint, slot: number, referral: string | null): Promise<number>;
    createStakingPositionRecordHistory(stakingPositionRecordId: number, outputHash: string, outputIndex: number, action: 'open' | 'adjust' | 'closed', slot: number, stakedAmount: bigint, referral: string | null): Promise<void>;
    getStakingPositionRecord(inputs: [string, number][]): Promise<number | null>;
    updateStakingPositionRecord(stakingPositionRecordId: number, stakedAmount: bigint, outputHash: string, outputIndex: number, referral: string | null): Promise<void>;
    closeStakingPositionRecord(stakingPositionRecordId: number, slot: number): Promise<void>;

    insertAssetHistory(record: AssetHistoryRow): Promise<void>;
    deleteAssetHistoryBySlot(slot: number): Promise<void>;

    insertStabilityPoolHistory(record: StabilityPoolHistoryRow): Promise<void>;
    deleteStabilityPoolHistoryBySlot(slot: number): Promise<void>;

    insertCollateralizedDebtPosition(
        record: CollateralizedDebtPositionRow
    ): Promise<void>;
    deleteCollateralizedDebtPositionBySlot(slot: number): Promise<void>;
    unmarkConsumedCollateralizedDebtPositionBySlot(slot: number): Promise<void>;
    markCollateralizedDebtPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;

    insertPrice(record: PriceRow): Promise<void>;
    deletePriceBySlot(slot: number): Promise<void>;

    insertAssetInterestRate(record: AssetInterestRate): Promise<void>;
    deleteAssetInterestRateBySlot(slot: number): Promise<void>;

    insertStabilityPoolAccount(record: StabilityPoolAccountRow): Promise<void>;
    deleteStabilityPoolAccountBySlot(slot: number): Promise<void>;
    unmarkConsumedStabilityPoolAccountBySlot(slot: number): Promise<void>;
    markStabilityPoolAccountInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;

    getCollateralizedDebtPositionFromOutput(
        inputs: [string, number][]
    ): Promise<CollateralizedDebtPositionResult[]>;
    getStabilityPoolFromOutput(
        inputs: [string, number][]
    ): Promise<StabilityPoolHistoryResult[]>;
    getStabilityPoolAccountFromOutput(
        inputs: [string, number][]
    ): Promise<StabilityPoolAccountResult[]>;
    getStakingPositionFromOutput(
        inputs: [string, number][]
    ): Promise<StakingPositionResult[]>;
    getPollShardFromOutput(
        inputs: [string, number][]
    ): Promise<PollShardResult[]>;
    getIAssetOracles(): Promise<OracleRow[]>;
    getIAssetInterestOracles(): Promise<InterestOracleRow[]>;
    getIAsset(name: string): Promise<AssetHistoryRow>;

    insertStakingManagerHistory(
        record: StakingManagerHistoryRow
    ): Promise<void>;
    deleteStakingManagerHistoryBySlot(slot: number): Promise<void>;

    insertStakingPosition(record: StakingPositionRow): Promise<void>;

    deleteStakingPositionBySlot(slot: number): Promise<void>;
    unmarkConsumedStakingPositionBySlot(slot: number): Promise<void>;
    markStakingPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;

    insertPollHistory(record: PollHistoryRow): Promise<void>;
    deletePollHistoryBySlot(slot: number): Promise<void>;
    markPollHistoryAsClosed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;

    insertProtocolParameterHistory(
        record: ProtocolParameterHistoryRow
    ): Promise<void>;
    deleteProtocolParameterHistoryBySlot(slot: number): Promise<void>;

    insertPollShard(record: PollShardRow): Promise<void>;
    updatePollShard(id: number, record: PollShardRow): Promise<void>;
    deletePollShard(id: number): Promise<void>;

    insertLiquidityPosition(record: LiquidityPositionRow): Promise<void>;
    deleteLiquidityPositionBySlot(slot: number): Promise<void>;
    unmarkConsumedLiquidityPositionBySlot(slot: number): Promise<void>;
    markLiquidityPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;

    getLiquidityPositionInputs(): Promise<[string, number][]>;

    insertLiquidation(record: LiquidationRow): Promise<void>;
    deleteLiquidationBySlot(slot: number): Promise<void>;

    insertRedemption(record: RedemptionRow): Promise<void>;
    deleteRedemptionBySlot(slot: number): Promise<void>;

    getCollectorFromOutput(
        inputs: [string, number][]
    ): Promise<CollectorHistoryResult[]>;
    insertCollector(record: CollectorHistoryRow): Promise<void>;
    markCollectorInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;
    unmarkConsumedCollectorBySlot(slot: number): Promise<void>;
    deleteCollectorBySlot(slot: number): Promise<void>;

    insertCdpCreator(record: CdpCreatorHistoryRow): Promise<void>;
    markCdpCreatorInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;
    unmarkConsumedCdpCreatorBySlot(slot: number): Promise<void>;
    deleteCdpCreatorBySlot(slot: number): Promise<void>;

    insertLimitedRedemptionPosition(record: LimitedRedemptionPositionHistoryRow): Promise<void>;
    markLimitedRedemptionPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;
    unmarkConsumedLimitedRedemptionPositionBySlot(slot: number): Promise<void>;
    deleteLimitedRedemptionPositionBySlot(slot: number): Promise<void>;
    getLimitedRedemptionPositionFromOutput(
        inputs: [string, number][]
    ): Promise<LimitedRedemptionPositionHistoryResult[]>;

    getTreasuryFromOutput(
        inputs: [string, number][]
    ): Promise<TreasuryHistoryResult[]>;
    insertTreasury(record: TreasuryHistoryRow): Promise<void>;
    markTreasuryInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;
    unmarkConsumedTreasuryBySlot(slot: number): Promise<void>;
    deleteTreasuryBySlot(slot: number): Promise<void>;

    insertVersionRecord(record: VersionRecordHistoryRow): Promise<void>;
    markVersionRecordInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void>;
    unmarkConsumedVersionRecordBySlot(slot: number): Promise<void>;
    deleteVersionRecordBySlot(slot: number): Promise<void>;

    insertDistributionEvent(record: DistributionEventRow): Promise<void>;
    deleteDistributionEventBySlot(slot: number): Promise<void>;

    insertVote(record: VoteHistory): Promise<void>;
    deleteVoteBySlot(slot: number): Promise<void>;

    getSync(): Promise<SyncResult | undefined>;
    updateSync(row: SyncRow): Promise<void>;

    rollback(point: PointOrOrigin): Promise<void>;
}
