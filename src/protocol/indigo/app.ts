import { Block, PointOrOrigin } from '@cardano-ogmios/schema';
import config, {fetchSystemParamsV1, fetchSystemParamsV2, fetchSystemParamsV2v1} from './config';
import { CoreDatabase } from './db/CoreDatabase';
import { MySqlCoreDatabase } from './db/MySqlCoreDatabase';
import { AssetHistoryV1Indexer } from './indexers/V1/AssetHistoryV1Indexer';
import { BaseIndexer } from './indexers/BaseIndexer';
import { CollateralizedDebtPositionUtxoIndexer } from './indexers/V1/CollateralizedDebtPositionUtxoIndexer';
import { CollectorIndexer } from './indexers/V1/CollectorIndexer';
import { LiquidationIndexer } from './indexers/V1/LiquidationIndexer';
import { LiquidityPositionIndexer } from './indexers/V1/LiquidityPositionIndexer';
import { PollIndexer } from './indexers/V1/PollIndexer';
import { PriceIndexer } from './indexers/PriceIndexer';
import { ProtocolParameterIndexer } from './indexers/V1/ProtocolParameterIndexer';
import { StabilityPoolAccountIndexer } from './indexers/V1/StabilityPoolAccountIndexer';
import { StabilityPoolIndexer } from './indexers/V1/StabilityPoolIndexer';
import { StakingManagerIndexer } from './indexers/V1/StakingManagerIndexer';
import { StakingPositionIndexer } from './indexers/V1/StakingPositionIndexer';
import { VoteIndexer } from './indexers/V1/VoteIndexer';
import { SystemParamsV1 } from './models/SystemParamsV1';
import { SystemParamsV2 } from './models/SystemParamsV2';
import { AssetHistoryV2Indexer } from './indexers/V2/AssetHistoryV2Indexer';
import { CollateralizedDebtPositionUtxoV2Indexer } from './indexers/V2/CollateralizedDebtPositionUtxoV2Indexer';
import { CollectorV2Indexer } from './indexers/V2/CollectorV2Indexer';
import { ProtocolParameterV2Indexer } from './indexers/V2/ProtocolParameterV2Indexer';
import { StakingManagerV2Indexer } from './indexers/V2/StakingManagerV2Indexer';
import { StakingPositionV2Indexer } from './indexers/V2/StakingPositionV2Indexer';
import { StabilityPoolV2Indexer } from './indexers/V2/StabilityPoolV2Indexer';
import { StabilityPoolAccountV2Indexer } from './indexers/V2/StabilityPoolAccountV2Indexer';
import { PollV2Indexer } from './indexers/V2/PollV2Indexer';
import { RedemptionV2Indexer } from './indexers/V2/RedemptionV2Indexer';
import { CdpCreatorIndexer } from './indexers/V1/CdpCreatorIndexer';
import { TreasuryIndexer } from './indexers/V1/TreasuryIndexer';
import { VersionRecordIndexer } from './indexers/V1/VersionRecordIndexer';
import { CdpCreatorV2Indexer } from './indexers/V2/CdpCreatorV2Indexer';
import { TreasuryV2Indexer } from './indexers/V2/TreasuryV2Indexer';
import { LiquidationV2Indexer } from './indexers/V2/LiquidationV2Indexer';
import { VoteV2Indexer } from './indexers/V2/VoteV2Indexer';
import { SystemParamsV2v1 } from './models/SystemParamsV2v1';
import { CollateralizedDebtPositionUtxoV2v1Indexer } from './indexers/V2v1/CollateralizedDebtPositionUtxoV2v1Indexer';
import { AssetHistoryV2v1Indexer } from './indexers/V2v1/AssetHistoryV2v1Indexer';
import { InterestOracleV2v1Indexer } from './indexers/V2v1/InterestOracleV2v1Indexer';
import { CdpCreatorV2v1Indexer } from './indexers/V2v1/CdpCreatorV2v1Indexer';
import { CollectorV2v1Indexer } from './indexers/V2v1/CollectorV2v1Indexer';
import { TreasuryV2v1Indexer } from './indexers/V2v1/TreasuryV2v1Indexer';
import { LiquidationV2v1Indexer } from './indexers/V2v1/LiquidationV2v1Indexer';
import { PollV2v1Indexer } from './indexers/V2v1/PollV2v1Indexer';
import { ProtocolParameterV2v1Indexer } from './indexers/V2v1/ProtocolParameterV2v1Indexer';
import { RedemptionV2v1Indexer } from './indexers/V2v1/RedemptionV2v1Indexer';
import { StabilityPoolAccountV2v1Indexer } from './indexers/V2v1/StabilityPoolAccountV2v1Indexer';
import { StabilityPoolV2v1Indexer } from './indexers/V2v1/StabilityPoolV2v1Indexer';
import { StakingManagerV2v1Indexer } from './indexers/V2v1/StakingManagerV2v1Indexer';
import { StakingPositionV2v1Indexer } from './indexers/V2v1/StakingPositionV2v1Indexer';
import { VoteV2v1Indexer } from './indexers/V2v1/VoteV2v1Indexer';
import { VersionRecordV2Indexer } from './indexers/V2/VersionRecordV2Indexer';
import { StakingPositionRecordV2v1Indexer } from './indexers/V2v1/StakingPositionRecordV2v1Indexer';
import { LimitedRedemptionPositionV2v1Indexer } from './indexers/V2v1/LimitedRedemptionPositionV2v1Indexer';

export class Application {
    private indexers: BaseIndexer[] = [];
    constructor(private database: CoreDatabase) {}

