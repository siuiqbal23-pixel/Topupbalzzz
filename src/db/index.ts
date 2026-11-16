import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const preferredUrl = process.env.TOPUPBALZ_MY_POSTGRES_URL;
    const fallbackUrl = process.env.POSTGRES_URL || process.env.SQL_URL;
    const connectionString = preferredUrl || fallbackUrl;
    const selectedEnv = preferredUrl ? 'TOPUPBALZ_MY_POSTGRES_URL' : fallbackUrl ? 'POSTGRES_URL/SQL_URL' : 'individual SQL_* variables';

    if (connectionString) {
      const parsedUrl = new URL(connectionString);
      parsedUrl.searchParams.delete('sslmode');
      parsedUrl.searchParams.delete('sslrootcert');
      parsedUrl.searchParams.delete('sslcert');
      parsedUrl.searchParams.delete('sslkey');

      // Log only non-secret connection metadata to diagnose environment mismatches.
      console.info('[db-diagnostic] connection source:', selectedEnv, 'host:', parsedUrl.hostname, 'database:', parsedUrl.pathname.replace(/^\\//, ''));

      global._postgresPool = new Pool({
        connectionString: parsedUrl.toString(),
        ssl: { rejectUnauthorized: false },
        max: 5,
        connectionTimeoutMillis: 15000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        ssl: { rejectUnauthorized: false },
        max: 5,
        connectionTimeoutMillis: 15000,
      });
    }

    // Report schema visibility only; never log credentials or query data.
    global._postgresPool.query(
      "select current_database() as db, current_schema() as schema, current_setting('search_path') as search_path, to_regclass('public.users')::text as public_users"
    ).then(({ rows }) => {
      console.info('[db-diagnostic] database schema:', JSON.stringify(rows[0]));
    }).catch((error) => {
      console.error('[db-diagnostic] connection check failed:', error?.code || 'unknown');
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
