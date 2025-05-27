import { DatumParameterKey } from '../../../constants';
import { DatumParameters } from '../../../types';
import _ from 'lodash';

/**
 * https://github.com/minswap/minswap-dex-v2/blob/main/src/types/pool.ts
 */
export default {
  constructor: 0,
  fields: [
    (definedDefinition: any, foundParameters: DatumParameters) => {
      if (Array.isArray(definedDefinition)) {
        // Only support 2 tokens as now, currently we whitelisted pools
        // so we can update when new pool variants are added
        const balance0 = _.get(definedDefinition, '[0].int');
        const balance1 = _.get(definedDefinition, '[1].int');
        if (typeof balance0 === 'bigint' && typeof balance1 === 'bigint') {
          foundParameters[DatumParameterKey.Balance0] = balance0;
          foundParameters[DatumParameterKey.Balance1] = balance1;
        }
      }
    },
    {
      int: DatumParameterKey.TotalLpTokens,
    },
    {
      int: DatumParameterKey.Amp,
    },
    {
      bytes: DatumParameterKey.OrderHash,
    },
  ],
};
