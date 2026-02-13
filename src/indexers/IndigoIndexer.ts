import { BaseIndexer } from './BaseIndexer';
import { BlockPraos, Slot } from '@cardano-ogmios/schema';
import { Application } from '../protocol/indigo/app';
import { MySqlCoreDatabase } from '../protocol/indigo/db/MySqlCoreDatabase';
import { SystemParamsV1 } from '../protocol/indigo/models/SystemParamsV1';
import { SystemParamsV2 } from '../protocol/indigo/models/SystemParamsV2';
import { SystemParamsV2v1 } from '../protocol/indigo/models/SystemParamsV2v1';
import CONFIG from '../config';
import { fetchSystemParamsV1, fetchSystemParamsV2, fetchSystemParamsV2v1 } from '../protocol/indigo/config';

const START_SLOT: number = 77419687;

export class IndigoIndexer extends BaseIndexer {

    private _app: Application;
    private _database: MySqlCoreDatabase;
    private _sysParamsV1: SystemParamsV1 | undefined;
    private _sysParamsV2: SystemParamsV2 | undefined;
    private _sysParamsV2v1: SystemParamsV2v1 | undefined;

    async onRollForward(block: BlockPraos): Promise<any> {
        if (block.slot < START_SLOT) return;
        if (! this._app) await this.loadApp();

        return this._app.rollForward(block);
    }

    async onRollBackward(blockHash: string, slot: Slot): Promise<any> {
        if (! this._app) await this.loadApp();

        return this._app.rollBackward({ point: { slot, id: blockHash} });
    }

    private async loadApp() {
        this._sysParamsV1 = await fetchSystemParamsV1();
        this._sysParamsV2 = await fetchSystemParamsV2();
        this._sysParamsV2v1 = await fetchSystemParamsV2v1();

        this._app = new Application(
            new MySqlCoreDatabase(
                CONFIG.DATABASE_HOST,
                CONFIG.DATABASE_USERNAME,
                CONFIG.DATABASE_PASSWORD,
                CONFIG.DATABASE,
                CONFIG.DATABASE_PORT
            )
        );

        return this._app.start(
            this._sysParamsV1,
            this._sysParamsV2,
            this._sysParamsV2v1,
        );
    }

}
