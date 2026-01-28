import winston from 'winston';

export class Logger {
    private static logger: winston.Logger | null = null;

    public static info(messages: any[]) {
        if (!Logger.logger) {
            Logger.setupLogger();
        }

        Logger.logger?.info(messages.join(' '));
    }

    public static error(messages: any[]) {
        if (!Logger.logger) {
            Logger.setupLogger();
        }

        Logger.logger?.error(messages.join(' '));
    }

    private static setupLogger() {
        Logger.logger = winston.createLogger({
            format: winston.format.simple(),
            levels: winston.config.syslog.levels,
            transports: [new winston.transports.Console()],
        });
    }
}
