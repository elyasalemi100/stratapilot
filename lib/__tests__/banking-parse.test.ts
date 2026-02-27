import { parseAmount, parseDate } from "@/lib/banking/parse-csv";

describe("parseAmount", () => {
  it("parses amount column when provided", () => {
    const mapping = { date: "", description: "", amount: "amt" };
    expect(parseAmount({ amt: "123.45" }, mapping)).toEqual({
      amount: 123.45,
      type: "credit",
    });
    expect(parseAmount({ amt: "-50.00" }, mapping)).toEqual({
      amount: 50,
      type: "debit",
    });
  });

  it("falls back to debit/credit when amount is empty", () => {
    const mapping = {
      date: "",
      description: "",
      amount: "",
      debit: "dr",
      credit: "cr",
    };
    expect(parseAmount({ dr: "100", cr: "" }, mapping)).toEqual({
      amount: 100,
      type: "debit",
    });
    expect(parseAmount({ dr: "", cr: "200" }, mapping)).toEqual({
      amount: 200,
      type: "credit",
    });
  });

  it("strips non-numeric chars from amount", () => {
    const mapping = { date: "", description: "", amount: "amt" };
    expect(parseAmount({ amt: "$1,234.56" }, mapping)).toEqual({
      amount: 1234.56,
      type: "credit",
    });
  });

  it("handles empty amount mapping with whitespace", () => {
    const mapping = {
      date: "",
      description: "",
      amount: " ",
      debit: "dr",
      credit: "cr",
    };
    expect(parseAmount({ dr: "50", cr: "" }, mapping)).toEqual({
      amount: 50,
      type: "debit",
    });
  });
});

describe("parseDate", () => {
  it("parses valid date string", () => {
    expect(parseDate("2024-03-15")).toBe("2024-03-15");
    expect(parseDate("2024-12-25T00:00:00Z")).toBe("2024-12-25");
  });

  it("returns empty string for invalid date", () => {
    expect(parseDate("invalid")).toBe("");
    expect(parseDate("")).toBe("");
  });
});
