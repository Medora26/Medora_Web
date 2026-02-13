"use client";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { 
  Home, 
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Users,
  Share2,
  Clock,
  Star,
  Trash2,
  Settings,
  LogOut,
  Plus,
  Search,
  Tag,
  ChevronRight,
  HardDrive,
  Shield,
  Activity,
  User
} from 'lucide-react';
import Link from 'next/link';
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { LOGO } from '@/public/logo/logo';
import { useAuth } from '@/context/auth/authContext';
import { signOutUser } from '@/lib/firebase/service/auth';

const AppSidebar = () => {
  const router = useRouter();
  const [isStudiesOpen, setIsStudiesOpen] = useState(true);
  const [isSharedOpen, setIsSharedOpen] = useState(false);
 const {user:currentUserData} = useAuth()
  // Main navigation items
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Upload className="h-5 w-5" />, label: 'Upload Images', href: '/upload' },
    { icon: <HardDrive className="h-5 w-5" />, label: 'My Drive', href: '/drive' },
    { icon: <Clock className="h-5 w-5" />, label: 'Recent', href: '/recent' },
    { icon: <Star className="h-5 w-5" />, label: 'Starred', href: '/starred' },
  ];

  const handleSignOut = async () => {
      try {
        await signOutUser()
        window.location.href = "/sign-in"
        toast.success(`${currentUserData?.displayName} logout successfully`)
      } catch (error) {
        toast.error(`Logout failed ${error}`)
        console.log("Logout failed",error)
      }
  }

  // Study types/categories
  const category = [
    { icon: <ImageIcon className="h-4 w-4" />, label: 'X-Rays', href: '/studies/xrays' },
    { icon: <ImageIcon className="h-4 w-4" />, label: 'MRI Scans', href: '/studies/mri' },
    { icon: <ImageIcon className="h-4 w-4" />, label: 'CT Scans', href: '/studies/ct' },
    { icon: <ImageIcon className="h-4 w-4" />, label: 'Ultrasounds', href: '/studies/ultrasound' },
    { icon: <ImageIcon className="h-4 w-4" />, label: 'Mammograms', href: '/studies/mammogram' },
  ];

  // Recent patients (dynamic data would go here)
 

  return (
  <Sidebar collapsible="icon" className="border-r overflow-hidden">
  <SidebarHeader className="border-b p-4">
    <div className='flex items-center gap-2'>
      <div className="aspect-square w-10 h-10 flex items-center justify-center overflow-hidden">
        <Image
          alt="Medora logo"
          src={LOGO.MEDORA_LOGO}
          className="object-contain"
        />
      </div>
      <span className='text-xl font-bold whitespace-nowrap'>Medora</span>
    </div>
  </SidebarHeader>

  <SidebarContent className="overflow-x-hidden">
    {/* Quick Actions */}
  
    {/* Main Navigation */}
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild>
                <Link href={item.href} className="flex items-center gap-2">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>

    {/* Studies by Type */}
    <SidebarGroup>
      <Collapsible open={isStudiesOpen} onOpenChange={setIsStudiesOpen}>
        <SidebarGroupLabel>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Study Types</span>
              </div>
              <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${isStudiesOpen ? 'rotate-90' : ''}`} />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        
        <CollapsibleContent>
          <SidebarGroupContent className="ml-4 pl-2 border-l">
            <SidebarMenu>
              {category.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="h-8">
                    <Link href={item.href} className="flex items-center gap-2">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>

    {/* Recent Patients */}
  

    {/* Admin Section (only visible to admins) */}
    <SidebarGroup>
      <SidebarGroupLabel>Administration</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/compliance" className="flex items-center gap-2">
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Compliance</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>

  {/* Storage Info */}
  <SidebarGroup>
    <SidebarGroupContent>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Storage</span>
          <span className="font-medium whitespace-nowrap">45.2 GB / 100 GB</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full w-[45%] bg-blue-500 rounded-full" />
        </div>
      </div>
    </SidebarGroupContent>
  </SidebarGroup>

  <SidebarFooter className='border-t'>
    <SidebarMenu>
      <SidebarMenuItem className='flex items-center justify-between py-2 px-2'>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
           {
             currentUserData?.photoURL ? (
                 <Image
                 
                  width={100}
                  height={100}
                  alt=''
                  src={currentUserData.photoURL}
                  className='rounded-full object-contain'
                 />
             ) : (
                <User className='w-4 h-4'  />
             )
           }
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{currentUserData?.displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUserData?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          title="Logout"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarFooter>
</Sidebar>
  );
};

export default AppSidebar;