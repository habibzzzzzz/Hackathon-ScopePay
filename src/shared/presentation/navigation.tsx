"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  ["/app/dashboard", "Overview"],
  ["/app/projects", "Projects"],
  ["/app/clients", "Clients"],
  ["/app/change-orders", "Change orders"],
  ["/app/payments", "Payments"],
  ["/app/settings", "Settings"],
];
export function Navigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Workspace">
      {items.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname.startsWith(href) ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
