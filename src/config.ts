import dotenv from 'dotenv';

dotenv.config();

type Config = {
    LOG_DIR: string,
    VERBOSE: boolean,

    OGMIOS_HOST: string,
    OGMIOS_PORT: number,
    OGMIOS_TLS: boolean,

    DATABASE_HOST: string,
    DATABASE_PORT: number,
    DATABASE_USERNAME: string,
    DATABASE_PASSWORD: string,
    DATABASE: string,
    DATABASE_TYPE: string,

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

    DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
    DATABASE_PORT: Number(process.env.DATABASE_PORT) || 3306,
    DATABASE_USERNAME: process.env.DATABASE_USERNAME || '',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',
    DATABASE: process.env.DATABASE || '',
    DATABASE_TYPE: process.env.DATABASE_TYPE || 'mysql',

    OPERATION_WEBSOCKET_PORT: Number(process.env.OPERATION_WEBSOCKET_PORT) || 8080,

    API_PORT: Number(process.env.API_PORT) || 8081,

    GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN || '',
}

console.log(CONFIG);

export default CONFIG;
