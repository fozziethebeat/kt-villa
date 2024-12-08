import * as React from 'react';
import Link from 'next/link';

import {auth} from '@/lib/auth';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const session = await auth();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src="/favicons/gemini_1/yumegai-favicon-1.png"
                      alt="yumegai"
                    />
                    <AvatarFallback className="rounded-lg">YG</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Yumegai</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div> stuff</div>
      </SidebarContent>
      <SidebarFooter>
        {session?.user ? (
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={session.user.profileImage}
                alt={session.user.name}
              />
              <AvatarFallback className="rounded-lg">
                {session.user.name}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {session.user.name}
              </span>
              <span className="truncate text-xs">{session.user.email}</span>
            </div>
          </div>
        ) : (
          <Button asChild>
            <Link href="/signin">Signin</Link>
          </Button>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
