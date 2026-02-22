import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface HeaderProps {
  links?: { label: string; url: string }[];
  target?: string;
}

export function Header({ links, target }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 bg-card/50 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1 text-brand-stone hover:text-brand-warm-brown" />
      <Breadcrumb>
        <BreadcrumbList>
          {links?.map(l => (
            <div
              key={l.label}
              className="flex flex-wrap items-center gap-1.5 break-words text-sm text-brand-stone sm:gap-2.5">
              <BreadcrumbItem>
                <BreadcrumbLink href={l.url}>{l.label}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </div>
          ))}
          <BreadcrumbItem>
            <BreadcrumbPage className="text-brand-warm-brown font-medium">{target}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
