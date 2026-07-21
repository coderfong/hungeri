import { describe, expect, it } from "vitest";
import { normalizePhone, safeInternalRedirect } from "@/lib/phone-auth";

describe("phone authentication helpers", () => {
  it("normalizes common phone formatting while rejecting implausible numbers", () => {
    expect(normalizePhone("+65 9123-4567")).toBe("6591234567");
    expect(normalizePhone("123")).toBeNull();
  });

  it("allows same-site paths and rejects external redirect forms", () => {
    expect(safeInternalRedirect(" /dashboard/deals ", "/")).toBe("/dashboard/deals");
    expect(safeInternalRedirect("https://example.com", "/dashboard")).toBe("/dashboard");
    expect(safeInternalRedirect("//example.com", "/dashboard")).toBe("/dashboard");
    expect(safeInternalRedirect("/\\example.com", "/dashboard")).toBe("/dashboard");
  });
});
