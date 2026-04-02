
import { timestamp } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { uuid, text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

const containerStatusEnum = pgEnum("job-status", [
    "Pending",
    "Processing",
    "Running",
    "Stoped",
    "Failed"
])

export const containerTable = pgTable("containers", {
    id: uuid().primaryKey().defaultRandom(),
    image: text().notNull(),
    cmd: text().default(""),
    status: containerStatusEnum().default("Pending"),
    createdAt: timestamp("created-at").defaultNow().notNull(),
    updatedAt: timestamp("updated-at").$onUpdate(() => new Date()),
});