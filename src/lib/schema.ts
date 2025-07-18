import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  decimal,
  boolean,
  text,
  json,
  date,
  datetime,
  time,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

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

export const timeEntries = mysqlTable("time_entries", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  entryType: mysqlEnum("entry_type", [
    "clock_in",
    "clock_out",
    "start_lunch",
    "resume_shift",
  ]).notNull(),
  timestamp: datetime("timestamp").notNull(),
  date: date("date").notNull(),
  // Validaciones de negocio
  isValid: boolean("is_valid").default(true),
  validationNotes: text("validation_notes"),
  // Timezone específico para Chile
  timezone: varchar("timezone", { length: 50 }).default("America/Santiago"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const workSessions = mysqlTable("work_sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  date: date("date").notNull(),
  // Horarios principales
  clockInTime: datetime("clock_in_time"),
  clockOutTime: datetime("clock_out_time"),
  // Horarios de almuerzo
  lunchStartTime: datetime("lunch_start_time"),
  lunchEndTime: datetime("lunch_end_time"),
  // Cálculos automáticos
  totalWorkMinutes: int("total_work_minutes").default(0),
  totalLunchMinutes: int("total_lunch_minutes").default(0),
  totalWorkHours: decimal("total_work_hours", {
    precision: 5,
    scale: 2,
  }).default("0.00"),
  // Estados según ley chilena
  status: mysqlEnum("status", [
    "active",
    "on_lunch",
    "completed",
    "overtime_pending",
  ]).default("active"),
  // Validaciones laborales
  isOvertimeDay: boolean("is_overtime_day").default(false),
  overtimeMinutes: int("overtime_minutes").default(0),
  isValidSession: boolean("is_valid_session").default(true),
  validationErrors: json("validation_errors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const workStatistics = mysqlTable("work_statistics", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  // Períodos de cálculo
  weekStartDate: date("week_start_date").notNull(),
  monthStartDate: date("month_start_date").notNull(),
  // Estadísticas semanales
  totalHoursWeek: decimal("total_hours_week", {
    precision: 6,
    scale: 2,
  }).default("0.00"),
  totalDaysWeek: int("total_days_week").default(0),
  overtimeHoursWeek: decimal("overtime_hours_week", {
    precision: 5,
    scale: 2,
  }).default("0.00"),
  // Estadísticas mensuales
  totalHoursMonth: decimal("total_hours_month", {
    precision: 7,
    scale: 2,
  }).default("0.00"),
  totalDaysMonth: int("total_days_month").default(0),
  overtimeHoursMonth: decimal("overtime_hours_month", {
    precision: 6,
    scale: 2,
  }).default("0.00"),
  // Promedios
  averageEntryTime: time("average_entry_time"),
  averageExitTime: time("average_exit_time"),
  averageLunchDuration: int("average_lunch_duration"), // en minutos
  // Cumplimiento legal
  complianceScore: decimal("compliance_score", {
    precision: 5,
    scale: 2,
  }).default("100.00"),
  lawViolations: json("law_violations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const validationRules = mysqlTable("validation_rules", {
  id: int("id").primaryKey().autoincrement(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  ruleType: mysqlEnum("rule_type", [
    "time_limit",
    "sequence",
    "legal_compliance",
  ]).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  // Configuración específica
  minWorkMinutes: int("min_work_minutes").default(60), // 1 hora mínima
  maxLunchMinutes: int("max_lunch_minutes").default(120), // 2 horas máximo
  lunchStartHour: int("lunch_start_hour").default(12), // 12:00 PM
  lunchEndHour: int("lunch_end_hour").default(20), // 8:00 PM
  maxDailyHours: decimal("max_daily_hours", { precision: 3, scale: 1 }).default(
    "10.0"
  ),
  maxWeeklyHours: decimal("max_weekly_hours", {
    precision: 4,
    scale: 1,
  }).default("45.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;

export type WorkSession = typeof workSessions.$inferSelect;
export type NewWorkSession = typeof workSessions.$inferInsert;

export type WorkStatistics = typeof workStatistics.$inferSelect;
export type NewWorkStatistics = typeof workStatistics.$inferInsert;

export type ValidationRule = typeof validationRules.$inferSelect;
export type NewValidationRule = typeof validationRules.$inferInsert;
