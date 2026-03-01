import { Home, Book, Package, Layers, Droplets, Users, Link2 } from 'lucide-react';
import Link from 'next/link';

import { headers } from 'next/headers';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';
import { hasRoleInSession } from '@/lib/auth-check';
import { SignOutButton } from '@/components/SignOutButton';

const BASIC_ITEMS = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'My Collection',
    url: '/collection',
    icon: Droplets,
  },
  {
    title: 'Recipes',
    url: '/recipes',
    icon: Book,
  },
];

const ADMIN_ITEMS = [
  {
    title: 'Manage Recipes',
    url: '/admin/recipes',
    icon: Book,
  },
  {
    title: 'Inventory',
    url: '/admin/ingredients',
    icon: Package,
  },
  {
    title: 'Batches',
    url: '/admin/batches',
    icon: Layers,
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Join Codes',
    url: '/admin/join-codes',
    icon: Link2,
  },
];

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const isAdmin = hasRoleInSession(session, ['admin']);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand-terracotta text-brand-cream">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/favicon.png" alt="KT Soaps" />
                    <AvatarFallback className="rounded-lg bg-brand-terracotta text-brand-cream text-xs">KT</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold font-serif text-brand-warm-brown">KT Soaps</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-brand-stone/70 uppercase tracking-wider text-xs">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {BASIC_ITEMS.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin &&
                ADMIN_ITEMS.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {session?.user ? (
            <>
              <SidebarMenuItem>
                <Link href="/profile" className="flex items-center gap-2 px-1 py-1.5 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session.user.image || (session.user as any).profileImageUrl || undefined}
                      alt={session.user.name || ''}
                    />
                    <AvatarFallback className="rounded-lg bg-brand-rose-light text-brand-warm-brown">
                      {session.user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session.user.name || 'User'}
                    </span>
                    <span className="truncate text-xs text-brand-stone">{session.user.email}</span>
                  </div>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SignOutButton />
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/signin">Sign In</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
