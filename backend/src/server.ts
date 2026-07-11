import app from './app';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './db';
import { accounts } from './db/schema';

dotenv.config();

const PORT = 3000; // Hardcoded as per platform requirement

console.log("Starting server initialization...");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Undefined");

async function startServer() {
  try {
    // Check DB Connection
    try {
        const count = await db.select().from(accounts);
        console.log(`DB Connection OK. Found ${count.length} accounts.`);
    } catch (e) {
        console.error("DB Connection Failed:", e);
    }

    // Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        clearScreen: false,
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
      ################################################
      🛡️  Server listening on port: ${PORT} 🛡️
      ################################################
      `);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
