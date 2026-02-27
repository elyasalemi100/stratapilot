import Link from "next/link";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center border-b px-6">
        <Link href="/" className="font-semibold text-primary">
          StrataPilot
        </Link>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
