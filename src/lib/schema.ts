import { mysqlTable, varchar, timestamp, int } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  rut: varchar("rut", { length: 10 }).notNull().unique(),
  nombre: varchar("nombre", { length: 50 }).notNull(),
  apellido_paterno: varchar("apellido_paterno", { length: 50 }).notNull(),
  apellido_materno: varchar("apellido_materno", { length: 50 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
