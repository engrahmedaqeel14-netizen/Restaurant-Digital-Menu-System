import { Router } from "express";
import { db, menusTable, restaurantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/display/:customerId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
  const customerId = raw.toUpperCase();
  const [restaurant] = await db
    .select()
    .from(restaurantsTable)
    .where(eq(restaurantsTable.customerId, customerId));
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  if (!restaurant.activeMenuId || !restaurant.activeMenuUrl) {
    res.status(404).json({ error: "No active menu for this restaurant" });
    return;
  }
  const [menu] = await db
    .select()
    .from(menusTable)
    .where(and(eq(menusTable.id, restaurant.activeMenuId), eq(menusTable.isActive, true)));
  if (!menu) {
    res.status(404).json({ error: "Active menu not found" });
    return;
  }
  res.json({
    restaurantId: restaurant.id,
    customerId: restaurant.customerId,
    restaurantName: restaurant.name,
    imageUrl: restaurant.activeMenuUrl,
    updatedAt: menu.uploadedAt.toISOString(),
  });
});

export default router;
