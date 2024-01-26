import { DatumParameterKey } from '../../../constants';

export default {
  constructor: 0,
  fields: [
    {
      constructor: 0,
      fields: [
        {
          bytes: DatumParameterKey.ConsumedTxHash,
        }
      ]
    },
    {
      int: DatumParameterKey.Unknown
    }
  ]
}
