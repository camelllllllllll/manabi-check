"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/parent/login";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-12">
          <Link href="/parent/tests" className="font-bold">
            まなびチェック
          </Link>
          {!isLoginPage && (
            <Link
              href="/parent/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ログアウト
            </Link>
          )}
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4">{children}</main>
    </div>
  );
}
