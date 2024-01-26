import { BaseService } from './BaseService';
import { TokenMetadata } from '../types';
import axios from 'axios';
import CONFIG from '../config';

export class TokenMetadataService extends BaseService {

    boot(): Promise<any> {
        if (! CONFIG.GITHUB_ACCESS_TOKEN) return Promise.reject('Github access token not set in env.')

        return Promise.resolve();
    }

    fetchAsset(policyId: string, nameHex: string): Promise<TokenMetadata> {
        return axios.get(`https://raw.githubusercontent.com/cardano-foundation/cardano-token-registry/master/mappings/${policyId}${nameHex}.json`, {
            headers: {
                Authorization: `Bearer ${CONFIG.GITHUB_ACCESS_TOKEN}`,
                Host: '', // Fails without this set
            }
        }).then((response: any) => {
            return {
                policyId: policyId,
                nameHex: nameHex,
                name: response.data.name?.value ?? '',
                decimals: response.data.decimals?.value ?? 0,
                ticker: response.data.ticker?.value ?? '',
                logo: response.data.logo?.value ?? '',
                description: response.data.description?.value ?? '',
            }
        });
    }

}
