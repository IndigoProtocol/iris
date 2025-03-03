import { DatumParameterKey } from '../../../constants';

export default {
  constructor: 0,
  fields: [
    {
      bytes: DatumParameterKey.SenderKeyHashes,
    },
    {
      constructor: 1,
      fields: [
        {
          constructor: 0,
          fields: [
            {
              int: DatumParameterKey.MinReceiveA,
            },
            {
              int: DatumParameterKey.MinReceiveB,
            },
          ],
        },
      ],
    },
  ],
};
