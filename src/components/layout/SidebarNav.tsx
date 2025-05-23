"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  ClipboardSignature,
  BarChart3,
  Settings,
  LogOut,
  Briefcase,
  UserCircle,
} from 'lucide-react';
import { useFirebase } from '@/lib/firebase/FirebaseProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/keyword-matcher', label: 'Keyword Matcher', icon: Lightbulb },
  { href: '/cover-letters', label: 'Cover Letters', icon: ClipboardSignature },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  // { href: '/jobs/new', label: 'Add Job', icon: Briefcase }, // Example if adding a dedicated page
];

export function SidebarNav() {
  const pathname = usePathname();
  const { user, userId, auth } = useFirebase();

  const handleSignOut = async () => {
    if (auth) {
      try {
        await auth.signOut();
        // Potentially redirect or let FirebaseProvider handle anonymous sign-in
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    }
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex flex-col items-center group-data-[collapsible=icon]:items-center">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Briefcase className="w-8 h-8 text-primary" />
          <span className="font-semibold text-xl group-data-[collapsible=icon]:hidden">CareerCompass</span>
        </Link>
        <div className="mt-4 w-full group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent">
             <Avatar>
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
              </Avatar>
            <div className="text-xs overflow-hidden">
              <p className="font-medium text-sidebar-accent-foreground truncate">
                {user?.displayName || (user?.isAnonymous ? 'Anonymous User' : 'User')}
              </p>
              <p className="text-muted-foreground truncate" title={userId || "No User ID"}>
                ID: {userId ? `${userId.substring(0,6)}...` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
         <div className="mt-2 w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
           <UserCircle className="h-8 w-8 text-muted-foreground hidden group-data-[collapsible=icon]:block" />
        </div>
      </SidebarHeader>
      <Separator className="group-data-[collapsible=icon]:hidden" />
      <ScrollArea className="flex-grow">
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    variant="default"
                    size="default"
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                    tooltip={{children: item.label}}
                    className="justify-start"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </ScrollArea>
      <Separator className="group-data-[collapsible=icon]:hidden"/>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:py-2">
        {/* <SidebarMenu>
          <SidebarMenuItem>
             <Link href="/settings" passHref legacyBehavior>
                <SidebarMenuButton variant="ghost" className="justify-start" tooltip={{children: "Settings"}}>
                  <Settings className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu> */}
        {/* If sign out is needed for non-anonymous users */}
        {auth && user && !user.isAnonymous && (
           <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:p-0" onClick={handleSignOut}>
            <LogOut className="h-5 w-5 mr-2 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        )}
      </SidebarFooter>
      <div className="absolute top-4 right-0 md:hidden">
         <SidebarTrigger />
      </div>
    </Sidebar>
  );
}
