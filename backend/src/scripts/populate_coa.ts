
import { seedCOA } from '../db/seed_coa';
import { db } from '../db';

async function run() {
    try {
        console.log("Force populating COA...");
        await seedCOA();
        console.log("COA population finished.");
        process.exit(0);
    } catch (error) {
        console.error("COA population failed:", error);
        process.exit(1);
    }
}

run();
