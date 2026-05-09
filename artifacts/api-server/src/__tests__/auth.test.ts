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

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when username is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "secret" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/required/i);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "admin" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/required/i);
  });

  it("returns 400 when both credentials are missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 401 when user does not exist", async () => {
    const chain = { where: vi.fn().mockResolvedValue([]) };
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "nonexistent", password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/invalid credentials/i);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when no session is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /api/auth/logout", () => {
  it("returns 401 when no session is provided", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});
