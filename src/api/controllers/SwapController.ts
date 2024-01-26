import { BaseApiController } from './BaseApiController';
import express from 'express';
import { orderLimiterService, orderRouteService } from '../../apiServices';
import { LimiterResults, OrderRouteResults } from '../../types';
import { Asset, Token } from '../../db/entities/Asset';
import { stringify } from '../../utils';

export class SwapController extends BaseApiController {

    bootRoutes(): void {
        this.router.post(`${this.basePath}/route/receive`, this.routeReceive);
        this.router.post(`${this.basePath}/route/send`, this.routeSend);
        this.router.post(`${this.basePath}/spread`, this.spread);
    }

    private routeReceive(request: express.Request, response: express.Response) {
        const {
            dexs,
            swapInToken,
            swapOutToken,
            swapInAmount,
        } = request.body;

        if (! dexs) {
            return response.send(super.failResponse("Must supply 'dexs'"));
        }

        const [swapInPolicyId, swapInNameHex] = swapInToken
            ? (swapInToken as string).split('.')
            : [null, null];

        const [swapOutPolicyId, swapOutNameHex] = swapOutToken
            ? (swapOutToken as string).split('.')
            : [null, null];

        const inToken: Token = (! swapInPolicyId || ! swapInNameHex) || swapInToken === 'lovelace'
            ? 'lovelace'
            : new Asset(swapInPolicyId, swapInNameHex);
        const outToken: Token = (! swapOutPolicyId || ! swapOutNameHex) || swapOutToken === 'lovelace'
            ? 'lovelace'
            : new Asset(swapOutPolicyId, swapOutNameHex);

        return orderRouteService.route(dexs, BigInt(swapInAmount), inToken, outToken, false)
            .then((result: OrderRouteResults) => {
                return response.send(JSON.parse(stringify(result)));
            })
            .catch((e: any) => {
                return response.send(super.failResponse(e));
            });
    }

    private routeSend(request: express.Request, response: express.Response) {
        const {
            dexs,
            swapInToken,
            swapOutToken,
            swapOutAmount,
        } = request.body;

        if (! dexs) {
            return response.send(super.failResponse("Must supply 'dexs'"));
        }

        const [swapInPolicyId, swapInNameHex] = swapInToken
            ? (swapInToken as string).split('.')
            : [null, null];

        const [swapOutPolicyId, swapOutNameHex] = swapOutToken
            ? (swapOutToken as string).split('.')
            : [null, null];

        const inToken: Token = ! swapInPolicyId || ! swapInNameHex
            ? 'lovelace'
            : new Asset(swapInPolicyId, swapInNameHex);
        const outToken: Token = ! swapOutPolicyId || ! swapOutNameHex
            ? 'lovelace'
            : new Asset(swapOutPolicyId, swapOutNameHex);

        return orderRouteService.route(dexs, BigInt(swapOutAmount), inToken, outToken, true)
            .then((result: OrderRouteResults) => {
                return response.send(JSON.parse(stringify(result)));
            })
            .catch((e: any) => {
                return response.send(super.failResponse(e));
            });
    }

    private spread(request: express.Request, response: express.Response) {
        const {
            dex,
            swapInToken,
            swapOutToken,
            swapInAmount,
            stepSize,
            lowestPrice,
        } = request.body;

        if (! dex) {
            return response.send(super.failResponse("Must supply 'dex'"));
        }

        if (! stepSize) {
            return response.send(super.failResponse("Must supply 'stepSize'"));
        }

        const [swapInPolicyId, swapInNameHex] = swapInToken
            ? (swapInToken as string).split('.')
            : [null, null];

        const [swapOutPolicyId, swapOutNameHex] = swapOutToken
            ? (swapOutToken as string).split('.')
            : [null, null];

        const inToken: Token = ! swapInPolicyId || ! swapInNameHex
            ? 'lovelace'
            : new Asset(swapInPolicyId, swapInNameHex);
        const outToken: Token = ! swapOutPolicyId || ! swapOutNameHex
            ? 'lovelace'
            : new Asset(swapOutPolicyId, swapOutNameHex);

        return orderLimiterService.createLimitEntries(dex, BigInt(swapInAmount), inToken, outToken, Number(stepSize), Number(lowestPrice))
            .then((result: LimiterResults) => {
                return response.send(JSON.parse(stringify(result)));
            })
            .catch((e: any) => {
                return response.send(super.failResponse(e));
            });
    }

}
