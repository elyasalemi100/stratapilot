import { navGroups } from "@/lib/nav-config";

describe("navGroups", () => {
  it("has expected top-level groups", () => {
    const titles = navGroups.map((g) => g.title);
    expect(titles).toContain("Overview");
    expect(titles).toContain("Levies");
    expect(titles).toContain("Banking & Reconciliation");
    expect(titles).toContain("Meetings");
    expect(titles).toContain("Settings");
  });

  it("each group has items with required fields", () => {
    for (const group of navGroups) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.title).toBeDefined();
        expect(item.href).toBeDefined();
        expect(item.icon).toBeDefined();
      }
    }
  });

  it("Arrears has count badge", () => {
    const levies = navGroups.find((g) => g.title === "Levies");
    const arrears = levies?.items.find((i) => i.title === "Arrears");
    expect(arrears?.badge).toBe("count");
  });

  it("Reconciliation has unreconciled badge", () => {
    const banking = navGroups.find((g) => g.title === "Banking & Reconciliation");
    const recon = banking?.items.find((i) => i.title === "Reconciliation");
    expect(recon?.badge).toBe("unreconciled");
  });
});
