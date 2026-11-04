import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

export function Callout({
  type = "warning",
  title,
  children,
}: {
  type?: "danger" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
}) {
  const styles =
    type === "danger"
      ? "border-red-500/35 bg-red-500/10 text-red-950"
      : type === "warning"
      ? "border-amber-500/35 bg-amber-500/10 text-amber-950"
      : "border-primary/30 bg-primary/10 text-foreground";

  const Icon =
    type === "danger"
      ? ShieldAlert
      : type === "warning"
      ? AlertTriangle
      : Info;

  return (
    <div
      className={`my-6 rounded-2xl border p-4 shadow-sm not-prose ${styles}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-1.5 text-sm leading-relaxed">
          {title && <p className="font-bold tracking-tight">{title}</p>}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-10 border-b border-border pb-2 text-2xl font-bold tracking-tight text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 text-lg font-bold tracking-tight text-foreground">
        {children}
      </h3>
    ),
    a: ({ href = "", children, ...props }) => {
      if (href.startsWith("/")) {
        return (
          <Link
            href={href}
            className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
          >
            {children}
          </Link>
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
          {...props}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt }) => (
      <figure className="my-5 overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-sm">
        <img
          src={src}
          alt={alt || "KT Villa Guide Image"}
          loading="lazy"
          className="max-h-[460px] w-full object-contain bg-stone-950/5"
        />
        {alt && (
          <figcaption className="border-t border-border/60 bg-card px-4 py-2 text-center text-xs font-medium text-muted-foreground">
            {alt}
          </figcaption>
        )}
      </figure>
    ),
    iframe: (props) => (
      <div className="my-6 overflow-hidden rounded-2xl border border-border shadow-sm">
        <iframe {...props} className="aspect-video w-full border-0" />
      </div>
    ),
    Callout,
    ...components,
  };
}
