"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Bell,
  Search,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signOutUser } from "@/lib/firebase/service/auth";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth/authContext";
import { useTheme } from "next-themes";
import { StorageService } from "@/lib/firebase/service/storage-tracking/service";

const TopNavbar = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const {user} = useAuth()



useEffect(() => {
  setMounted(true);
}, []);

const toggleTheme = () => {
  setTheme(theme === 'dark' ? 'light' : 'dark');
};
  const handleLogout = async () => {
    try {
      await signOutUser();
      window.location.href = '/sign-in';
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(`Logout Failed: ${error}`);
      console.error(`Logout Failed: ${error}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

 

  return (
    <header className="sticky top-0 z-30 flex h-18 justify-between items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* <SidebarTrigger /> */}
      
      {/* Search Bar - Clean and minimal */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </form>
      </div>

      {/* Right Side - Minimal */}
      <div className="flex items-center gap-1">
        {/* Notifications - Just an icon with badge */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
          >
            3
          </Badge>
        </Button>

        {/* User Dropdown - Just avatar */}
      <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="default" className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-700 p-0">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-blue-500 font-semibold text-white text-md">
          {user?.displayName?.slice(0,1)}
        </AvatarFallback>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" align="end">
    <DropdownMenuLabel className="font-normal">
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium">{user?.displayName}</p>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    {/* Theme Submenu */}
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="cursor-pointer">
        {mounted && theme === 'dark' ? (
          <Moon className="mr-2 h-4 w-4" />
        ) : mounted && theme === 'light' ? (
          <Sun className="mr-2 h-4 w-4" />
        ) : (
          <Sun className="mr-2 h-4 w-4" />
        )}
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="mr-2">
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light" className="cursor-pointer">
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="cursor-pointer">
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="cursor-pointer">
              <Sun className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
    
    <DropdownMenuSeparator />
    
    {/* Logout */}
    <DropdownMenuItem
      onClick={handleLogout}
      className="text-destructive focus:text-destructive cursor-pointer"
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Log out</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
      </div>
    </header>
  );
};

export default TopNavbar;