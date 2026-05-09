import { Router } from "express";
import { db, menusTable, restaurantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import { broadcastMenuUpdate } from "../lib/realtime";

const router = Router();

router.get("/menus", requireAuth, async (req, res): Promise<void> => {
  const restaurantIdRaw = req.query.restaurantId;
  let menus;
  if (restaurantIdRaw) {
    const restaurantId = parseInt(String(restaurantIdRaw), 10);
    menus = await db
      .select({
        id: menusTable.id,
        restaurantId: menusTable.restaurantId,
        restaurantName: restaurantsTable.name,
        restaurantCustomerId: restaurantsTable.customerId,
        imageUrl: menusTable.imageUrl,
        notes: menusTable.notes,
        isActive: menusTable.isActive,
        uploadedAt: menusTable.uploadedAt,
      })
      .from(menusTable)
      .leftJoin(restaurantsTable, eq(menusTable.restaurantId, restaurantsTable.id))
      .where(eq(menusTable.restaurantId, restaurantId))
      .orderBy(menusTable.uploadedAt);
  } else {
    menus = await db
      .select({
        id: menusTable.id,
        restaurantId: menusTable.restaurantId,
        restaurantName: restaurantsTable.name,
        restaurantCustomerId: restaurantsTable.customerId,
        imageUrl: menusTable.imageUrl,
        notes: menusTable.notes,
        isActive: menusTable.isActive,
        uploadedAt: menusTable.uploadedAt,
      })
      .from(menusTable)
      .leftJoin(restaurantsTable, eq(menusTable.restaurantId, restaurantsTable.id))
      .orderBy(menusTable.uploadedAt);
  }
  res.json(
    menus.map((m) => ({
      ...m,
      uploadedAt: m.uploadedAt.toISOString(),
    }))
  );
});

router.post("/menus/upload", requireAuth, async (req: any, res): Promise<void> => {
  const { restaurantId, notes, objectPath } = req.body;
  if (!restaurantId) {
    res.status(400).json({ error: "restaurantId is required" });
    return;
  }
  if (!objectPath) {
    res.status(400).json({ error: "objectPath is required" });
    return;
  }
  const rid = parseInt(String(restaurantId), 10);
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, rid));
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  // Build the serving URL from the objectPath returned by the storage endpoint
  const imageUrl = `/api/storage${objectPath}`;

  await db.update(menusTable).set({ isActive: false }).where(eq(menusTable.restaurantId, rid));

  const [menu] = await db
    .insert(menusTable)
    .values({ restaurantId: rid, imageUrl, notes: notes || null, isActive: true })
    .returning();

  await db
    .update(restaurantsTable)
    .set({ activeMenuId: menu.id, activeMenuUrl: imageUrl })
    .where(eq(restaurantsTable.id, rid));

  broadcastMenuUpdate(restaurant.customerId, {
    restaurantId: rid,
    customerId: restaurant.customerId,
    restaurantName: restaurant.name,
    imageUrl,
    updatedAt: menu.uploadedAt.toISOString(),
  });

  res.status(201).json({
    id: menu.id,
    restaurantId: menu.restaurantId,
    restaurantName: restaurant.name,
    restaurantCustomerId: restaurant.customerId,
    imageUrl: menu.imageUrl,
    notes: menu.notes,
    isActive: menu.isActive,
    uploadedAt: menu.uploadedAt.toISOString(),
  });
});

router.get("/menus/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [menu] = await db
    .select({
      id: menusTable.id,
      restaurantId: menusTable.restaurantId,
      restaurantName: restaurantsTable.name,
      restaurantCustomerId: restaurantsTable.customerId,
      imageUrl: menusTable.imageUrl,
      notes: menusTable.notes,
      isActive: menusTable.isActive,
      uploadedAt: menusTable.uploadedAt,
    })
    .from(menusTable)
    .leftJoin(restaurantsTable, eq(menusTable.restaurantId, restaurantsTable.id))
    .where(eq(menusTable.id, id));
  if (!menu) {
    res.status(404).json({ error: "Menu not found" });
    return;
  }
  res.json({ ...menu, uploadedAt: menu.uploadedAt.toISOString() });
});

router.delete("/menus/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [menu] = await db.delete(menusTable).where(eq(menusTable.id, id)).returning();
  if (!menu) {
    res.status(404).json({ error: "Menu not found" });
    return;
  }
  res.json({ success: true, message: "Menu deleted" });
});

export default router;
