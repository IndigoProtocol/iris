import { DatabaseService } from './services/DatabaseService';
import { ApplicationContext } from './constants';

const dbApiService: DatabaseService = new DatabaseService(
  ApplicationContext.Api
);

export { dbApiService };
