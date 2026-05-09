import { Router } from "express";
import fs from "fs";
import path from "path";
import { requireAuth } from "./auth";

const router = Router();

const BACKUP_LOG_FILE =
  process.env.BACKUP_LOG_FILE ||
  path.resolve("/home/runner/workspace/.local/backup-history.json");

router.get("/admin/backup-history", requireAuth, (_req, res): void => {
  try {
    if (!fs.existsSync(BACKUP_LOG_FILE)) {
      res.json([]);
      return;
    }
    const raw = fs.readFileSync(BACKUP_LOG_FILE, "utf-8");
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) {
      res.json([]);
      return;
    }
    res.json(entries);
  } catch {
    res.json([]);
  }
});

export default router;
