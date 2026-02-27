import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("formatCurrency", () => {
  it("formats AUD currency", () => {
    expect(formatCurrency(1234.56)).toMatch(/\$1[,.]?234[,.]?56/);
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toMatch(/\$0/);
  });

  it("formats negative amounts", () => {
    const result = formatCurrency(-100);
    expect(result).toMatch(/100/);
  });
});

describe("formatDate", () => {
  it("formats Date object", () => {
    const d = new Date("2024-03-15");
    expect(formatDate(d)).toMatch(/15/);
    expect(formatDate(d)).toMatch(/03/);
    expect(formatDate(d)).toMatch(/2024/);
  });

  it("formats ISO string", () => {
    expect(formatDate("2024-12-25")).toMatch(/25/);
    expect(formatDate("2024-12-25")).toMatch(/12/);
  });
});

describe("formatDateTime", () => {
  it("formats date and time", () => {
    const d = new Date("2024-03-15T14:30:00");
    const result = formatDateTime(d);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/\d{1,2}/); // hour
    expect(result).toMatch(/\d{2}/); // minute
  });
});
