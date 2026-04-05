import { Worker } from "bullmq";
import { checkRunnableQueueName } from "./queue";
import connectionConfig from "./connection";
import db from "../db";
import { sql } from "drizzle-orm";
import containerTable, { containerStausEnumValues } from "../db/schema";

export const checkRunnableWorker = new Worker(checkRunnableQueueName, async () => {
    console.log("job started to run");
    await db.transaction(async (tx) => {
        const stmt = sql`
        SELECT 
        id 
        FROM ${containerTable}
        WHERE ${containerTable.status} = ${containerStausEnumValues[0]}
        ORDER BY ${containerTable.createdAt} ASC
        FOR UPDATE SKIP LOCKED 
        LIMIT 5
        `

        const result = await tx.execute(stmt);

        const jobIds = result.rows.map((j) => j.id);

        console.log(`Found ${jobIds.length} job to run ${jobIds}`);
    })
}, {
    connection: connectionConfig
});