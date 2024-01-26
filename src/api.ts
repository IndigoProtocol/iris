import { logError } from './logger';
import { ApiApplication } from './ApiApplication';
import { ApplicationContext } from './constants';

export const apiApp: ApiApplication = new ApiApplication();

export const handler = async function(event: any, context: any) {
    await apiApp.start()
        .catch((reason) => {
            logError(`ApiApplication failed to start : ${reason}`, ApplicationContext.Api);
        });

    return context.logStreamName;
}
