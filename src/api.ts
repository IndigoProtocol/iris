import { logError } from './logger';
import { ApiApplication } from './ApiApplication';
import { ApplicationContext } from './constants';

export const apiApp: ApiApplication = new ApiApplication();

await apiApp.start()
    .catch((reason) => {
        logError(`ApiApplication failed to start : ${reason}`, ApplicationContext.Api);
    });
