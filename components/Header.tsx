"use client";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-[#0b0f17cc]">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            <span className="inline-block rounded bg-blue-600/10 px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">GF</span>
            <span className="hidden sm:inline">Gestion Finances</span>
          </Link>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