    async start(sysParamsV1?: SystemParamsV1, sysParamsV2?: SystemParamsV2, sysParamsV2v1?: SystemParamsV2v1) {
        // Add Indexers
        this.indexers = [                
            new PriceIndexer(this.database),
            new LiquidityPositionIndexer(this.database),
        ];

        if (sysParamsV1) {
            this.indexers = [
                ...this.indexers,
                new AssetHistoryV1Indexer(this.database, sysParamsV1),
                new LiquidationIndexer(this.database, sysParamsV1),
                new CollateralizedDebtPositionUtxoIndexer(this.database, sysParamsV1),
                new StabilityPoolIndexer(this.database, sysParamsV1),
                new StabilityPoolAccountIndexer(this.database, sysParamsV1),
                new StakingManagerIndexer(this.database, sysParamsV1),
                new StakingPositionIndexer(this.database, sysParamsV1),
                new PollIndexer(this.database, sysParamsV1),
                new ProtocolParameterIndexer(this.database, sysParamsV1),
                new CollectorIndexer(this.database, sysParamsV1),
                new VoteIndexer(this.database, sysParamsV1),
                new CdpCreatorIndexer(this.database, sysParamsV1),
                new TreasuryIndexer(this.database, sysParamsV1),
                new VersionRecordIndexer(this.database, sysParamsV1)
            ];
        }

        if (sysParamsV2) {
            this.indexers = [
                ...this.indexers,
                new AssetHistoryV2Indexer(this.database, sysParamsV2),
                new CollateralizedDebtPositionUtxoV2Indexer(this.database, sysParamsV2),
                new ProtocolParameterV2Indexer(this.database, sysParamsV2),
                new PollV2Indexer(this.database, sysParamsV2),
                new RedemptionV2Indexer(this.database, sysParamsV2),
                new CdpCreatorV2Indexer(this.database, sysParamsV2),
                new TreasuryV2Indexer(this.database, sysParamsV2),
                new StabilityPoolV2Indexer(this.database, sysParamsV2),
                new StabilityPoolAccountV2Indexer(this.database, sysParamsV2),
                new LiquidationV2Indexer(this.database, sysParamsV2),
                new VersionRecordV2Indexer(this.database, sysParamsV2),
                new VoteV2Indexer(this.database, sysParamsV2)
            ]

            // These indexers should only be reused if there is no sysParamsV2v1
            if (!sysParamsV2v1) {
                this.indexers = [
                    ...this.indexers,
                    new CollectorV2Indexer(this.database, sysParamsV2),
                    new LiquidationV2Indexer(this.database, sysParamsV2),
                    new StakingManagerV2Indexer(this.database, sysParamsV2),
                    new StakingPositionV2Indexer(this.database, sysParamsV2),
                ];
            }
        }

        if (sysParamsV2v1) {
            this.indexers = [
                ...this.indexers,
                new InterestOracleV2v1Indexer(this.database),
                new AssetHistoryV2v1Indexer(this.database, sysParamsV2v1),
                new CdpCreatorV2v1Indexer(this.database, sysParamsV2v1),
                new CollateralizedDebtPositionUtxoV2v1Indexer(this.database, sysParamsV2v1),
                new CollectorV2v1Indexer(this.database, sysParamsV2v1),
                new LiquidationV2v1Indexer(this.database, sysParamsV2v1),
                new PollV2v1Indexer(this.database, sysParamsV2v1),
                new ProtocolParameterV2v1Indexer(this.database, sysParamsV2v1),
                new RedemptionV2v1Indexer(this.database, sysParamsV2v1),
                new StabilityPoolAccountV2v1Indexer(this.database, sysParamsV2v1),
                new StabilityPoolV2v1Indexer(this.database, sysParamsV2v1),
                new StakingManagerV2v1Indexer(this.database, sysParamsV2v1),
                new StakingPositionV2v1Indexer(this.database, sysParamsV2v1),
                new TreasuryV2v1Indexer(this.database, sysParamsV2v1),
                new VoteV2v1Indexer(this.database, sysParamsV2v1),
                new StakingPositionRecordV2v1Indexer(this.database, sysParamsV2v1),
                new LimitedRedemptionPositionV2v1Indexer(this.database, sysParamsV2v1)
            ]
        }
    }

    async rollBackward(x: { point: PointOrOrigin }) {
        if (typeof x.point === 'object' && 'slot' in x.point) {
            const point = x.point;
            await Promise.all(
                this.indexers.map((indexer) =>
                    indexer.onRollback(point.id, point.slot)
                )
            );
        }
    }

    async rollForward(block: Block) {
        if (block.type === 'praos') {
            await Promise.all(
                this.indexers.map((indexer) => indexer.onBlock(block))
            );
        }
    }

    static async setup(): Promise<Application> {
        if (
            config.CORE_MYSQL_HOST === undefined ||
            config.CORE_MYSQL_USERNAME === undefined ||
            config.CORE_MYSQL_PASSWORD === undefined ||
            config.CORE_MYSQL_DATABASE === undefined
        ) {
            throw new Error('Missing MYSQL database env config');
        }

        let database = new MySqlCoreDatabase(
            config.CORE_MYSQL_HOST,
            config.CORE_MYSQL_USERNAME,
            config.CORE_MYSQL_PASSWORD,
            config.CORE_MYSQL_DATABASE,
            config.CORE_MYSQL_PORT
        );

        const sysParamsV1 = await fetchSystemParamsV1();
        const sysParamsV2 = await fetchSystemParamsV2();
        const sysParamsV2v1 = await fetchSystemParamsV2v1();

        const app = new Application(database);
        app.start(sysParamsV1, sysParamsV2, sysParamsV2v1);

        return app;
    }
}
