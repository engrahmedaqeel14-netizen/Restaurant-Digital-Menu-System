import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, adminsTable, sessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const router = Router();

function getToken(req: any): string | null {
  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.headers["cookie"];
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

export async function requireAuth(req: any, res: any, next: any): Promise<void> {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const now = new Date();
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, now)));
  if (!session) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }
  req.adminId = session.adminId;
  next();
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ adminId: admin.id, token, expiresAt });
  res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
  res.json({ success: true, admin: { id: admin.id, username: admin.username } });
});

router.post("/auth/logout", requireAuth, async (req: any, res): Promise<void> => {
  const token = getToken(req);
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.setHeader("Set-Cookie", "session=; Path=/; HttpOnly; Max-Age=0");
  res.json({ success: true, message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req: any, res): Promise<void> => {
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, req.adminId));
  if (!admin) {
    res.status(401).json({ error: "Admin not found" });
    return;
  }
  res.json({ id: admin.id, username: admin.username });
});

export default router;
