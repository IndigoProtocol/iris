import { createLogger, format, Logger, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as fs from 'fs';
import CONFIG from './config';
import { ApplicationContext } from './constants';

if (!fs.existsSync(CONFIG.LOG_DIR)) {
  fs.mkdirSync(CONFIG.LOG_DIR);
}

const defaultLogger: Logger = createLogger(
  loggerConfig(ApplicationContext.Indexer)
);
const apiLogger: Logger = createLogger(loggerConfig(ApplicationContext.Api));

function loggerConfig(context: ApplicationContext) {
  return {
    transports: [
      new transports.Console(),
      new DailyRotateFile({
        level: 'info',
        dirname: `${CONFIG.LOG_DIR}/${context}`,
        filename: `info-%DATE%.${context}.log`,
        datePattern: 'MM-DD-YYYY',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        level: 'error',
        dirname: `${CONFIG.LOG_DIR}/${context}`,
        filename: `error-%DATE%.${context}.log`,
        datePattern: 'MM-DD-YYYY',
        maxFiles: '14d',
      }),
    ],
    format: format.combine(
      format.colorize(),
      format.timestamp({ format: 'MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
      })
    ),
  };
}

function logInfo(
  message: string,
  context: ApplicationContext = ApplicationContext.Indexer
): Logger {
  switch (context) {
    case ApplicationContext.Indexer:
      return defaultLogger.info(message);
    case ApplicationContext.Api:
      return apiLogger.info(message);
  }

  return defaultLogger.info(message);
}

function logError(
  message: string,
  context: ApplicationContext = ApplicationContext.Indexer
): Logger {
  switch (context) {
    case ApplicationContext.Indexer:
      return defaultLogger.error(message);
    case ApplicationContext.Api:
      return apiLogger.error(message);
  }

  return defaultLogger.error(message);
}

export { logInfo, logError };
