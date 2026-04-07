import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers before importing actions
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@rainmachine/db", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  })),
}));

describe("loginAction — input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error on invalid email format", async () => {
    const { loginAction } = await import("../actions");
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "password123");
    const result = await loginAction(null, formData);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Invalid email");
  });

  it("returns error when password too short", async () => {
    const { loginAction } = await import("../actions");
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "short");
    const result = await loginAction(null, formData);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("8 characters");
  });

  it("redirects on valid credentials (mock returns no error)", async () => {
    const { loginAction } = await import("../actions");
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "validpassword123");
    await expect(loginAction(null, formData)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard",
    );
  });

  it("returns error when supabase returns auth error", async () => {
    const { createServerClient } = await import("@rainmachine/db");
    vi.mocked(createServerClient).mockReturnValueOnce(
      // Type assertion through unknown is safe in test context — mock doesn't need full interface
      {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Invalid login credentials" },
          }),
          signOut: vi.fn(),
        },
      } as unknown as ReturnType<typeof createServerClient>,
    );

    const { loginAction } = await import("../actions");
    const formData = new FormData();
    formData.set("email", "test@example.com");
    formData.set("password", "validpassword123");
    const result = await loginAction(null, formData);
    expect(result.error).toContain("Invalid email or password");
  });
});
