import { CoreDatabase } from './CoreDatabase';
import { Connection, createConnection, QueryError, ResultSetHeader } from 'mysql2';
import { Logger } from '../lib/Logger';
import { PointOrOrigin } from '@cardano-ogmios/schema';
import { AssetHistoryRow } from '../models/AssetHistory';
import { mysqlDate } from '../helpers';
import { CdpHistoryResult } from '../models/CdpHistory';
import { StabilityPoolAccountHistoryResult } from '../models/StabilityPoolAccountHistory';
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
import { stringify } from '../../../utils';

export class MySqlCoreDatabase implements CoreDatabase {
    private connection: Connection;

    constructor(
        host: string,
        user: string,
        password: string,
        database: string,
        port: number,
    ) {
        this.connection = createConnection({
            host: host,
            user: user,
            password: password ?? null,
            database: database,
            port: port,
        });
    }

    getIAssetOracles(): Promise<OracleRow[]> {
        return this.select(
            `
            SELECT
                ah.asset,
                ah.oracle_nft_cs,
                ah.oracle_nft_tn
            FROM
                asset_histories ah
                LEFT JOIN asset_histories ah2 ON ah.asset = ah2.asset
                    AND ah.slot < ah2.slot
            WHERE
                ah2.slot IS NULL AND ah.oracle_nft_tn IS NOT NULL AND ah.oracle_nft_cs IS NOT NULL;
            `,
            []
        );
    }

    getIAssetInterestOracles(): Promise<InterestOracleRow[]> {
        return this.select(
            `
            SELECT
                ah.asset,
                ah.interest_oracle_nft_cs,
                ah.interest_oracle_nft_tn
            FROM
                asset_histories ah
                LEFT JOIN asset_histories ah2 ON ah.asset = ah2.asset
                    AND ah.slot < ah2.slot
            WHERE
                ah2.slot IS NULL AND ah.interest_oracle_nft_tn IS NOT NULL AND ah.interest_oracle_nft_cs IS NOT NULL;
            `,
            []
        );
    }

    getIAsset(name: string): Promise<AssetHistoryRow> {
        return this.select(
            `SELECT * FROM asset_histories WHERE asset = ? ORDER BY slot DESC LIMIT 1`,
            [name]
        ).then((res) => res[0]);
    }


    rollback(point: PointOrOrigin): Promise<void> {
        Logger.info([stringify(point)]);
        if (typeof point === 'object' && point.slot) {
            // TODO: Delete all stability_pool_histories WHERE slot > point.slot
        }
        return Promise.resolve();
    }

    connect(): Promise<void> {
        return new Promise<void>((res, rej) => {
            this.connection.connect((err: QueryError | null) => {
                if (err) {
                    Logger.error([err.code, err.message]);
                    rej(err);
                } else {
                    Logger.info(['Successfully connected to MySQL database']);
                    res();
                }
            });
        });
    }

