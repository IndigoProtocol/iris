import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIndigoSchema1731944573003 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          CREATE TABLE \`asset_histories\` (
            \`hash\` varchar(767) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`slot\` int unsigned NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`mcr\` double DEFAULT NULL,
            \`oracle_nft_cs\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`oracle_nft_tn\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`delist_price\` int unsigned DEFAULT NULL,
            \`interest_oracle_nft_cs\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`interest_oracle_nft_tn\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`redemption_ratio_percentage\` int unsigned DEFAULT NULL,
            \`maintenance_ratio_percentage\` int unsigned DEFAULT NULL,
            \`liquidation_ratio_percentage\` int unsigned DEFAULT NULL,
            \`debt_minting_fee_percentage\` int unsigned DEFAULT NULL,
            \`liquidation_processing_fee_percentage\` int unsigned DEFAULT NULL,
            \`stability_pool_withdrawal_fee_percentage\` int unsigned DEFAULT NULL,
            \`redemption_reimbursement_percentage\` int unsigned DEFAULT NULL,
            \`redemption_processing_fee_percentage\` int unsigned DEFAULT NULL,
            \`interest_collector_portion_percentage\` int unsigned DEFAULT NULL,
            \`base_rates\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`hash\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`asset_interest_rates\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int unsigned NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`unitary_interest\` bigint unsigned NOT NULL,
            \`interest_rate\` bigint unsigned NOT NULL,
            \`last_interest_update\` bigint unsigned NOT NULL,
            \`address\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`cdp_creator_records\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`consumed\` int unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`collateralized_debt_positions\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`mintedAmount\` bigint unsigned NOT NULL,
            \`collateralAmount\` bigint unsigned NOT NULL,
            \`interest_last_updated\` bigint unsigned DEFAULT NULL,
            \`interest_iasset_amount\` bigint unsigned DEFAULT NULL,
            \`fee_lovelaces_treasury\` bigint unsigned DEFAULT NULL,
            \`fee_lovelaces_indy_stakers\` bigint unsigned DEFAULT NULL,
            \`active_interest_tracking_last_settled\` bigint DEFAULT NULL,
            \`active_interest_tracking_unitary_interest_snapshot\` bigint DEFAULT NULL,
            \`frozen_cdp_accumulated_lovelaces_treasury\` bigint DEFAULT NULL,
            \`frozen_cdp_accumulated_lovelaces_indy_stakers\` bigint DEFAULT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`collateralized_debt_positions_consumed_index\` (\`consumed\`),
            KEY \`collateralized_debt_positions_slot_consumed_index\` (\`slot\`, \`consumed\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`collectors\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`ada_value\` bigint unsigned NOT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`distribution_events\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`ada_distributed\` bigint unsigned NOT NULL,
            \`indy_usd_price\` decimal(18, 6) unsigned DEFAULT NULL,
            \`indy_ada_price\` decimal(18, 6) unsigned DEFAULT NULL,
            \`ada_usd_price\` decimal(18, 6) unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`limited_redemption_positions\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`lovelace_amount\` bigint unsigned NOT NULL,
            \`max_price\` bigint unsigned NOT NULL,
            \`claimable_amount\` bigint unsigned NOT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`liquidations\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int unsigned NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`collateral_absorbed\` bigint unsigned NOT NULL,
            \`iasset_burned\` bigint unsigned NOT NULL,
            \`oracle_price\` decimal(18, 6) unsigned DEFAULT NULL,
            \`ada_price\` decimal(18, 6) unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`liquidations_slot_index\` (\`slot\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`liquidity_positions\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`value\` json NOT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`utxo\` json NOT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`liquidity_positions_owner_index\` (\`owner\`),
            KEY \`liquidity_positions_consumed_index\` (\`consumed\`),
            KEY \`liquidity_positions_slot_consumed_index\` (\`slot\`, \`consumed\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`poll_histories\` (
            \`hash\` varchar(767) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`poll_id\` bigint unsigned NOT NULL,
            \`owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`type\` enum('PROPOSE_ASSET','MIGRATE_ASSET','MODIFY_PROTOCOL_PARAMETERS','UPGRADE_PROTOCOL','TEXT') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`content\` json NOT NULL,
            \`tallied_yes\` bigint unsigned NOT NULL,
            \`tallied_no\` bigint unsigned NOT NULL,
            \`end_time\` bigint unsigned NOT NULL,
            \`created_shards\` bigint unsigned NOT NULL,
            \`tallied_shards\` bigint unsigned NOT NULL,
            \`total_shards\` bigint unsigned NOT NULL,
            \`propose_end_time\` bigint unsigned NOT NULL,
            \`expiration_time\` bigint unsigned NOT NULL,
            \`protocol_version\` bigint unsigned NOT NULL,
            \`closed_at\` int unsigned DEFAULT NULL,
            \`treasury_withdrawal_address\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`treasury_withdrawal_value\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`hash\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`poll_shards\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`poll_id\` bigint unsigned NOT NULL,
            \`yes_votes\` bigint unsigned NOT NULL,
            \`no_votes\` bigint unsigned NOT NULL,
            \`end_time\` bigint unsigned NOT NULL,
            \`manager_address\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`utxo\` json NOT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`prices\` (
            \`hash\` varchar(767) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`slot\` int unsigned NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`price\` bigint unsigned NOT NULL,
            \`expiration\` bigint unsigned NOT NULL,
            \`address\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`hash\`),
            KEY \`prices_slot_index\` (\`slot\`),
            KEY \`prices_asset_slot_index\` (\`asset\`, \`slot\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`protocol_parameter_histories\` (
            \`hash\` varchar(767) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`proposal_deposit\` bigint unsigned NOT NULL,
            \`voting_period\` bigint unsigned NOT NULL,
            \`effective_delay\` bigint unsigned NOT NULL,
            \`expiration_period\` bigint unsigned NOT NULL,
            \`protocol_fee_percentage\` bigint unsigned NOT NULL,
            \`proposing_period\` bigint unsigned NOT NULL,
            \`total_shards\` bigint unsigned NOT NULL,
            \`minimum_quorum\` bigint unsigned DEFAULT NULL,
            \`max_treasury_lovelace_spend\` bigint unsigned DEFAULT NULL,
            \`max_treasury_indy_spend\` bigint unsigned DEFAULT NULL,
            \`treasury_indy_withdrawn_amt\` bigint DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`hash\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`redemption_histories\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int unsigned NOT NULL,
            \`tx_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`type\` enum('CDP','LRP') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CDP',
            \`cdp_owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`redeemed_amount\` bigint unsigned NOT NULL,
            \`interest\` bigint unsigned NOT NULL DEFAULT '0',
            \`lovelaces_returned\` bigint unsigned NOT NULL,
            \`processing_fee_lovelaces\` bigint unsigned NOT NULL,
            \`reimbursement_fee_lovelaces\` bigint unsigned NOT NULL,
            \`oracle_price\` decimal(18, 6) unsigned DEFAULT NULL,
            \`ada_price\` decimal(18, 6) unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`stability_pool_accounts\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotP\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotD\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotS\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotEpoch\` int unsigned NOT NULL,
            \`snapshotScale\` int unsigned NOT NULL,
            \`request\` json DEFAULT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`stability_pool_accounts_consumed_index\` (\`consumed\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`stability_pool_histories\` (
            \`hash\` varchar(767) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`tx_block_index\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`asset\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotP\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotD\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotS\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshotEpoch\` int unsigned NOT NULL,
            \`snapshotScale\` int unsigned NOT NULL,
            \`epoch_to_scale_to_sum\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`hash\`),
            KEY \`stability_pool_histories_slot_index\` (\`slot\`),
            KEY \`stability_pool_histories_asset_slot_index\` (\`asset\`, \`slot\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`staking_manager_histories\` (
            \`hash\` varchar(767) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`tx_block_index\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`total_stake\` bigint unsigned NOT NULL,
            \`snapshot_ada\` bigint unsigned NOT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`hash\`),
            KEY \`staking_manager_histories_slot_index\` (\`slot\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`staking_position_records\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`owner\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_hash\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int NOT NULL,
            \`referral_code\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`opened_slot\` bigint NOT NULL,
            \`closed_slot\` bigint DEFAULT NULL,
            \`staked_amount\` bigint NOT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`staking_position_record_histories\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`staking_position_record_id\` bigint unsigned NOT NULL,
            \`action\` enum('open','adjust','close') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`slot\` bigint NOT NULL,
            \`output_hash\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int NOT NULL,
            \`staked_amount\` bigint NOT NULL,
            \`referral_code\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`spr_index\` (\`staking_position_record_id\`),
            CONSTRAINT \`spr_fk_record\`
              FOREIGN KEY (\`staking_position_record_id\`)
              REFERENCES \`staking_position_records\` (\`id\`)
              ON DELETE CASCADE
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`staking_positions\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`staked_indy\` bigint unsigned NOT NULL,
            \`locked_amount\` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`snapshot_ada\` bigint unsigned NOT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`group\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`staking_positions_consumed_index\` (\`consumed\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`treasury_records\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`lovelace_value\` bigint unsigned NOT NULL DEFAULT '0',
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`value\` json DEFAULT NULL,
            \`consumed\` int unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`version_registry_records\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`output_index\` int unsigned NOT NULL,
            \`data\` json NOT NULL,
            \`version\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'v1',
            \`consumed\` int unsigned DEFAULT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
        `);

        await queryRunner.query(`
          CREATE TABLE \`votes\` (
            \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
            \`slot\` int unsigned NOT NULL,
            \`output_hash\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`owner\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`poll_id\` int unsigned NOT NULL,
            \`poll_end_time\` bigint unsigned NOT NULL,
            \`vote_amount\` bigint unsigned NOT NULL,
            \`vote_option\` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            \`created_at\` timestamp NULL DEFAULT NULL,
            \`updated_at\` timestamp NULL DEFAULT NULL,
            PRIMARY KEY (\`id\`)
          );
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`votes\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`version_registry_records\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`treasury_records\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`staking_positions\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`staking_position_record_histories\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`staking_position_records\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`staking_manager_histories\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`stability_pool_histories\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`stability_pool_accounts\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`redemption_histories\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`protocol_parameter_histories\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`prices\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`poll_shards\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`poll_histories\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`liquidity_positions\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`liquidations\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`limited_redemption_positions\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`distribution_events\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`collectors\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`collateralized_debt_positions\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`cdp_creator_records\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`asset_interest_rates\`;`);
        await queryRunner.query(`DROP TABLE IF EXISTS \`asset_histories\`;`);
    }
}
