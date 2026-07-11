
import { db } from './backend/src/db';
import { accounts } from './backend/src/db/schema';

async function checkAccounts() {
    try {
        const result = await db.select().from(accounts);
        console.log(`Total accounts in DB: ${result.length}`);
        if (result.length > 0) {
            console.log("First 3 accounts:", result.slice(0, 3));
        }
    } catch (error) {
        console.error("Error checking accounts:", error);
    }
    process.exit(0);
}

checkAccounts();
