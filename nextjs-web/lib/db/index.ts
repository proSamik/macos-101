import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

/**
 * Database connection setup with environment-specific optimization
 * Uses Neon.com serverless driver for production and regular postgres for development
 */
function createDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Use Neon serverless driver for production (optimized for serverless environments)
  if (process.env.NODE_ENV === 'production') {
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  }

  // Use regular postgres driver for development
  const sql = postgres(databaseUrl, {
    max: 1, // Limit connection pool for development
  });
  
  return drizzle(sql, { schema });
}

export const db = createDatabaseConnection();
export { schema };
