import { IndexerApplication } from '../IndexerApplication';
import { ApiApplication } from '../ApiApplication';

export abstract class BaseService {

    abstract boot(app: IndexerApplication | ApiApplication): Promise<void>;

}
