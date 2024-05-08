import { BaseService } from './BaseService';
import { WebSocket, WebSocketServer } from 'ws';
import { stringify } from '../utils';
import { logError, logInfo } from '../logger';
import { BaseEntity } from 'typeorm';
import { LiquidityPoolState } from '../db/entities/LiquidityPoolState';
import { LiquidityPoolStateResource } from '../api/resources/LiquidityPoolStateResource';
import { LiquidityPoolSwapResource } from '../api/resources/LiquidityPoolSwapResource';
import { LiquidityPoolSwap } from '../db/entities/LiquidityPoolSwap';
import { LiquidityPoolDeposit } from '../db/entities/LiquidityPoolDeposit';
import { LiquidityPoolDepositResource } from '../api/resources/LiquidityPoolDepositResource';
import { LiquidityPoolWithdrawResource } from '../api/resources/LiquidityPoolWithdrawResource';
import { LiquidityPoolWithdraw } from '../db/entities/LiquidityPoolWithdraw';
import { OperationStatusResource } from '../api/resources/OperationStatusResource';
import { OperationStatus } from '../db/entities/OperationStatus';
import { Sync } from '../db/entities/Sync';
import { SyncResource } from '../api/resources/SyncResource';
import { LiquidityPoolTick } from '../db/entities/LiquidityPoolTick';
import { LiquidityPoolTickResource } from '../api/resources/LiquidityPoolTickResource';
import { LiquidityPoolResource } from '../api/resources/LiquidityPoolResource';
import { LiquidityPool } from '../db/entities/LiquidityPool';
import { OrderBook } from '../db/entities/OrderBook';
import { OrderBookResource } from '../api/resources/OrderBookResource';
import { OrderBookOrder } from '../db/entities/OrderBookOrder';
import { OrderBookOrderResource } from '../api/resources/OrderBookOrderResource';
import { OrderBookMatch } from '../db/entities/OrderBookMatch';
import { OrderBookMatchResource } from '../api/resources/OrderBookMatchResource';
import { OrderBookTickResource } from '../api/resources/OrderBookTickResource';
import { OrderBookTick } from '../db/entities/OrderBookTick';

export class WebsocketService extends BaseService {

    private _websocket: WebSocketServer | undefined;
    private readonly _port: number;

    constructor(port: number) {
        super();

        this._port = port;
    }

    /**
     * https://github.com/websockets/ws
     */
    public boot(): Promise<void> {
        this._websocket = new WebSocketServer({
            port: this._port,
        });

        logInfo(`Started websocket on port ${this._port}`);

        return Promise.resolve();
    }

    /**
     * Broadcast event to all clients.
     */
    public broadcast(entity: BaseEntity): void {
        const message: Object = this.compressEntity(entity);

        if (Object.keys(message).length === 0) return;

        const messageFormatted: string = stringify(message);

        this._websocket?.clients.forEach((client: WebSocket) => {
            client.send(messageFormatted);
        });
    }

    /**
     * Simplify entity keys for saving on data sent.
     */
    protected compressEntity(entity: BaseEntity): Object {
        try {
            switch (entity.constructor) {
                case Sync:
                    return (new SyncResource()).toCompressed(entity as Sync);
                case LiquidityPool:
                    return (new LiquidityPoolResource()).toCompressed(entity as LiquidityPool);
                case LiquidityPoolState:
                    return (new LiquidityPoolStateResource()).toCompressed(entity as LiquidityPoolState);
                case LiquidityPoolSwap:
                    return (new LiquidityPoolSwapResource()).toCompressed(entity as LiquidityPoolSwap);
                case LiquidityPoolDeposit:
                    return (new LiquidityPoolDepositResource()).toCompressed(entity as LiquidityPoolDeposit);
                case LiquidityPoolWithdraw:
                    return (new LiquidityPoolWithdrawResource()).toCompressed(entity as LiquidityPoolWithdraw);
                case OperationStatus:
                    return (new OperationStatusResource()).toCompressed(entity as OperationStatus);
                case LiquidityPoolTick:
                    return (new LiquidityPoolTickResource()).toCompressed(entity as LiquidityPoolTick);
                case OrderBook:
                    return (new OrderBookResource()).toCompressed(entity as OrderBook);
                case OrderBookOrder:
                    return (new OrderBookOrderResource()).toCompressed(entity as OrderBookOrder);
                case OrderBookMatch:
                    return (new OrderBookMatchResource()).toCompressed(entity as OrderBookMatch);
                case OrderBookTick:
                    return (new OrderBookTickResource()).toCompressed(entity as OrderBookTick);
                default:
                    return {};
            }
        } catch (e: any) {
            logError(`Websocket ${e.message}`);

            return {};
        }
    }

}
