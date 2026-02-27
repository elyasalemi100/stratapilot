import { render, screen } from "@testing-library/react";
import { Sidebar } from "../sidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/demo-oc/dashboard",
}));

describe("Sidebar", () => {
  it("renders StrataPilot logo", () => {
    render(<Sidebar ocSlug="demo" ocName="Demo OC" />);
    expect(screen.getByText("StrataPilot")).toBeInTheDocument();
  });

  it("renders nav groups", () => {
    render(<Sidebar ocSlug="demo" ocName="Demo OC" />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Levies")).toBeInTheDocument();
  });

  it("renders Dashboard link with correct href", () => {
    render(<Sidebar ocSlug="demo" ocName="Demo OC" />);
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toHaveAttribute("href", "/demo/dashboard");
  });

  it("shows Platform Admin link when isSuperAdmin", () => {
    render(<Sidebar ocSlug="demo" ocName="Demo OC" isSuperAdmin />);
    expect(screen.getByRole("link", { name: /platform admin/i })).toBeInTheDocument();
  });

  it("hides Platform Admin when not super admin", () => {
    render(<Sidebar ocSlug="demo" ocName="Demo OC" isSuperAdmin={false} />);
    expect(screen.queryByRole("link", { name: /platform admin/i })).not.toBeInTheDocument();
  });
});
