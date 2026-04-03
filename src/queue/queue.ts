import { Queue } from "bullmq";

export const checkRunnableQueueName = "check-runnable-queue";

export const checkRunnableSchedular = new Queue(checkRunnableQueueName);