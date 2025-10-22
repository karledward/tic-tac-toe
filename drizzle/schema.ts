import { mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Games table to track tic-tac-toe match results
 */
export const games = mysqlTable("games", {
  id: varchar("id", { length: 64 }).primaryKey(),
  playerXId: varchar("playerXId", { length: 64 }).notNull().references(() => users.id),
  playerOId: varchar("playerOId", { length: 64 }).notNull().references(() => users.id),
  winnerId: varchar("winnerId", { length: 64 }).references(() => users.id), // null for draw
  result: mysqlEnum("result", ["X", "O", "draw"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Game rooms table for multiplayer lobby system
 */
export const gameRooms = mysqlTable("gameRooms", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  hostId: varchar("hostId", { length: 64 }).notNull().references(() => users.id),
  guestId: varchar("guestId", { length: 64 }).references(() => users.id), // null until someone joins
  status: mysqlEnum("status", ["waiting", "playing", "finished"]).default("waiting").notNull(),
  currentTurn: mysqlEnum("currentTurn", ["X", "O"]).default("X"),
  boardState: text("boardState").notNull(), // JSON array of 9 cells, default set in application code
  winnerId: varchar("winnerId", { length: 64 }).references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameRoom = typeof gameRooms.$inferSelect;
export type InsertGameRoom = typeof gameRooms.$inferInsert;
