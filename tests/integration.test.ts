import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClientCount = vi.fn();

const mockPrisma = {
  user: { findUnique: vi.fn() },
  client: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), count: mockClientCount },
  task: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  application: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  applicationStageHistory: { create: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

let mockCookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (key: string) => (key === "mock-auth-user" ? { value: mockCookieValue } : undefined),
    })
  ),
}));

vi.mock("@/lib/activityLog", () => ({ logActivity: vi.fn(() => Promise.resolve()) }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn(() => Promise.resolve()) }));

const adminUser = { id: 1, name: "Admin", email: "admin@test.com", role: "ADMIN", passwordHash: "", createdAt: new Date(), updatedAt: new Date(), phone: null, status: "active" };
const staffUser = { id: 2, name: "Staff", email: "staff@test.com", role: "STAFF", passwordHash: "", createdAt: new Date(), updatedAt: new Date(), phone: null, status: "active" };

function loginAs(user: typeof adminUser | null) {
  mockCookieValue = user?.email ?? undefined;
  mockPrisma.user.findUnique.mockResolvedValue(user);
}

const clientFixture = {
  id: 1,
  firstName: "John",
  lastName: "Doe",
  email: "john@test.com",
  phone: "123456789",
  fileNumber: "WP-2025-0001",
  source: "walk-in",
  createdById: 1,
  assignedStaffId: 2,
  address: null,
  passportNumber: null,
  dateOfBirth: null,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: adminUser,
  assignedStaff: staffUser,
};

const taskFixture = {
  id: 10,
  title: "Review documents",
  description: null,
  clientId: 1,
  applicationId: null,
  stage: null,
  assigneeId: 2,
  assignedById: 1,
  priority: "MEDIUM",
  status: "TODO",
  dueDate: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { id: 1, fileNumber: "WP-2025-0001", firstName: "John", lastName: "Doe" },
  application: null,
  assignee: staffUser,
  assignedBy: adminUser,
};

const applicationFixture = {
  id: 100,
  clientId: 1,
  serviceType: "TOURIST_VISA",
  destinationCountry: "France",
  travelPurpose: "Tourism",
  expectedTravelDate: new Date("2026-01-15"),
  currentStage: "CLIENT_INQUIRY",
  status: "NOT_STARTED",
  decisionStatus: null,
  assignedStaffId: 2,
  planType: "STANDARD",
  createdAt: new Date(),
  updatedAt: new Date(),
  client: { id: 1, fileNumber: "WP-2025-0001", firstName: "John", lastName: "Doe", assignedStaffId: 2 },
  assignedStaff: staffUser,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCookieValue = undefined;
  mockClientCount.mockResolvedValue(0);
});

// ─── CLIENT FLOW ────────────────────────────────────────────────────────

describe("Client integration flow", () => {
  it("CREATE: admin creates a client, returns 201 with fileNumber", async () => {
    loginAs(adminUser);
    mockPrisma.client.create.mockResolvedValue(clientFixture);

    const { POST } = await import("@/app/api/clients/route");

    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        phone: "123456789",
        source: "walk-in",
        createdById: 1,
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.client).toBeDefined();
    expect(body.client.fileNumber).toBe("WP-2025-0001");
  });

  it("CREATE: staff cannot create a client", async () => {
    loginAs(staffUser);

    const { POST } = await import("@/app/api/clients/route");

    const req = new Request("http://localhost/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        phone: "123456789",
        source: "walk-in",
        createdById: 2,
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("LIST: admin sees all clients", async () => {
    loginAs(adminUser);
    mockPrisma.client.findMany.mockResolvedValue([clientFixture]);

    const { GET } = await import("@/app/api/clients/route");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.clients).toHaveLength(1);
  });

  it("LIST: staff sees only assigned clients", async () => {
    loginAs(staffUser);
    mockPrisma.client.findMany.mockResolvedValue([clientFixture]);

    const { GET } = await import("@/app/api/clients/route");

    const res = await GET();
    const body = await res.json();

    expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { assignedStaffId: 2 } })
    );
    expect(body.clients).toHaveLength(1);
  });

  it("UPDATE: admin reassigns a client to a different staff", async () => {
    loginAs(adminUser);
    mockPrisma.client.findUnique.mockResolvedValue(clientFixture);
    mockPrisma.application.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.client.update.mockResolvedValue({
      ...clientFixture,
      assignedStaffId: 3,
    });

    const { PATCH } = await import("@/app/api/clients/route");

    const req = new Request("http://localhost/api/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, assignedStaffId: 3 }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.client.assignedStaffId).toBe(3);
  });
});

// ─── APPLICATION FLOW ───────────────────────────────────────────────────

