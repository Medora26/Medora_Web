'use client';

import { LOGO } from '@/public/logo/logo';
import { MenuIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggleButton from './ui/theme-toggle-button';
import { useAuth } from "@/context/auth/authContext";
import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/firebase/service/auth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, LayoutDashboard } from "lucide-react";
import { div } from 'three/src/nodes/math/OperatorNode.js';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const { user } = useAuth();
const router = useRouter();

const handleLogout = async () => {
  await signOutUser();
  toast.success("Logged out");
  router.push("/");
};

  const links = [
    { name: "Overview", href: "/" },
    { name: "How it works", href: "/how-it-works" },
    { name: "Features", href: "/features" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact-us", href: "/contact-us" },
    {name: "Testimonials", href: "/testimonials"}
  ];

  /* detect scroll */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* NAVBAR */}

      <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-between  lg:pl-8 lg:pr-12 bg-transparent">
      

      <nav
        className={`sticky top-0 z-50 w-full flex items-center justify-between transition-all duration-300
        ${scrolled
          ? "h-16 backdrop-blur-sm"
          : "h-16 bg-transparent"}
        pl-4 pr-4 lg:pl-8 lg:pr-12`}
      >


        {/* LOGO */}
        <Link href="/">
          <Image
            src={LOGO.MEDORA_LOGO}
            alt="Medora"
            width={90}
            height={10}
            className="w-20 object-contain"
            priority
          />
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden items-center space-x-6 text-[13px] md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className="relative font-semibold transition group"
              >
                <span
                  className={`transition ${
                    isActive
                      ? ""
                      : "text-gray-600 dark:hover:text-white"
                  }`}
                >
                  {link.name}
                </span>

                {/* animated underline */}
                <span
                  className={`absolute left-0 -bottom-1 h-[2px] bg-indigo-600 transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* CTA */}
<div className="flex items-center gap-2">
  <div className='hidden md:block'>
    <ThemeToggleButton variant="circle-blur" /> 
  </div>

  {user ? (
    <div className='hidden md:block'>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 w-9 rounded-full bg-blue-500 text-white font-semibold">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-blue-500 text-white">
              {user?.displayName?.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  ) : (
    <Link
      href="/sign-up"
      className="hidden rounded-md bg-blue-600 text-white px-5 py-2 text-sm font-semibold transition hover:bg-blue-700 md:inline-block"
    >
      Sign Up
    </Link>
  )}
</div>

        {/* MOBILE MENU BUTTON */}
        <button
          onClick={() => setIsOpen(true)}
          className="text-gray-700 transition active:scale-90 md:hidden"
        >
          <MenuIcon className="size-6" />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white text-lg font-medium text-gray-800 transition duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ThemeToggleButton/>
        {links.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`transition ${
              pathname === link.href
                ? "text-indigo-600 font-semibold"
                : "text-gray-700 hover:text-black"
            }`}
            onClick={() => setIsOpen(false)}
          >
            {link.name}
          </Link>
        ))}

{user ? (
  <Link
    href="/dashboard"
    className="rounded-md bg-blue-400 text-white px-8 py-3 font-medium"
    onClick={() => setIsOpen(false)}
  >
    Dashboard
  </Link>
) : (
  <Link
    href="/sign-up"
    className="rounded-md bg-blue-400 text-white px-8 py-3 font-medium"
    onClick={() => setIsOpen(false)}
  >
    Sign Up
  </Link>
)}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 text-gray-700"
        >
          <XIcon />
        </button>
      </div>
      </nav>
    </>
  );
}
