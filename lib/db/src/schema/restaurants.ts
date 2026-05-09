import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantsTable = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  subscriptionStatus: text("subscription_status").notNull().default("active"),
  activeMenuId: integer("active_menu_id"),
  activeMenuUrl: text("active_menu_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRestaurantSchema = createInsertSchema(restaurantsTable).omit({
  id: true,
  customerId: true,
  activeMenuId: true,
  activeMenuUrl: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurantsTable.$inferSelect;
