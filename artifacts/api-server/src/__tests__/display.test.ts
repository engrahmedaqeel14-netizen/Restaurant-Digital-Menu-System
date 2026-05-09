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
  restaurantsTable: { customerId: "customerId", id: "id", activeMenuId: "activeMenuId", activeMenuUrl: "activeMenuUrl" },
  menusTable: { id: "id", isActive: "isActive", uploadedAt: "uploadedAt" },
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

describe("GET /api/display/:customerId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when restaurant is not found", async () => {
    const chain = { where: vi.fn().mockResolvedValue([]) };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

    const res = await request(app).get("/api/display/NOTEXIST");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns 404 when restaurant has no active menu", async () => {
    const restaurantWithNoMenu = {
      id: 1,
      customerId: "REST001",
      name: "Test Restaurant",
      activeMenuId: null,
      activeMenuUrl: null,
    };

    const chain = { where: vi.fn().mockResolvedValue([restaurantWithNoMenu]) };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

    const res = await request(app).get("/api/display/REST001");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/no active menu/i);
  });

  it("returns menu data when restaurant and active menu exist", async () => {
    const restaurant = {
      id: 1,
      customerId: "REST001",
      name: "Test Restaurant",
      activeMenuId: 42,
      activeMenuUrl: "/api/storage/menus/test.jpg",
    };
    const menu = {
      id: 42,
      isActive: true,
      uploadedAt: new Date("2025-01-15T10:00:00Z"),
    };

    const restaurantChain = { where: vi.fn().mockResolvedValue([restaurant]) };
    const menuChain = { where: vi.fn().mockResolvedValue([menu]) };

    mockDb.select
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue(restaurantChain) })
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue(menuChain) });

    const res = await request(app).get("/api/display/REST001");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      restaurantId: 1,
      customerId: "REST001",
      restaurantName: "Test Restaurant",
      imageUrl: "/api/storage/menus/test.jpg",
    });
    expect(res.body).toHaveProperty("updatedAt");
  });

  it("normalises customerId to uppercase", async () => {
    const chain = { where: vi.fn().mockResolvedValue([]) };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

    const res = await request(app).get("/api/display/rest001");
    expect(res.status).toBe(404);
  });
});
