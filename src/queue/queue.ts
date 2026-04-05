import { Queue } from "bullmq";

export const checkRunnableQueueName = "check-runnable-queue";
export const processingJobsQueueName = "processing-job-queue";
export const checkStateQueueName = "check-job-state-queue";

export const checkRunnableSchedular = new Queue(checkRunnableQueueName);

export const processingJobSchedular = new Queue(processingJobsQueueName);

export const checkStateJobSchedular = new Queue(checkStateQueueName);