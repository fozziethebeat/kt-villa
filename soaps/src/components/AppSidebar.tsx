import { Calendar, Home, Inbox, Image } from 'lucide-react';
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
    title: 'Other',
    url: '/other-page',
    icon: Inbox,
  },
];

const ADMIN_ITEMS = [
  {
    title: 'Admin',
    url: '/admin',
    icon: Calendar,
  },
  {
    title: 'Image Gen',
    url: '/admin/image-gen',
    icon: Image,
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/favicon.png" alt="KT Soaps" />
                    <AvatarFallback className="rounded-lg">YG</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">KT Soaps</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Thangs</SidebarGroupLabel>
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
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={(session.user as any).profileImageUrl || undefined}
                      alt={session.user.name || ''}
                    />
                    <AvatarFallback className="rounded-lg">
                      {session.user.name || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session.user.name || 'User'}
                    </span>
                    <span className="truncate text-xs">{session.user.email}</span>
                  </div>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SignOutButton />
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/signin">Signin</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
