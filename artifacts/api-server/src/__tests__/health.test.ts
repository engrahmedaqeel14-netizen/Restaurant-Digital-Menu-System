import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("@workspace/db", () => ({
  db: {},
  adminsTable: {},
  sessionsTable: {},
  restaurantsTable: {},
  menusTable: {},
}));

vi.mock("../lib/realtime.js", () => ({
  initWebSocket: vi.fn(),
  broadcastMenuUpdate: vi.fn(),
}));

vi.mock("../lib/objectStorage.js", () => ({
  ObjectStorageService: class MockObjectStorageService {},
  ObjectNotFoundError: class ObjectNotFoundError extends Error {},
  objectStorageClient: {},
}));

vi.mock("../lib/objectAcl.js", () => ({
  ObjectPermission: { READ: "READ", WRITE: "WRITE" },
  setObjectAclPolicy: vi.fn(),
  getObjectAclPolicy: vi.fn(),
  canAccessObject: vi.fn(),
}));

const { default: app } = await import("../app.js");

describe("GET /api/healthz", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
