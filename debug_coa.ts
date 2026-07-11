
const { Pool } = require('pg');
const dotenv = require('dotenv');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./backend/src/db/schema');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function debug() {
    console.log("--- DEBUGGING COA ---");
    console.log("Environment Variables:", Object.keys(process.env).filter(k => k.includes('DB') || k.includes('URL')));
    console.log("Database URL:", process.env.DATABASE_URL ? "Defined" : "Undefined");
    
    console.log("Schema exports:", Object.keys(schema));

    if (!schema.accounts) {
        console.error("ERROR: accounts table not found in schema export!");
        process.exit(1);
    }

    try {
        // 1. Raw SQL Query
        console.log("\n1. Running Raw SQL: SELECT count(*) FROM accounts");
        const res = await pool.query('SELECT count(*) FROM accounts');
        console.log("Raw SQL Result:", res.rows[0]);

        if (parseInt(res.rows[0].count) > 0) {
            const sample = await pool.query('SELECT * FROM accounts LIMIT 3');
            console.log("First 3 rows (Raw SQL):", sample.rows);
        } else {
            console.log("Table 'accounts' is empty (Raw SQL).");
        }

        // 2. Drizzle Query
        console.log("\n2. Running Drizzle Query: db.select().from(accounts)");
        const drizzleRes = await db.select().from(schema.accounts);
        console.log(`Drizzle Result Count: ${drizzleRes.length}`);
        if (drizzleRes.length > 0) {
            console.log("First 3 rows (Drizzle):", drizzleRes.slice(0, 3));
        }

    } catch (err) {
        console.error("Debug Error:", err);
    } finally {
        await pool.end();
    }
}

debug();
