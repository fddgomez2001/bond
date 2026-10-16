"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type MarketNavItem = { label: string; href: string; exact?: boolean };

/** Header links with an animated underline for the section you're in. */
export function MarketNav({ items }: { items: MarketNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="mr-auto ml-6 hidden md:block lg:ml-10">
      <ul className="flex items-center gap-6 lg:gap-8">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                transitionTypes={item.href === "/" ? ["nav-back"] : undefined}
                className={cn(
                  "relative py-1 text-[0.95rem] font-medium transition-colors duration-300 hover:text-[#141414]",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-bond-slate after:transition-transform after:duration-500 after:ease-smooth",
                  active ? "text-[#141414] after:scale-x-100" : "text-[#141414]/70 after:scale-x-0 hover:after:scale-x-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
