import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  preferredLang: text("preferred_lang").default("en"),
  createdAt: text("created_at").notNull(),
});

export const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title"),
  language: text("language").default("en"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => chatSessions.id),
  role: text("role").notNull(), // user | assistant
  content: text("content"),
  messageType: text("message_type").notNull().default("text"),
  metadata: text("metadata"), // JSON string
  createdAt: text("created_at").notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  bookingRef: text("booking_ref").notNull().unique(),
  mode: text("mode").notNull(), // train | bus | flight
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  travelDate: text("travel_date"),
  status: text("status").notNull().default("pending"), // pending | confirmed | cancelled
  selectedOption: text("selected_option"), // JSON
  totalPrice: real("total_price"),
  providerPnr: text("provider_pnr"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const savedTravelers = sqliteTable("saved_travelers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  berthPref: text("berth_pref"),
});
