import * as dotenv from 'dotenv';
import { join } from 'path';
import { parse } from 'pg-connection-string';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const dbConfig = connectionString ? parse(connectionString) : null;

const host = dbConfig?.host ?? process.env.DATABASE_HOST;
const port = Number(dbConfig?.port ?? process.env.DATABASE_PORT ?? 5432);
const username = dbConfig?.user ?? process.env.DATABASE_USERNAME;
const password = dbConfig?.password ?? process.env.DATABASE_PASSWORD;
const database = dbConfig?.database ?? process.env.DATABASE_NAME;
const rawSsl = process.env.DATABASE_SSL;

if (!host || !Number.isFinite(port) || !username || !password || !database) {
  throw new Error(
    'Database config is missing. Set DATABASE_URL or DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME.',
  );
}

const useSsl =
  rawSsl !== undefined ? rawSsl === 'true' : host !== 'localhost' && host !== '127.0.0.1';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: true,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  extra: {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT ?? 30000),
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
