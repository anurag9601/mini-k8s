import { checkRunnableSchedular, checkStateJobSchedular, processingJobSchedular } from "./queue";
import { checkRunnableWorker, processJobsWorker, checkStateJobWorker } from "./worker";

async function init() {
    await Promise.all([
        checkRunnableSchedular.upsertJobScheduler("check-runnable-scheduler", {
            every: 2 * 1000,
        }),

        processingJobSchedular.upsertJobScheduler("processing-job-scheduler", {
            every: 5 * 1000,
        }),

        checkStateJobSchedular.upsertJobScheduler("check-job-state-scheduler", {
            every: 10 * 1000,
        })
    ]);
};

init();