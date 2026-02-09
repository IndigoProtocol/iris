import { BaseIndexer } from './BaseIndexer';
import { BlockPraos, Slot, Transaction, TransactionOutput } from '@cardano-ogmios/schema';
import CBOR from 'cbor';
import { dbService } from '../indexerServices';
import { LiqwidMarket } from '../db/entities/LiqwidMarket';
import { EntityManager } from 'typeorm';

const MARKET_PARAMS_ADDRESS: string = 'addr1wx6htk5hfmr4dw32lhxdcp7t6xpe4jhs5fxylq90mqwnldsvr87c6'

export class LiqwidIndexer extends BaseIndexer {

    async onRollForward(block: BlockPraos): Promise<any> {
        return Promise.all(
            (block.transactions ?? []).map((transaction: Transaction) => {
                return this.checkForMarketParameters(transaction, block.slot)
            })
        )
    }

    async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
        return dbService.dbSource.query("DELETE FROM liqwid_markets WHERE slot > ?", [slot]);
    }

    private async checkForMarketParameters(transaction: Transaction, slot: number) {
        const markets: LiqwidMarket[] = transaction.outputs.map((utxo: TransactionOutput) => {
            if (utxo.address !== MARKET_PARAMS_ADDRESS || ! utxo.datum) return undefined;

            const decodedDatum = CBOR.decode(Buffer.from(utxo.datum!, 'hex'));
            const asset = Object.keys(utxo.value).find((policy: string) => policy !== 'ada')

            if (! asset) return undefined;

            return LiqwidMarket.make(
                asset,
                slot,
                Number(decodedDatum[0][1]),
                Number(decodedDatum[4]),
                Number(decodedDatum[3]),
                Number(decodedDatum[5]),
                Number(decodedDatum[11][2][0]) / Number(decodedDatum[11][2][1]),
                Number(decodedDatum[11][3][0]) / Number(decodedDatum[11][3][1]),
                (decodedDatum[32].tag === 122 || decodedDatum[32].value.length === 0) ? null : (Number(decodedDatum[32].value[0][0]) / Number(decodedDatum[32].value[0][1])),
                (decodedDatum[33].tag === 122 || decodedDatum[33].value.length === 0) ? null : Number(decodedDatum[33].value[0]),
            );
        }).filter((market: LiqwidMarket | undefined) => market !== undefined) as LiqwidMarket[];

        if (markets.length > 0) {
            return dbService.transaction(async (manager: EntityManager): Promise<void> => {
                await LiqwidMarket.save(markets)
            });
        }
    }

}
