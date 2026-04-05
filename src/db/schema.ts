
import { timestamp } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { uuid, text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

const containerStatusEnum = pgEnum("job_status", [
    "Pending",
    "Processing",
    "Running",
    "Stopped",
    "Failed"
]);

export const containerStatusEnumValues = containerStatusEnum.enumValues;

export const containerTable = pgTable("containers", {
    id: uuid().primaryKey().defaultRandom(),
    image: text().notNull(),
    cmd: text().default(""),
    containerId: text().default(""),
    status: containerStatusEnum().default("Pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export default containerTable;