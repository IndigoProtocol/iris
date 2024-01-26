import { DatabaseService } from './services/DatabaseService';
import { ApplicationContext } from './constants';
import { OrderRouteService } from './services/OrderRouteService';
import { OrderLimiterService } from './services/OrderLimiterService';

const dbApiService: DatabaseService = new DatabaseService(ApplicationContext.Api);
const orderRouteService: OrderRouteService = new OrderRouteService();
const orderLimiterService: OrderLimiterService = new OrderLimiterService();

export {
    dbApiService,
    orderRouteService,
    orderLimiterService,
}
