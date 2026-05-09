import { Router } from "express";
import { db, restaurantsTable, menusTable } from "@workspace/db";
import { eq, count, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

function generateCustomerId(existingIds: string[]): string {
  let num = existingIds.length + 1;
  let id = `REST${String(num).padStart(3, "0")}`;
  while (existingIds.includes(id)) {
    num++;
    id = `REST${String(num).padStart(3, "0")}`;
  }
  return id;
}

router.get("/restaurants/stats", requireAuth, async (_req, res): Promise<void> => {
  const allRestaurants = await db.select().from(restaurantsTable);
  const total = allRestaurants.length;
  const active = allRestaurants.filter((r) => r.subscriptionStatus === "active").length;
  const inactive = allRestaurants.filter((r) => r.subscriptionStatus === "inactive").length;
  const suspended = allRestaurants.filter((r) => r.subscriptionStatus === "suspended").length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentMenus = await db
    .select()
    .from(menusTable)
    .where(gte(menusTable.uploadedAt, sevenDaysAgo));
  res.json({ total, active, inactive, suspended, recentUploads: recentMenus.length });
});

router.get("/restaurants", requireAuth, async (_req, res): Promise<void> => {
  const restaurants = await db.select().from(restaurantsTable).orderBy(restaurantsTable.createdAt);
  res.json(
    restaurants.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/restaurants", requireAuth, async (req, res): Promise<void> => {
  const { name, contactEmail, contactPhone, address } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const existing = await db.select({ customerId: restaurantsTable.customerId }).from(restaurantsTable);
  const customerId = generateCustomerId(existing.map((r) => r.customerId));
  const [restaurant] = await db
    .insert(restaurantsTable)
    .values({ customerId, name, contactEmail, contactPhone, address, subscriptionStatus: "active" })
    .returning();
  res.status(201).json({ ...restaurant, createdAt: restaurant.createdAt.toISOString() });
});

router.get("/restaurants/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, id));
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json({ ...restaurant, createdAt: restaurant.createdAt.toISOString() });
});

router.patch("/restaurants/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { name, contactEmail, contactPhone, address } = req.body;
  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (contactEmail !== undefined) updates.contactEmail = contactEmail;
  if (contactPhone !== undefined) updates.contactPhone = contactPhone;
  if (address !== undefined) updates.address = address;
  const [restaurant] = await db
    .update(restaurantsTable)
    .set(updates)
    .where(eq(restaurantsTable.id, id))
    .returning();
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json({ ...restaurant, createdAt: restaurant.createdAt.toISOString() });
});

router.delete("/restaurants/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [restaurant] = await db.delete(restaurantsTable).where(eq(restaurantsTable.id, id)).returning();
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json({ success: true, message: "Restaurant deleted" });
});

router.patch("/restaurants/:id/subscription", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const { status } = req.body;
  if (!["active", "inactive", "suspended"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const [restaurant] = await db
    .update(restaurantsTable)
    .set({ subscriptionStatus: status })
    .where(eq(restaurantsTable.id, id))
    .returning();
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json({ ...restaurant, createdAt: restaurant.createdAt.toISOString() });
});

export default router;