    insertAssetHistory(record: AssetHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO asset_histories (hash, slot, output_hash, output_index, asset, mcr, oracle_nft_cs, oracle_nft_tn, interest_oracle_nft_cs, interest_oracle_nft_tn, delist_price, redemption_ratio_percentage, maintenance_ratio_percentage, liquidation_ratio_percentage, debt_minting_fee_percentage, liquidation_processing_fee_percentage, stability_pool_withdrawal_fee_percentage, redemption_reimbursement_percentage, redemption_processing_fee_percentage, interest_collector_portion_percentage, base_rates, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE output_hash = VALUES(output_hash), output_index = VALUES(output_index), asset = VALUES(asset), mcr = VALUES(mcr), oracle_nft_cs = VALUES(oracle_nft_cs), oracle_nft_tn = VALUES(oracle_nft_tn), delist_price = VALUES(delist_price), redemption_ratio_percentage = VALUES(redemption_ratio_percentage), maintenance_ratio_percentage = VALUES(maintenance_ratio_percentage), liquidation_ratio_percentage = VALUES(liquidation_ratio_percentage), debt_minting_fee_percentage = VALUES(debt_minting_fee_percentage), liquidation_processing_fee_percentage = VALUES(liquidation_processing_fee_percentage), stability_pool_withdrawal_fee_percentage = VALUES(stability_pool_withdrawal_fee_percentage), redemption_reimbursement_percentage = VALUES(redemption_reimbursement_percentage), redemption_processing_fee_percentage = VALUES(redemption_processing_fee_percentage), base_rates = VALUES(base_rates), updated_at = VALUES(updated_at)',
            [
                record.hash,
                record.slot,
                record.output_hash,
                record.output_index,
                record.asset,
                record.mcr,
                record.oracle_nft_cs,
                record.oracle_nft_tn,
                record.interest_oracle_nft_cs,
                record.interest_oracle_nft_tn,
                record.delist_price,
                record.redemption_ratio_percentage,
                record.maintenance_ratio_percentage,
                record.liquidation_ratio_percentage,
                record.debt_minting_fee_percentage,
                record.liquidation_processing_fee_percentage,
                record.stability_pool_withdrawal_fee_percentage,
                record.redemption_reimbursement_percentage,
                record.redemption_processing_fee_percentage,
                record.interest_collector_portion_percentage,
                record.base_rates,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteAssetHistoryBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM asset_histories WHERE slot > ?', [slot]);
    }

    insertPrice(record: PriceRow): Promise<void> {
        return this.query(
            'INSERT INTO prices (hash, slot, output_hash, output_index, asset, price, expiration, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.hash,
                record.slot,
                record.output_hash,
                record.output_index,
                record.asset,
                record.price,
                record.expiration,
                record.address,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deletePriceBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM prices WHERE slot > ?', [slot]);
    }

    insertAssetInterestRate(record: AssetInterestRate): Promise<void> {
        return this.query(
            'INSERT INTO asset_interest_rates (slot, output_hash, output_index, asset, unitary_interest, interest_rate, last_interest_update, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.asset,
                record.unitary_interest,
                record.interest_rate,
                record.last_interest_update,
                record.address,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteAssetInterestRateBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM asset_interest_rates WHERE slot > ?', [slot]);
    }

    insertCollateralizedDebtPosition(
        record: CollateralizedDebtPositionRow
    ): Promise<void> {
        return this.query(
            'INSERT INTO collateralized_debt_positions (slot, output_hash, output_index, asset, owner, mintedAmount, collateralAmount, fee_lovelaces_indy_stakers, fee_lovelaces_treasury, interest_iasset_amount, interest_last_updated, frozen_cdp_accumulated_lovelaces_indy_stakers, frozen_cdp_accumulated_lovelaces_treasury, active_interest_tracking_unitary_interest_snapshot, active_interest_tracking_last_settled, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.asset,
                record.owner,
                record.mintedAmount,
                record.collateralAmount,
                record.fee_lovelaces_indy_stakers,
                record.fee_lovelaces_treasury,
                record.interest_iasset_amount,
                record.interest_last_updated,
                record.frozen_cdp_accumulated_lovelaces_indy_stakers,
                record.frozen_cdp_accumulated_lovelaces_treasury,
                record.active_interest_tracking_unitary_interest_snapshot,
                record.active_interest_tracking_last_settled,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    updateCollateralizedDebtPosition(
        id: number,
        record: CollateralizedDebtPositionRow
    ): Promise<void> {
        return this.query(
            'UPDATE collateralized_debt_positions SET slot = ?, output_hash = ?, output_index = ?, asset = ?, owner = ?, mintedAmount = ?, collateralAmount = ?, updated_at = ? WHERE id = ?',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.asset,
                record.owner,
                record.mintedAmount,
                record.collateralAmount,
                mysqlDate(),
                id,
            ]
        );
    }

    deleteCollateralizedDebtPosition(id: number): Promise<void> {
        return this.query(
            'DELETE FROM collateralized_debt_positions WHERE id = ?',
            [id]
        );
    }

    deleteCollateralizedDebtPositionBySlot(slot: number): Promise<void> {
        return this.query(
            'DELETE FROM collateralized_debt_positions WHERE slot > ?',
            [slot]
        );
    }

    unmarkConsumedCollateralizedDebtPositionBySlot(
        slot: number
    ): Promise<void> {
        return this.query(
            'UPDATE collateralized_debt_positions SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markCollateralizedDebtPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE collateralized_debt_positions SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    insertStabilityPoolAccount(record: StabilityPoolAccountRow): Promise<void> {
        return this.query(
            'INSERT INTO stability_pool_accounts (slot, output_hash, output_index, asset, owner, snapshotP, snapshotD, snapshotS, snapshotEpoch, snapshotScale, request, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.asset,
                record.owner,
                record.snapshotP,
                record.snapshotD,
                record.snapshotS,
                record.snapshotEpoch,
                record.snapshotScale,
                record.request,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteStabilityPoolAccount(id: number): Promise<void> {
        return this.query('DELETE FROM stability_pool_accounts WHERE id = ?', [
            id,
        ]);
    }

    deleteStabilityPoolAccountBySlot(slot: number): Promise<void> {
        return this.query(
            'DELETE FROM stability_pool_accounts WHERE slot > ?',
            [slot]
        );
    }

    unmarkConsumedStabilityPoolAccountBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE stability_pool_accounts SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markStabilityPoolAccountInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE stability_pool_accounts SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    insertStabilityPoolHistory(record: StabilityPoolHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO stability_pool_histories (hash, slot, tx_block_index, output_hash, output_index, asset, snapshotP, snapshotD, snapshotS, snapshotEpoch, snapshotScale, epoch_to_scale_to_sum, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE output_hash = VALUES(output_hash), output_index = VALUES(output_index), asset = VALUES(asset), snapshotP = VALUES(snapshotP), snapshotD = VALUES(snapshotD), snapshotS = VALUES(snapshotS), snapshotEpoch = VALUES(snapshotEpoch), snapshotScale = VALUES(snapshotScale), epoch_to_scale_to_sum = VALUES(epoch_to_scale_to_sum), updated_at = VALUES(updated_at)',
            [
                record.hash,
                record.slot,
                record.tx_block_index,
                record.output_hash,
                record.output_index,
                record.asset,
                record.snapshot.snapshotP,
                record.snapshot.snapshotD,
                record.snapshot.snapshotS,
                record.snapshot.snapshotEpoch,
                record.snapshot.snapshotScale,
                record.epochToScaleToSum,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteStabilityPoolHistoryBySlot(slot: number): Promise<void> {
        return this.query(
            'DELETE FROM stability_pool_histories WHERE slot > ?',
            [slot]
        );
    }

    insertStakingManagerHistory(
        record: StakingManagerHistoryRow
    ): Promise<void> {
        return this.query(
            'INSERT INTO staking_manager_histories (hash, slot, tx_block_index, output_hash, output_index, total_stake, snapshot_ada, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE output_hash = VALUES(output_hash), output_index = VALUES(output_index), total_stake = VALUES(total_stake), snapshot_ada = VALUES(snapshot_ada), updated_at = VALUES(updated_at)',
            [
                record.hash,
                record.slot,
                record.tx_block_index,
                record.output_hash,
                record.output_index,
                record.total_stake,
                record.snapshot_ada,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteStakingManagerHistoryBySlot(slot: number): Promise<void> {
        return this.query(
            'DELETE FROM staking_manager_histories WHERE slot > ?',
            [slot]
        );
    }

    insertStakingPosition(record: StakingPositionRow): Promise<void> {
        return this.query(
            'INSERT INTO staking_positions (slot, output_hash, output_index, owner, staked_indy, locked_amount, snapshot_ada, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.owner,
                record.staked_indy,
                record.locked_amount,
                record.snapshot_ada,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }


    deleteStakingPosition(id: number): Promise<void> {
        return this.query('DELETE FROM staking_positions WHERE id = ?', [id]);
    }

    deleteStakingPositionBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM staking_positions WHERE slot > ?', [
            slot,
        ]);
    }

    unmarkConsumedStakingPositionBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE staking_positions SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markStakingPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE staking_positions SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    insertPollShard(record: PollShardRow): Promise<void> {
        return this.query(
            'INSERT INTO poll_shards (slot, output_hash, output_index, poll_id, yes_votes, no_votes, end_time, manager_address, utxo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.poll_id,
                record.yes_votes,
                record.no_votes,
                record.end_time,
                record.manager_address,
                record.utxo,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    updatePollShard(id: number, record: PollShardRow): Promise<void> {
        return this.query(
            'UPDATE poll_shards SET slot = ?, output_hash = ?, output_index = ?, poll_id = ?, yes_votes = ?, no_votes = ?, end_time = ?, manager_address = ?, utxo = ?, updated_at = ? WHERE id = ?',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.poll_id,
                record.yes_votes,
                record.no_votes,
                record.end_time,
                record.manager_address,
                record.utxo,
                mysqlDate(),
                id,
            ]
        );
    }

    deletePollShard(id: number): Promise<void> {
        return this.query('DELETE FROM staking_positions WHERE id = ?', [id]);
    }

    insertPollHistory(record: PollHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO poll_histories (hash, slot, output_hash, output_index, poll_id, owner, type, content, tallied_yes, tallied_no, end_time, created_shards, tallied_shards, total_shards, propose_end_time, expiration_time, protocol_version, version, treasury_withdrawal_address, treasury_withdrawal_value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.hash,
                record.slot,
                record.output_hash,
                record.output_index,
                record.poll_id,
                record.owner,
                record.type,
                record.content,
                record.tallied_yes,
                record.tallied_no,
                record.end_time,
                record.created_shards,
                record.tallied_shards,
                record.total_shards,
                record.propose_end_time,
                record.expiration_time,
                record.protocol_version,
                record.version,
                record.treasury_withdrawal_address,
                record.treasury_withdrawal_value ? stringify(record.treasury_withdrawal_value) : null,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deletePollHistoryBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM poll_histories WHERE slot > ?', [slot]);
    }

    markPollHistoryAsClosed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE poll_histories SET closed_at = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    insertProtocolParameterHistory(
        record: ProtocolParameterHistoryRow
    ): Promise<void> {
        return this.query(
            'INSERT INTO protocol_parameter_histories (hash, slot, output_hash, output_index, proposal_deposit, voting_period, effective_delay, expiration_period, protocol_fee_percentage, proposing_period, total_shards, minimum_quorum, max_treasury_lovelace_spend, max_treasury_indy_spend, treasury_indy_withdrawn_amt, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.hash,
                record.slot,
                record.output_hash,
                record.output_index,
                record.proposal_deposit,
                record.voting_period,
                record.effective_delay,
                record.expiration_period,
                record.protocol_fee_percentage,
                record.proposing_period,
                record.total_shards,
                record.minimum_quorum,
                record.max_treasury_lovelace_spend,
                record.max_treasury_indy_spend,
                record.treasury_indy_withdrawn_amt,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteProtocolParameterHistoryBySlot(slot: number): Promise<void> {
        return this.query(
            'DELETE FROM protocol_parameter_histories WHERE slot > ?',
            [slot]
        );
    }

    insertLiquidityPosition(record: LiquidityPositionRow): Promise<void> {
        return this.query(
            'INSERT INTO liquidity_positions (slot, output_hash, output_index, owner, value, utxo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.owner,
                record.value,
                record.utxo,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteLiquidityPositionBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM liquidity_positions WHERE slot > ?', [
            slot,
        ]);
    }

    unmarkConsumedLiquidityPositionBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE liquidity_positions SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markLiquidityPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE liquidity_positions SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    getStabilityPoolAccountHistoryFromOutput(
        inputs: [string, number][]
    ): Promise<StabilityPoolAccountHistoryResult[]> {
        return this.select(
            'SELECT * FROM stability_pool_account_histories WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    getStakingPositionFromOutput(
        inputs: [string, number][]
    ): Promise<StakingPositionResult[]> {
        return this.select(
            'SELECT * FROM staking_positions WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    getCdpHistoryFromOutput(
        inputs: [string, number][]
    ): Promise<CdpHistoryResult[]> {
        return this.select(
            'SELECT * FROM cdp_histories WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    getCollateralizedDebtPositionFromOutput(
        inputs: [string, number][]
    ): Promise<CollateralizedDebtPositionResult[]> {
        return this.select(
            'SELECT * FROM collateralized_debt_positions WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    getStabilityPoolAccountFromOutput(
        inputs: [string, number][]
    ): Promise<StabilityPoolAccountResult[]> {
        return this.select(
            'SELECT * FROM stability_pool_accounts WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    getStabilityPoolFromOutput(
        inputs: [string, number][]
    ): Promise<StabilityPoolHistoryResult[]> {
        return this.select(
            'SELECT * FROM stability_pool_histories WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    insertLiquidation(record: LiquidationRow): Promise<void> {
        return this.query(
            'INSERT INTO liquidations (slot, output_hash, output_index, asset, collateral_absorbed, iasset_burned, oracle_price, ada_price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.asset,
                record.collateral_absorbed,
                record.iasset_burned,
                record.oracle_price,
                record.ada_price,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteLiquidationBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM liquidations WHERE slot > ?', [slot]);
    }

    insertRedemption(record: RedemptionRow): Promise<void> {
        return this.query(
            'INSERT INTO redemption_histories (slot, tx_hash, asset, type, cdp_owner, redeemed_amount, interest, lovelaces_returned, processing_fee_lovelaces, reimbursement_fee_lovelaces, oracle_price, ada_price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.tx_hash,
                record.asset,
                record.type,
                record.cdp_owner,
                record.redeemed_amount,
                record.interest,
                record.lovelaces_returned,
                record.processing_fee_lovelaces,
                record.reimbursement_fee_lovelaces,
                record.oracle_price,
                record.ada_price,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteRedemptionBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM redemption_histories WHERE slot > ?', [slot]);
    }

    getPollShardFromOutput(
        inputs: [string, number][]
    ): Promise<PollShardResult[]> {
        return this.select(
            'SELECT * FROM poll_shards WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    getLiquidityPositionInputs(): Promise<[string, number][]> {
        return this.select(
            'SELECT output_hash, output_index FROM liquidity_positions WHERE consumed IS NULL',
            []
        ).then((res) => {
            return res.map((x: any) => [x.output_hash, x.output_index]);
        });
    }

    getSync(): Promise<SyncResult> {
        return this.select('SELECT * FROM syncs LIMIT 1', []).then(
            (res) => res[0]
        );
    }

    updateSync(row: SyncRow): Promise<void> {
        return this.query(
            'INSERT INTO syncs (id, block_hash, slot, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE block_hash = VALUES(block_hash), slot = VALUES(slot), updated_at = VALUES(updated_at)',
            [1, row.block_hash, row.slot, mysqlDate(), mysqlDate()]
        );
    }

    getCollectorFromOutput(
        inputs: [string, number][]
    ): Promise<CollectorHistoryResult[]> {
        return this.select(
            'SELECT * FROM collectors WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            inputs.flat()
        );
    }

    insertCollector(record: CollectorHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO collectors (slot, output_hash, output_index, ada_value, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.ada_value,
                record.version,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteCollectorBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM collectors WHERE slot > ?', [slot]);
    }

    unmarkConsumedCollectorBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE collectors SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markCollectorInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE collectors SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    insertCdpCreator(record: CdpCreatorHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO cdp_creator_records (slot, output_hash, output_index, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.version ?? 'v1',
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteCdpCreatorBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM cdp_creator_records WHERE slot > ?', [slot]);
    }

    markCdpCreatorInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE cdp_creator_records SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    unmarkConsumedCdpCreatorBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE cdp_creator_records SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    insertLimitedRedemptionPosition(record: LimitedRedemptionPositionHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO limited_redemption_positions (slot, output_hash, output_index, version, owner, asset, lovelace_amount, max_price, claimable_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.version ?? 'v1',
                record.owner,
                record.asset,
                record.lovelace_amount,
                record.max_price,
                record.claimable_amount,
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteLimitedRedemptionPositionBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM limited_redemption_positions WHERE slot > ?', [slot]);
    }

    unmarkConsumedLimitedRedemptionPositionBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE limited_redemption_positions SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markLimitedRedemptionPositionInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE limited_redemption_positions SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }


    
    getLimitedRedemptionPositionFromOutput(
        inputs: [string, number][]
    ): Promise<LimitedRedemptionPositionHistoryResult[]> {
        return this.select(
            'SELECT * FROM limited_redemption_positions WHERE ' +
                inputs
                    .map(() => '(output_hash = ? AND output_index = ?)')
                    .join(' OR '),
            inputs.flat()
        );
    }
    
    getTreasuryFromOutput(
        inputs: [string, number][]
    ): Promise<TreasuryHistoryResult[]> {
        return this.select(
            'SELECT * FROM treasury_records WHERE ' +
                inputs
                    .map(() => '(output_hash = ? AND output_index = ?)')
                    .join(' OR '),
            inputs.flat()
        );
    }


    insertTreasury(record: TreasuryHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO treasury_records (slot, output_hash, output_index, lovelace_value, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.lovelace_value,
                record.version ?? 'v1',
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteTreasuryBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM treasury_records WHERE slot > ?', [slot]);
    }

    unmarkTreasuryollectorBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE treasury_records SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markTreasuryInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE treasury_records SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    unmarkConsumedTreasuryBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE treasury_records SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    insertVersionRecord(record: VersionRecordHistoryRow): Promise<void> {
        return this.query(
            'INSERT INTO version_registry_records (slot, output_hash, output_index, data, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                record.slot,
                record.output_hash,
                record.output_index,
                record.data,
                record.version ?? 'v1',
                mysqlDate(),
                mysqlDate(),
            ]
        );
    }

    deleteVersionRecordBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM version_registry_records WHERE slot > ?', [slot]);
    }

    unmarkVersionRecordollectorBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE version_registry_records SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }

    markVersionRecordInputsAsConsumed(
        slot: number,
        inputs: [string, number][]
    ): Promise<void> {
        return this.query(
            'UPDATE version_registry_records SET consumed = ? WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [slot, ...inputs.flat()]
        );
    }

    unmarkConsumedVersionRecordBySlot(slot: number): Promise<void> {
        return this.query(
            'UPDATE version_registry_records SET consumed = NULL WHERE consumed > ?',
            [slot]
        );
    }
    

    insertDistributionEvent(record: DistributionEventRow): Promise<void> {
        return this.query(
            'INSERT INTO distribution_events (slot, ada_distributed, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [record.slot, record.ada_distributed, mysqlDate(), mysqlDate()]
        );
    }

    deleteDistributionEventBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM distribution_events WHERE slot > ?', [
            slot,
        ]);
    }

    insertVote(record: VoteHistory): Promise<void> {
        return this.query(
            'INSERT INTO votes (slot, output_hash, owner, poll_id, poll_end_time, vote_amount, vote_option, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [record.slot, record.output_hash, record.owner, record.poll_id, record.poll_end_time, record.vote_amount, record.vote_option]
        );
    }

    deleteVoteBySlot(slot: number): Promise<void> {
        return this.query('DELETE FROM votes WHERE slot > ?', [
            slot,
        ]);
    }

    createStakingPositionRecord(owner: string, outputHash: string, outputIndex: number, stakedAmount: bigint, slot: number, referral: string | null): Promise<number> {
        return new Promise<number>((res, rej) => {
            const q = this.connection.execute(
                'INSERT INTO staking_position_records (owner, output_hash, output_index, staked_amount, opened_slot, referral_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
                [owner, outputHash, outputIndex, stakedAmount, slot, referral],
                (err: any, result: ResultSetHeader) => {
                    if (err) return rej(err);
                    res(result.insertId);
                }
            );
        });
    }

    createStakingPositionRecordHistory(stakingPositionRecordId: number, outputHash: string, outputIndex: number, action: 'open' | 'adjust' | 'closed', slot: number, stakedAmount: bigint, referral: string | null): Promise<void> {
        return this.query(
            'INSERT INTO staking_position_record_histories (staking_position_record_id, output_hash, output_index, action, slot, staked_amount, referral_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', 
            [stakingPositionRecordId, outputHash, outputIndex, action, slot, stakedAmount, referral]
        );
    }

    getStakingPositionRecord(inputs: [string, number][]): Promise<number | null> {
        return this.select(
            'SELECT id FROM staking_position_records WHERE ' +
                inputs
                    .map(() => 'output_hash = ? AND output_index = ?')
                    .join(' OR '),
            [...inputs.flat()]
        ).then((res) => {
            if (res.length === 0) {
                return null;
            }
            return res[0].id;
        });
    }
    
    updateStakingPositionRecord(stakingPositionRecordId: number, stakedAmount: bigint, outputHash: string, outputIndex: number, referral: string | null): Promise<void> {
        return this.query(
            'UPDATE staking_position_records SET staked_amount = ?, output_hash = ?, output_index = ?, referral_code = coalesce(?, referral_code) WHERE id = ?',
            [stakedAmount, outputHash, outputIndex, referral, stakingPositionRecordId]
        );
    }

    closeStakingPositionRecord(stakingPositionRecordId: number, slot: number): Promise<void> {
        return this.query(
            'UPDATE staking_position_records SET closed_slot = ? WHERE id = ?',
            [slot, stakingPositionRecordId]
        );
    }

    private select(sql: string, values: any): Promise<any> {
        return new Promise<any>((res, rej) => {
            this.connection.query(sql, values, (err, result) => {
                if (err) return rej(err);
                res(result);
            });
        });
    }

    private query(sql: string, values: any) {
        return new Promise<void>((res, rej) => {
            this.connection.query(sql, values, (err) => {
                if (err) {
                    if (err.fatal) process.exit(0);
                    return rej(err);
                }
                res();
            });
        });
    }
}
