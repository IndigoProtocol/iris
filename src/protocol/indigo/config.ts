import dotenv from 'dotenv';
import { SystemParamsV1 } from './models/SystemParamsV1';
import { SystemParamsV2 } from './models/SystemParamsV2';
import axios from 'axios';
import { toAddress } from './helpers';
import { SystemParamsV2v1 } from './models/SystemParamsV2v1';

dotenv.config();

type Config = {
    ENV_NAME?: string;

    CORE_MYSQL_HOST: string;
    CORE_MYSQL_USERNAME: string;
    CORE_MYSQL_PASSWORD: string;
    CORE_MYSQL_DATABASE: string;
    CORE_MYSQL_PORT: number;

    OGMIOS_HOST: string;
    OGMIOS_PORT: number;
    OGMIOS_TLS: boolean;

    NETWORK_ID: string;

    V1_CDP_CREATOR_ADDRESS?: string;
    V1_CDP_VAL_HASH?: string;
    V1_CDP_ADDRESS?: string;
    V1_COLLECTOR_ADDRESS?: string;
    V1_EXECUTE_ADDRESS?: string;
    V1_GOV_ADDRESS?: string;
    V1_POLL_MANAGER_ADDRESS?: string;
    V1_POLL_SHARD_ADDRESS?: string;
    V1_STABILITY_POOL_ADDRESS?: string;
    V1_STAKING_ADDRESS?: string;
    V1_TREASURY_ADDRESS?: string;
    V1_LIQUIDITY_POSITION_ADDRESS?: string;

    V2_CDP_CREATOR_ADDRESS?: string;
    V2_CDP_ADDRESS?: string;
    V2_COLLECTOR_ADDRESS?: string;
    V2_EXECUTE_ADDRESS?: string;
    V2_GOV_ADDRESS?: string;
    V2_POLL_MANAGER_ADDRESS?: string;
    V2_POLL_SHARD_ADDRESS?: string;
    V2_STABILITY_POOL_ADDRESS?: string;
    V2_STAKING_ADDRESS?: string;
    V2_TREASURY_ADDRESS?: string;
};

const sysParamsV1Url: string| undefined = (() => {
    const res = process.env.SYSTEM_PARAMS_V1_URL;
    if (!res) {
        return undefined
    }
    return res;
})();

const sysParamsV2Url: string | undefined = (() => {
    const res = process.env.SYSTEM_PARAMS_V2_URL;
    if (!res) {
        return undefined
    }
    return res;
})();

const sysParamsV2v1Url: string | undefined = (() => {
    const res = process.env.SYSTEM_PARAMS_V2V1_URL;
    if (!res) {
        return undefined
    }
    return res;
})();

function getV1CdpCreatorAddress(): string | undefined {
    return addressFromEnv(process.env.V1_CDP_CREATOR_VALIDATOR_HASH, process.env.V1_CDP_CREATOR_ADDRESS);
}

function getV1CdpAddress(): string | undefined {
    return addressFromEnv(process.env.V1_CDP_VALIDATOR_HASH, process.env.V1_CDP_ADDRESS);
}

function getV1CollectorAddress(): string | undefined {
    return addressFromEnv(process.env.V1_COLLECTOR_VALIDATOR_HASH, process.env.V1_COLLECTOR_ADDRESS);
}

function getV1ExecuteAddress(): string | undefined {
    return addressFromEnv(process.env.V1_EXECUTE_VALIDATOR_HASH, process.env.V1_EXECUTE_ADDRESS);
}

function getV1GovAddress(): string | undefined {
    return addressFromEnv(process.env.V1_GOV_VALIDATOR_HASH, process.env.V1_GOV_ADDRESS);
}

function getV1PollManagerAddress(): string | undefined {
    return addressFromEnv(process.env.V1_POLL_MANAGER_VALIDATOR_HASH, process.env.V1_POLL_MANAGER_ADDRESS);
}

