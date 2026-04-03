import { checkRunnableSchedular } from "./queue";
import { checkRunnableWorker } from "./worker";

async function init() {
    await Promise.all([
        checkRunnableSchedular.upsertJobScheduler("check-runnable-scheduler", {
            every: 2 * 1000
        })
    ]);
};

init();