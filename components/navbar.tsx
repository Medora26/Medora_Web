'use client';

import { LOGO } from '@/public/logo/logo';
import { MenuIcon, XIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggleButton from './ui/theme-toggle-button';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/" },
    { name: "How it works", href: "/how-it-works" },
    { name: "Features", href: "/features" },
    { name: "FAQs", href: "/faqs" },
    { name: "Updates", href: "/updates" },
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
      <nav
        className={`sticky top-0 z-50 w-full flex items-center justify-between transition-all duration-300
        ${scrolled
          ? "h-14 backdrop-blur-md bg-white/70 border-b border-gray-200 shadow-sm"
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
            className="w-32 object-contain"
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
                      ? "text-indigo-600"
                      : "text-gray-600 hover:text-black"
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
        <div className='flex items-center gap-2'>
          <ThemeToggleButton variant='circle-blur' />
          <Link
            href="/sign-up"
            className="hidden rounded-md bg-blue-600 text-white px-5 py-2 text-sm font-semibold transition hover:bg-blue-700 md:inline-block"
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
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white text-lg font-medium text-gray-800 transition duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
