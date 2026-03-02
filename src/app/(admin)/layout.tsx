"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/units", label: "単元管理" },
  { href: "/admin/questions", label: "問題管理" },
  { href: "/admin/tests", label: "テスト管理" },
  { href: "/admin/students", label: "生徒管理" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/admin/units" className="font-bold text-lg">
              まなびチェック <span className="text-sm font-normal text-muted-foreground">管理</span>
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              トップへ
            </Link>
          </div>
          <nav className="flex gap-1 -mb-px">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 text-sm border-b-2 transition-colors",
                  pathname.startsWith(item.href)
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