describe("Application integration flow", () => {
  it("CREATE: admin creates an application linked to a client", async () => {
    loginAs(adminUser);
    mockPrisma.client.findUnique.mockResolvedValue(clientFixture);
    mockPrisma.application.create.mockResolvedValue(applicationFixture);

    const { POST } = await import("@/app/api/applications/route");

    const req = new Request("http://localhost/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: 1,
        serviceType: "TOURIST_VISA",
        destinationCountry: "France",
        travelPurpose: "Tourism",
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.application.clientId).toBe(1);
    expect(body.application.currentStage).toBe("CLIENT_INQUIRY");
  });

  it("LIST: admin sees all applications", async () => {
    loginAs(adminUser);
    mockPrisma.application.findMany.mockResolvedValue([applicationFixture]);

    const { GET } = await import("@/app/api/applications/route");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.applications).toHaveLength(1);
  });

  it("LIST: staff sees only applications for their assigned clients", async () => {
    loginAs(staffUser);
    mockPrisma.application.findMany.mockResolvedValue([applicationFixture]);

    const { GET } = await import("@/app/api/applications/route");

    const res = await GET();
    const body = await res.json();

    expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ client: { assignedStaffId: 2 } }),
      })
    );
    expect(body.applications).toHaveLength(1);
  });

  it("UPDATE: admin changes application stage", async () => {
    loginAs(adminUser);
    mockPrisma.application.findUnique.mockResolvedValue(applicationFixture);
    mockPrisma.application.update.mockResolvedValue({
      ...applicationFixture,
      currentStage: "INITIAL_CONSULTATION",
    });

    const { PATCH } = await import("@/app/api/applications/route");

    const req = new Request("http://localhost/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 100, currentStage: "INITIAL_CONSULTATION" }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.application.currentStage).toBe("INITIAL_CONSULTATION");
  });

  it("STAGE MOVE: POST /api/applications/[id]/stage transitions the stage", async () => {
    loginAs(adminUser);
    mockPrisma.application.findUnique.mockResolvedValue({
      ...applicationFixture,
      client: { assignedStaffId: 2 },
    });
    mockPrisma.application.update.mockResolvedValue({
      ...applicationFixture,
      currentStage: "CUSTOMER_SERVICE_REGISTRATION",
      status: "IN_PROGRESS",
    });
    mockPrisma.applicationStageHistory.create.mockResolvedValue({
      id: 1,
      applicationId: 100,
      fromStage: "CLIENT_INQUIRY",
      toStage: "CUSTOMER_SERVICE_REGISTRATION",
      changedById: 1,
      note: null,
      createdAt: new Date(),
    });
    mockPrisma.$transaction.mockResolvedValue([
      {
        ...applicationFixture,
        currentStage: "CUSTOMER_SERVICE_REGISTRATION",
        status: "IN_PROGRESS",
        client: { id: 1, fileNumber: "WP-2025-0001", firstName: "John", lastName: "Doe" },
        assignedStaff: { id: 2, name: "Staff", email: "staff@test.com" },
      },
      {
        id: 1,
        applicationId: 100,
        fromStage: "CLIENT_INQUIRY",
        toStage: "CUSTOMER_SERVICE_REGISTRATION",
        changedById: 1,
        note: null,
        changedBy: { id: 1, name: "Admin" },
      },
    ]);

    const { POST: postStage } = await import("@/app/api/applications/[id]/stage/route");

    const req = new Request(
      "http://localhost/api/applications/100/stage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage: "CUSTOMER_SERVICE_REGISTRATION" }),
      }
    );
    const res = await postStage(req, { params: Promise.resolve({ id: "100" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.application.currentStage).toBe("CUSTOMER_SERVICE_REGISTRATION");
  });
});

// ─── TASK FLOW ──────────────────────────────────────────────────────────

describe("Task integration flow", () => {
  it("CREATE: admin creates a task and assigns it to a staff member", async () => {
    loginAs(adminUser);
    mockPrisma.task.create.mockResolvedValue({
      ...taskFixture,
      priority: "HIGH",
      assigneeId: 2,
    });

    const { POST } = await import("@/app/api/tasks/route");

    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Review documents",
        clientId: 1,
        assigneeId: 2,
        priority: "HIGH",
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.task.title).toBe("Review documents");
    expect(body.task.priority).toBe("HIGH");
    expect(body.task.assigneeId).toBe(2);
  });

  it("LIST: staff sees only their own tasks", async () => {
    loginAs(staffUser);
    mockPrisma.task.findMany.mockResolvedValue([taskFixture]);

    const { GET } = await import("@/app/api/tasks/route");

    const res = await GET();
    const body = await res.json();

    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { assigneeId: 2 } })
    );
    expect(body.tasks).toHaveLength(1);
  });

  it("LIST: admin sees all tasks", async () => {
    loginAs(adminUser);
    mockPrisma.task.findMany.mockResolvedValue([taskFixture]);

    const { GET } = await import("@/app/api/tasks/route");

    const res = await GET();
    const body = await res.json();

    expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
    expect(body.tasks).toHaveLength(1);
  });

  it("UPDATE: assignee marks their own task as done", async () => {
    loginAs(staffUser);
    mockPrisma.task.findUnique.mockResolvedValue(taskFixture);
    mockPrisma.task.update.mockResolvedValue({
      ...taskFixture,
      status: "DONE",
      completedAt: new Date(),
    });

    const { PATCH } = await import("@/app/api/tasks/route");

    const req = new Request("http://localhost/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 10, status: "DONE" }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.task.status).toBe("DONE");
  });

  it("UPDATE: non-assignee staff cannot update someone else's task", async () => {
    loginAs(staffUser);
    mockPrisma.user.findUnique.mockResolvedValue(staffUser);
    mockPrisma.task.findUnique.mockResolvedValue({ ...taskFixture, assigneeId: 3 });

    const { PATCH } = await import("@/app/api/tasks/route");

    const req = new Request("http://localhost/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 10, status: "DONE" }),
    });
    const res = await PATCH(req);

    expect(res.status).toBe(403);
  });

  it("UPDATE: admin can reassign a task to a different staff", async () => {
    loginAs(adminUser);
    mockPrisma.task.findUnique.mockResolvedValue(taskFixture);
    mockPrisma.task.update.mockResolvedValue({
      ...taskFixture,
      assigneeId: 3,
      assignee: { id: 3, name: "New Staff", email: "new@test.com" },
    });

    const { PATCH } = await import("@/app/api/tasks/route");

    const req = new Request("http://localhost/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 10, assigneeId: 3 }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.task.assigneeId).toBe(3);
  });

  it("GET: unauthenticated returns empty list", async () => {
    loginAs(null);

    const { GET } = await import("@/app/api/tasks/route");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tasks).toEqual([]);
  });
});
