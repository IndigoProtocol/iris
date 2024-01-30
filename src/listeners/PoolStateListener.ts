import { BaseEventListener } from './BaseEventListener';
import { IndexerEventType } from '../constants';
import { IndexerEvent } from '../types';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';

export class PoolStateListener extends BaseEventListener {

    public listenFor: IndexerEventType[] = [
        IndexerEventType.AmmDexOperation,
    ];

    public onEvent(event: IndexerEvent): Promise<any> {
        switch (event.data.constructor) {
            case LiquidityPoolState:
                const poolState: LiquidityPoolState = event.data as LiquidityPoolState;
                const storageKey: string = poolState.liquidityPoolIdentifier;

                return this.app.cache.setKey(storageKey, poolState);
            default:
                return Promise.resolve();
        }
    }

}
