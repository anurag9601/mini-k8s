import { Worker } from "bullmq";
import { checkRunnableQueueName, checkStateQueueName, processingJobsQueueName } from "./queue";
import connectionConfig from "./connection";
import db from "../db";
import { eq, inArray, sql } from "drizzle-orm";
import containerTable, { containerStatusEnumValues } from "../db/schema";
import docker from "../docker/connection";

export async function pullDockerImage(image: string) {
    try {
        return new Promise(async (res) => {
            const stream = await docker.pull(image);
            docker.modem.followProgress(stream, () => {
                res(true);
            })
        })
    } catch (err) {
        return false;
    }
}

export const checkRunnableWorker = new Worker(checkRunnableQueueName, async () => {
    console.log(`[Runnable]: Checking pending containers.`);
    await db.transaction(async (tx) => {
        const stmt = sql`
        SELECT 
        id 
        FROM ${containerTable}
        WHERE ${containerTable.status} = ${containerStatusEnumValues[0]}
        ORDER BY ${containerTable.createdAt} ASC
        FOR UPDATE SKIP LOCKED 
        LIMIT 5
        `

        const result = await tx.execute(stmt);

        const jobIds: string[] = Array.from(result.rows.map<string>((j) => j.id as string));

        if (jobIds.length > 0) {
            await tx.update(containerTable).set({ status: containerStatusEnumValues[1] }).where(inArray(containerTable.id, jobIds));

            console.log(`[Runnable]: sending ${jobIds.length} jobs in the processing queue: ${jobIds}`);
        } else {
            console.log(`[Runnable]: no jobs to process in the queue.`);
        }
    }, { isolationLevel: "read committed", accessMode: "read write" })
}, {
    connection: connectionConfig
});

export const processJobsWorker = new Worker(processingJobsQueueName, async () => {
    console.log(`[Processing]: Checking jobs are available to process.`);

    await db.transaction(async (tx) => {
        const stmt = sql`
        SELECT 
        *
        FROM ${containerTable}
        WHERE ${containerTable.status} = ${containerStatusEnumValues[1]}
        ORDER BY ${containerTable.createdAt} ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
        `;

        const result = await tx.execute(stmt);

        const jobIds: string[] = Array.from(result.rows.map<string>((j) => j.id as string));

        console.log(`[Processing]: Received ${jobIds.length} to precess.`);

        for (let jobId of jobIds) {
            const [job] = await db.select().from(containerTable).where(eq(containerTable.id, jobId));

            const presentImage = await docker.listImages({
                filters: {
                    reference: [`${job.image}:latest`]
                }
            });

            if (!presentImage || presentImage.length <= 0) {
                console.log(`[Docker]: Pulling image ${job.image}:lastest`);
                const isImagePulled = await pullDockerImage(`${job.image}:latest`);

                if (!isImagePulled) {
                    console.log(`[Docker]: image not found with the name ${job.image}`);

                    await tx.update(containerTable).set({ status: containerStatusEnumValues[4] }).where(eq(containerTable.id, job.id));

                    return;
                }
            };

            const container = docker.createContainer({
                Image: `${job.image}:latest`,
                Tty: false,
                HostConfig: {
                    AutoRemove: false
                },
                Cmd: job.cmd?.trim() !== "" ? job.cmd?.split(" ") : undefined,
            });

            container.then(async c => {
                await c.start();

                console.log(`[Docker]: Container ${c.id} is running successfully!!`);

                await db.update(containerTable).set({ containerId: c.id, status: containerStatusEnumValues[2] }).where(eq(containerTable.id, job.id));
            });

        }
    }, { accessMode: "read write", isolationLevel: "read committed" })
}, {
    connection: connectionConfig
});

export const checkStateJobWorker = new Worker(checkStateQueueName, async () => {
    console.log(`[Monitoring]: Checking contaier status.`);
    await db.transaction(async (tx) => {

        const stmt = sql`
        SELECT 
        *
        FROM ${containerTable}
        WHERE ${containerTable.status} = ${containerStatusEnumValues[2]}
        ORDER BY ${containerTable.createdAt} ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
        `;

        const result = await tx.execute(stmt);

        const jobIds: string[] = Array.from(result.rows.map<string>(j => j.id as string));

        console.log(`[Monitoring]: received ${jobIds} job to monitor.`);

        for (let jobId of jobIds) {
            const [job] = await tx.select().from(containerTable).where(eq(containerTable.id, jobId));

            if (job && job.containerId) {
                const container = docker.getContainer(job.containerId);

                const containerInspection = await container.inspect();

                const containerStatus = containerInspection.State.Status;

                console.log(`[Monitoring]: Container status ${containerStatus}.`);

                if (containerStatus === "exited") {
                    await tx.update(containerTable).set({ status: containerStatusEnumValues[3] }).where(eq(containerTable.id, jobId));

                    await container.remove();

                    console.log(`[Docker]: container ${container.id} is removed.`);
                }
            }
        }
    }, { accessMode: "read write", isolationLevel: "read committed" });
}, { connection: connectionConfig });