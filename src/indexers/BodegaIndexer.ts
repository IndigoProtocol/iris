import { BaseIndexer } from './BaseIndexer';
import { BlockPraos, Slot, Transaction, TransactionOutput } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { dbService } from '../indexerServices';
import { EntityManager } from 'typeorm';
import { PredictionMarket } from '../db/entities/PredictionMarket';
import { PredictionMarketHistory } from '../db/entities/PredictionMarketHistory';
import { logInfo } from '../logger';

const PROJECT_INFO_NFT: string = '08a8c0fbe85823132cb14a3767d2e114c8c85f58153b072f8c9e363350524f4a4543545f494e464f5f4e4654'
const PROJECT_PREDICTION_NFT: string = '08a8c0fbe85823132cb14a3767d2e114c8c85f58153b072f8c9e363350524f4a4543545f50524544494354494f4e5f4e4654'

export class BodegaIndexer extends BaseIndexer {

    async onRollForward(block: BlockPraos): Promise<any> {
        return Promise.all(
            (block.transactions ?? []).map((transaction: Transaction) => {
                return this.checkForCreatedMarket(transaction)
                    .then(() => this.checkForMarketHistory(transaction, block.slot))
            })
        )
    }

    async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
        return dbService.dbSource.query("DELETE FROM prediction_market_histories WHERE slot > ?", [slot]);
    }

    private async checkForCreatedMarket(transaction: Transaction) {
        const nftUtxo: TransactionOutput | undefined = transaction.outputs.find((output: TransactionOutput) => {
            return output.value[PROJECT_INFO_NFT.slice(0, 56)]
                && output.value[PROJECT_INFO_NFT.slice(0, 56)][PROJECT_INFO_NFT.slice(56)];
        })

        if (! nftUtxo || ! nftUtxo.datum) {
            return Promise.resolve()
        }

        const decodedDatum = CBOR.decode(Buffer.from(nftUtxo.datum!, 'hex')).value;
        const uuid: string = decodedDatum[0].value[0].toString('hex');

        const marketData = {
            uuid,
            creatorPkh: decodedDatum[1].toString('hex'),
            creatorSkh: decodedDatum[2].value[0].toString('hex'),
            deadline: decodedDatum[4],
            marketTokenPolicyId: decodedDatum[7].toString('hex'),
            positionPolicyId: decodedDatum[9].toString('hex'),
            marketTokenName: decodedDatum[8].toString('hex'),
            yesTokenName: decodedDatum[15].toString('hex'),
            noTokenName: decodedDatum[16].toString('hex'),
        };

        logInfo(`Found Bodega market ${uuid}`)

        const market = await dbService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(PredictionMarket, 'markets')
                .where('markets.uuid = :uuid', {
                    uuid,
                })
                .limit(1)
                .getOne();
        });

        if (market) return Promise.resolve();

        return dbService.transaction(async (manager: EntityManager): Promise<void> => {
            const market: PredictionMarket = PredictionMarket.make(
                marketData.uuid,
                marketData.creatorPkh,
                marketData.creatorSkh,
                Number(marketData.deadline),
                marketData.marketTokenPolicyId,
                marketData.marketTokenName,
                marketData.positionPolicyId,
                marketData.yesTokenName,
                marketData.noTokenName,
            );

            await manager.upsert(
                PredictionMarket,
                market,
                ['id']
            );
        });
    }

    private async checkForMarketHistory(transaction: Transaction, slot: number) {
        const nftUtxo: TransactionOutput | undefined = transaction.outputs.find((output: TransactionOutput) => {
            return output.value[PROJECT_PREDICTION_NFT.slice(0, 56)]
                && output.value[PROJECT_PREDICTION_NFT.slice(0, 56)][PROJECT_PREDICTION_NFT.slice(56)];
        })

        if (! nftUtxo || ! nftUtxo.datum) {
            return Promise.resolve()
        }

        const decodedDatum = CBOR.decode(Buffer.from(nftUtxo.datum!, 'hex')).value;
        const uuid = decodedDatum[0].value[0].toString('hex');

        const market = await dbService.query((manager: EntityManager) => {
            return manager.createQueryBuilder(PredictionMarket, 'markets')
                .where('markets.uuid = :uuid', {
                    uuid,
                })
                .limit(1)
                .getOne();
        });

        if (! market) return Promise.resolve();

        logInfo(`Found Bodega market history ${uuid}`)

        const marketData = {
            uuid,
            predictionMarketId: market.id,
            slot,
            yesShares: Number(decodedDatum[3]),
            noShares: Number(decodedDatum[4]),
            yesPrice: Number(decodedDatum[5]),
            noPrice: Number(decodedDatum[6]),
        };

        return dbService.transaction(async (manager: EntityManager): Promise<void> => {
            const history: PredictionMarketHistory = PredictionMarketHistory.make(
                marketData.uuid,
                marketData.predictionMarketId,
                marketData.slot,
                marketData.yesShares,
                marketData.noShares,
                marketData.yesPrice,
                marketData.noPrice,
            );

            history.predictionMarket = market;

            await manager.upsert(
                PredictionMarketHistory,
                history,
                ['id']
            );
        });
    }

}
