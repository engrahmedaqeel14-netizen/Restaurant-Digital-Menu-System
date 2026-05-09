import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const menusTable = pgTable("menus", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  imageUrl: text("image_url").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(false),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMenuSchema = createInsertSchema(menusTable).omit({
  id: true,
  uploadedAt: true,
});
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type Menu = typeof menusTable.$inferSelect;