function getV1PollShardAddress(): string | undefined {
    return addressFromEnv(process.env.V1_POLL_SHARD_VALIDATOR_HASH, process.env.V1_POLL_SHARD_ADDRESS);
}

function getV1StabilityPoolAddress(): string | undefined {
    return addressFromEnv(process.env.V1_STABILITY_POOL_VALIDATOR_HASH, process.env.V1_STABILITY_POOL_ADDRESS);
}

function getV1StakingAddress(): string | undefined {
    return addressFromEnv(process.env.V1_STAKING_VALIDATOR_HASH, process.env.V1_STAKING_ADDRESS);
}

function getV1TreasuryAddress(): string | undefined {
    return addressFromEnv(process.env.V1_TREASURY_VALIDATOR_HASH, process.env.V1_TREASURY_ADDRESS);
}

function addressFromEnv(hash: string | undefined, address: string | undefined) {
    if (hash) {
        return toAddress(hash, getNetworkId());
    }
    return address;
}

const CONFIG = {
    ENV_NAME: process.env.ENV_NAME || 'local',

    CORE_MYSQL_HOST: process.env.CORE_MYSQL_HOST || '',
    CORE_MYSQL_USERNAME: process.env.CORE_MYSQL_USERNAME || '',
    CORE_MYSQL_PASSWORD: process.env.CORE_MYSQL_PASSWORD || '',
    CORE_MYSQL_DATABASE: process.env.CORE_MYSQL_DATABASE || '',
    CORE_MYSQL_PORT: process.env.CORE_MYSQL_PORT || 3306,

    OGMIOS_HOST: process.env.OGMIOS_HOST || 'localhost',
    OGMIOS_PORT: Number(process.env.OGMIOS_PORT) || 1337,
    OGMIOS_TLS: process.env.OGMIOS_TLS === 'true',

    NETWORK_ID: getNetworkId(),

    V1_CDP_CREATOR_ADDRESS: getV1CdpCreatorAddress(),
    V1_CDP_VAL_HASH: process.env.V1_CDP_VALIDATOR_HASH,
    V1_CDP_ADDRESS: getV1CdpAddress(),
    V1_COLLECTOR_ADDRESS: getV1CollectorAddress(),
    V1_EXECUTE_ADDRESS: getV1ExecuteAddress(),
    V1_GOV_ADDRESS: getV1GovAddress(),
    V1_POLL_MANAGER_ADDRESS: getV1PollManagerAddress(),
    V1_POLL_SHARD_ADDRESS: getV1PollShardAddress(),
    V1_STABILITY_POOL_ADDRESS: getV1StabilityPoolAddress(),
    V1_STAKING_ADDRESS: getV1StakingAddress(),
    V1_TREASURY_ADDRESS: getV1TreasuryAddress(),
} as Config;

function getNetworkId(): string {
    const networkIdEnv = process.env.NETWORK_ID ?? '';

    if (networkIdEnv.includes('mainnet')) {
        return 'mainnet';
    } else if (networkIdEnv.includes('preview')) {
        return 'preview';
    } else if (networkIdEnv.includes('preprod')) {
        return 'preprod';
    }

    throw Error("Invalid network specifier.");
}

export async function fetchSystemParamsV1(): Promise<SystemParamsV1 | undefined> {
    const res = await axios.get("https://config.indigoprotocol.io/mainnet/mainnet-system-params-v1.json");
    return res.data as SystemParamsV1;
}

export async function fetchSystemParamsV2(): Promise<SystemParamsV2 | undefined> {
    const res = await axios.get("https://config.indigoprotocol.io/mainnet/mainnet-system-params-v21.json");
    return res.data as SystemParamsV2;
}

export async function fetchSystemParamsV2v1(): Promise<SystemParamsV2v1 | undefined> {
    const res = await axios.get("https://config.indigoprotocol.io/mainnet/mainnet-system-params-v21.json");
    return res.data as SystemParamsV2v1;
}

export default CONFIG;