import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
};

vi.mock("@workspace/db", () => ({
  db: mockDb,
  adminsTable: { username: "username", passwordHash: "passwordHash", id: "id" },
  sessionsTable: { token: "token", expiresAt: "expiresAt", adminId: "adminId" },
  restaurantsTable: {
    customerId: "customerId",
    id: "id",
    createdAt: "createdAt",
    subscriptionStatus: "subscriptionStatus",
    name: "name",
  },
  menusTable: { uploadedAt: "uploadedAt" },
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

describe("Restaurant routes — auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/restaurants returns 401 without auth", async () => {
    const res = await request(app).get("/api/restaurants");
    expect(res.status).toBe(401);
  });

  it("GET /api/restaurants/stats returns 401 without auth", async () => {
    const res = await request(app).get("/api/restaurants/stats");
    expect(res.status).toBe(401);
  });

  it("POST /api/restaurants returns 401 without auth", async () => {
    const res = await request(app).post("/api/restaurants").send({ name: "Test" });
    expect(res.status).toBe(401);
  });

  it("DELETE /api/restaurants/1 returns 401 without auth", async () => {
    const res = await request(app).delete("/api/restaurants/1");
    expect(res.status).toBe(401);
  });

  it("PATCH /api/restaurants/1/subscription returns 401 without auth", async () => {
    const res = await request(app).patch("/api/restaurants/1/subscription").send({ status: "active" });
    expect(res.status).toBe(401);
  });
});
