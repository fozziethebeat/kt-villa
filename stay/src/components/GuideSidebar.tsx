"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  BookOpen,
  Building2,
  Car,
  CheckSquare,
  Compass,
  CreditCard,
  KeyRound,
  MapPin,
  Sparkles,
  Train,
  Utensils,
} from "lucide-react";

const GUIDE_SECTIONS = [
  {
    title: "Overview",
    items: [
      {
        label: "Guide Home",
        href: "/guide",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "The Stay (House Manual)",
    items: [
      {
        label: "The Stay Overview",
        href: "/guide/the-stay",
        icon: Sparkles,
      },
      {
        label: "1. Finding the House",
        href: "/guide/the-stay/finding-the-house",
        icon: MapPin,
      },
      {
        label: "2. Arriving & Warming Up",
        href: "/guide/the-stay/arriving",
        icon: KeyRound,
      },
      {
        label: "3. Rooms & Amenities",
        href: "/guide/the-stay/rooms",
        icon: BedDouble,
      },
      {
        label: "4. Using the House Car",
        href: "/guide/the-stay/the-car",
        icon: Car,
      },
      {
        label: "5. Departing & Checkout",
        href: "/guide/the-stay/departing",
        icon: CheckSquare,
      },
      {
        label: "6. Payment & Settling Up",
        href: "/guide/the-stay/payment",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "The Village (Hakuba)",
    items: [
      {
        label: "Village Overview",
        href: "/guide/the-village",
        icon: Compass,
      },
      {
        label: "Directions to Hakuba",
        href: "/guide/the-village/directions",
        icon: Train,
      },
      {
        label: "Food, Coffee & Services",
        href: "/guide/the-village/important-services",
        icon: Utensils,
      },
      {
        label: "Hotels & Places to Stay",
        href: "/guide/the-village/places-to-stay",
        icon: Building2,
      },
    ],
  },
];

export function GuideSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 lg:w-64">
      {/* Mobile collapsible navigation */}
      <details className="group mb-6 rounded-xl border border-border bg-card p-3 shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-foreground">
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Browse House &amp; Village Guides
          </span>
          <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
            ▼
          </span>
        </summary>
        <nav
          aria-label="Mobile guide navigation"
          className="mt-3 space-y-4 border-t border-border pt-3"
        >
          {GUIDE_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <ul className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition ${
                          isActive
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </details>

      {/* Desktop sticky sidebar */}
      <nav
        aria-label="Guide sidebar navigation"
        className="sticky top-24 hidden space-y-6 rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm lg:block"
      >
        {GUIDE_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="mt-1.5 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                        isActive
                          ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? "text-primary-foreground"
                            : "text-primary/80"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
