'use client';

import { LOGO } from '@/public/logo/logo';
import { MenuIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggleButton from './ui/theme-toggle-button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

const links = [
  { name: "Overview", href: "#hero" },
  { name: "How it works", href: "#what-we-do" },
  { name: "Features", href: "#creations" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "FAQs", href: "#faq" },
  { name: "Updates", href: "#newsletter" },
];


  return (
    <>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex h-16 w-full items-center justify-between   pl-4 pr-4 lg:pl-8 lg:pr-12 bg-transparent">
      
        {/* LOGO */}
        <Link href="/">
          <Image
            src={LOGO.MEDORA_LOGO}
            alt="Medora"
            width={90}
            height={10}
            className=" w-32 object-contain"
            priority
          />
        </Link>

        {/* DESKTOP LINKS */}
        <div className="hidden items-center space-x-6 text-[13px]   md:flex">
          {links.map((link) => (
            <a key={link.name} href={link.href} className="transition font-semibold dark:text-white/70 dark;:hover:text-white">
              {link.name}
            </a>
          ))}
        </div>
         
        {/* CTA */}
       <div className='flex items-center gap-2'>
        <ThemeToggleButton variant='circle-blur'   />
         <Link
          href="/sign-up"
          className="hidden rounded-md bg-blue-600 dark:text-white text-white px-5 py-2 text-sm font-semibold transition hover:bg-blue-700 md:inline-block"
        >
          Sign Up
        </Link>
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
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white text-lg font-medium text-gray-800 transition duration-300 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className="transition hover:text-black"
            onClick={() => setIsOpen(false)}
          >
            {link.name}
          </a>
        ))}

        <Link
          href="/sign-up"
          className="rounded-md bg-blue-400 text-white px-8 py-3 font-medium transition hover:bg-indigo-700"
          onClick={() => setIsOpen(false)}
        >
          Sign Up
        </Link>

        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 text-gray-700"
        >
          <XIcon />
        </button>
      </div>
    </>
  );
}
