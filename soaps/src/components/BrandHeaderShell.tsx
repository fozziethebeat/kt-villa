'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandHeaderShellProps {
  transparent?: boolean;
  isAdmin: boolean;
  userName?: string | null;
  isSignedIn: boolean;
}

export function BrandHeaderShell({
  transparent = false,
  isAdmin,
  userName,
  isSignedIn,
}: BrandHeaderShellProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showSurface = !transparent || scrolled;
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-40 transition-[background-color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
        showSurface
          ? 'bg-background/95 backdrop-blur-md border-b border-border'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-6 md:px-12">
        <Link
          href="/"
          className="whitespace-nowrap shrink-0 text-[0.9375rem] sm:text-[1.0625rem] md:text-[1.1875rem] font-semibold tracking-[-0.03em] text-foreground hover:opacity-75 transition-opacity duration-150"
        >
          Our Morning Sunset
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-3 sm:gap-6 md:gap-9 text-[0.8125rem] sm:text-[0.9375rem] font-normal text-foreground whitespace-nowrap">
          <Link
            href="/#ready"
            className="hover:text-mineral-moss transition-colors duration-150"
          >
            Rack
          </Link>
          <Link
            href="/recipes"
            className="hover:text-mineral-moss transition-colors duration-150"
          >
            Archive
          </Link>
          <Link
            href="/collection"
            className="hover:text-mineral-moss transition-colors duration-150"
          >
            Collection
          </Link>
          {isAdmin && (
            <Link
              href="/admin/batches"
              className="text-mineral-moss font-medium hover:opacity-75 transition-opacity duration-150"
            >
              Studio
            </Link>
          )}
          {isSignedIn ? (
            <Link
              href="/profile"
              className="hidden sm:inline text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              {firstName || 'Account'}
            </Link>
          ) : (
            <Link
              href="/signin"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
