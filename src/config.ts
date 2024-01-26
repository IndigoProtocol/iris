import dotenv from 'dotenv';

dotenv.config();

type Config = {
    LOG_DIR: string,
    VERBOSE: boolean,

    OGMIOS_HOST: string,
    OGMIOS_PORT: number,
    OGMIOS_TLS: boolean,

    MYSQL_HOST: string,
    MYSQL_PORT: number,
    MYSQL_USERNAME: string,
    MYSQL_PASSWORD: string,
    MYSQL_DATABASE: string,

    OPERATION_WEBSOCKET_PORT: number,

    API_PORT: number,

    GITHUB_ACCESS_TOKEN: string,
}

const CONFIG: Config = {
    LOG_DIR: process.env.LOG_DIR || 'logs',
    VERBOSE: process.env.VERBOSE === 'true',

    OGMIOS_HOST: process.env.OGMIOS_HOST || 'localhost',
    OGMIOS_PORT: Number(process.env.OGMIOS_PORT) || 1337,
    OGMIOS_TLS: process.env.OGMIOS_TLS === 'true',

    MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
    MYSQL_PORT: Number(process.env.MYSQL_PORT) || 3306,
    MYSQL_USERNAME: process.env.MYSQL_USERNAME || '',
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || '',

    OPERATION_WEBSOCKET_PORT: Number(process.env.OPERATION_WEBSOCKET_PORT) || 8080,

    API_PORT: Number(process.env.API_PORT) || 8081,

    GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN || '',
}

export default CONFIG;
