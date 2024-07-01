import { DatumParameterKey } from '../../../constants';

export default {
  constructor: 0,
  fields: [
    {
      bytes: DatumParameterKey.SenderKeyHashes
    },
    {
      constructor: 0,
      fields: [
        {
          int: DatumParameterKey.MinReceive
        }
      ]
    }
  ]
};