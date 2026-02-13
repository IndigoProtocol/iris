import { Block } from '@cardano-ogmios/schema';
import { AssetClass } from './models/SystemParamsV1';
import { StakingPositionDatum } from './models/StakingPositionDatum';
import CBOR from 'cbor';
import { bech32 } from 'bech32';
import { stringify } from '../../utils';

export function stringifyBlock(block: Block): string {
    return JSON.stringify(block, (key, value) => {
        if (typeof value === 'bigint' && key) {
            return value.toString();
        }

        return value;
    });
}

export function mysqlDate(): string {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function assetClassToString(assetClass: AssetClass): string {
    return (
        assetClass[0].unCurrencySymbol +
        '.' +
        Buffer.from(assetClass[1].unTokenName).toString('hex')
    );
}


export function toStakingPositionV1(datum: string): StakingPositionDatum {
    const stakingPositionDatum = CBOR.decode(
        Buffer.from(datum, 'hex')
    ).value;
    const lockedAmount = new Map<number, [number, number]>();
    if ('forEach' in stakingPositionDatum[1]) {
        stakingPositionDatum[1].forEach((value: any, key: number) => {
            lockedAmount.set(key, value.value);
        });
    }
    return {
        owner: stakingPositionDatum[0].toString('hex'),
        locked_amount: stringify(Object.fromEntries(lockedAmount)), // TODO
        snapshot_ada: stakingPositionDatum[2].value[0].value[0],
    } as StakingPositionDatum;
}

export function toStakingPosition(datum: string): StakingPositionDatum {
    const stakingPositionDatum = CBOR.decode(
        Buffer.from(datum, 'hex')
    ).value[0].value;
    const lockedAmount = new Map<number, [number, number]>();
    const laDatum = stakingPositionDatum[1];
    if ('forEach' in laDatum) {
        laDatum.forEach((value: any, key: number) => {
            lockedAmount.set(key, value.value);
        });
    }
    return {
        owner: stakingPositionDatum[0].toString('hex'),
        locked_amount: stringify(Object.fromEntries(lockedAmount)), // TODO
        snapshot_ada: stakingPositionDatum[2].value[0],
    } as StakingPositionDatum;
}

export function toAddress(valHash: string, networkId: string) {
    return bech32.encode(
        networkId === 'mainnet' ? 'addr' : 'addr_test', 
        bech32.toWords(Buffer.from((networkId === 'mainnet' ? '71' : '70') + valHash, 'hex'))
    );
}

export function toPubKeyAddress(valHash: string, networkId: string) {
    return bech32.encode(
        networkId === 'mainnet' ? 'addr' : 'addr_test', 
        bech32.toWords(Buffer.from((networkId === 'mainnet' ? '61' : '60') + valHash, 'hex'))
    );
}

export function toPubKeyAddressWithStake(valHash: string, stakeHash: string, networkId: string) {
    return bech32.encode(
        networkId === 'mainnet' ? 'addr' : 'addr_test', 
        bech32.toWords(Buffer.from((networkId === 'mainnet' ? '01' : '00') + valHash + stakeHash, 'hex')),
        224
    );
}

export function toScriptAddress(valHash: string, networkId: string) {
    return bech32.encode(
        networkId === 'mainnet' ? 'addr' : 'addr_test', 
        bech32.toWords(Buffer.from((networkId === 'mainnet' ? '71' : '70') + valHash, 'hex'))
    );
}

export function toScriptAddressWithStake(valHash: string, stakeHash: string, networkId: string) {
    return bech32.encode(
        networkId === 'mainnet' ? 'addr' : 'addr_test', 
        bech32.toWords(Buffer.from((networkId === 'mainnet' ? '31' : '30') + valHash + stakeHash, 'hex')),
        224
    );
}

export function decodeBech32(address: string): string {
    return Buffer.from(bech32.fromWords(bech32.decodeUnsafe(address, 112)?.words ?? [])).toString('hex').slice(2);
}