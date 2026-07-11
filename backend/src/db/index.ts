
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // Maksimal 50 koneksi
  idleTimeoutMillis: 30000, // Tutup koneksi yang nganggur setelah 30 detik
  connectionTimeoutMillis: 5000, // Timeout jika tidak dapat koneksi dalam 5 detik
  query_timeout: 10000, // Batalkan query yang memakan waktu lebih dari 10 detik
});

// Tangkap error pada level pool agar aplikasi tidak crash
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Aktifkan logger: true agar semua query SQL (audit trail) tampil di console server
export const db = drizzle(pool, { schema, logger: true });
