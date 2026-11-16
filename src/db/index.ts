import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    // Prefer the Supabase integration variable linked to the current project.
    // The older unprefixed POSTGRES_URL may still point to the retired project.
    const connectionString =
      process.env.TOPUPBALZ_MY_POSTGRES_URL ||
      process.env.POSTGRES_URL ||
      process.env.SQL_URL;

    if (connectionString) {
      // Keep TLS configuration in the Pool options. SSL query parameters in
      // the URL override the explicit ssl object in node-postgres.
      const parsedUrl = new URL(connectionString);
      parsedUrl.searchParams.delete('sslmode');
      parsedUrl.searchParams.delete('sslrootcert');
      parsedUrl.searchParams.delete('sslcert');
      parsedUrl.searchParams.delete('sslkey');

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

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
