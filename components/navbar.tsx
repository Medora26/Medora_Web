'use client';

import { MenuIcon, XIcon, ChevronDown, FileTextIcon, ImageUpIcon, FileVideo, AudioLines, LightbulbIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { LOGO } from "@/public/logo/logo";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const links = [
    { name: 'Home', href: '/' },
    {
      name: 'Products',
      subLinks: [
        { name: 'Text to Slides', href: '#products/text-to-slides', icon: FileTextIcon, description: 'Convert text to slides' },
        { name: 'Image to Slides', href: '#products/image-to-slides', icon: ImageUpIcon, description: 'Convert images to slides' },
        { name: 'Video to Slides', href: '#products/video-to-slides', icon: FileVideo, description: 'Convert videos to slides' },
        { name: 'Audio to Slides', href: '#products/audio-to-slides', icon: AudioLines, description: 'Convert audio to slides' },
        { name: 'Ideas to Slides', href: '#products/ideas-to-slides', icon: LightbulbIcon, description: 'Generate slides from ideas' },
      ],
    },
    { name: 'Stories', href: '#stories' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Docs', href: '#docs' },
  ];

  return (
    <>
      <nav className='sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-black/80 pl-2 pr-4 backdrop-blur-md md:pl-4 md:pr-12 lg:pl-6 lg:pr-20'>

        {/* LOGO */}
        <a href="/">
         <Image
  src="/logo/dark-new.png"
  alt="Medora"
  width={80}
  height={10}
  className="h-6 w-auto object-contain"
  priority
/>

        </a>

        {/* DESKTOP LINKS */}
        <div className='hidden items-center space-x-7 text-gray-300 md:flex'>
          {links.map((link) => link.subLinks ? (
            <div
              key={link.name}
              className='group relative'
              onMouseEnter={() => setOpenDropdown(link.name)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <div className='flex cursor-pointer items-center gap-1 hover:text-white transition'>
                {link.name}
                <ChevronDown className={`mt-px size-4 transition-transform duration-200 ${openDropdown === link.name ? 'rotate-180' : ''}`} />
              </div>

              {/* DROPDOWN */}
              <div className={`absolute top-6 left-0 z-40 w-lg rounded-xl border border-white/10 bg-[#0f0f0f] p-4 shadow-2xl transition-all duration-200 ease-in-out ${
                openDropdown === link.name ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
              }`}>
                <p className="text-gray-400">Explore our AI tools</p>

                <div className='mt-3 grid grid-cols-2 gap-2'>
                  {link.subLinks.map((sub) => (
                    <Link
                      href={sub.href}
                      key={sub.name}
                      className='group/link flex items-center gap-2 rounded-md p-2 transition hover:bg-white/5'
                    >
                      <div className='w-max gap-1 rounded-md btn p-2'>
                        <sub.icon className='size-4.5 text-white transition duration-300 group-hover/link:scale-110' />
                      </div>

                      <div>
                        <p className='font-medium text-white'>{sub.name}</p>
                        <p className='font-light text-gray-400'>{sub.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Link key={link.name} href={link.href} className='transition hover:text-white'>
              {link.name}
            </Link>
          ))}
        </div>

        {/* SIGNUP BUTTON */}
        <Link
          href='/sign-up'
          className='hidden rounded-full bg-white text-black px-8 py-2.5 font-medium transition hover:bg-gray-200 md:inline-block'
        >
          Sign Up
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button onClick={() => setIsOpen(true)} className='text-white transition active:scale-90 md:hidden'>
          <MenuIcon className='size-6.5' />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/95 text-lg font-medium text-white backdrop-blur-2xl transition duration-300 md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {links.map((link) => (
          <div key={link.name} className='text-center'>
            {link.subLinks ? (
              <>
                <button
                  onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                  className='flex items-center justify-center gap-1 text-gray-200'
                >
                  {link.name}
                  <ChevronDown className={`size-4 transition-transform ${openDropdown === link.name ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === link.name && (
                  <div className='mt-2 flex flex-col gap-2 text-left text-sm'>
                    {link.subLinks.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className='block text-gray-400 transition hover:text-white'
                        onClick={() => setIsOpen(false)}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={link.href}
                className='block text-gray-200 transition hover:text-white'
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            )}
          </div>
        ))}

        <Link
          href='/sign-up'
          className='rounded-full bg-white text-black px-8 py-2.5 font-medium transition hover:bg-gray-200'
          onClick={() => setIsOpen(false)}
        >
          Sign Up
        </Link>

        <button
          onClick={() => setIsOpen(false)}
          className='rounded-md bg-white/10 p-2 text-white active:ring-2'
        >
          <XIcon />
        </button>
      </div>
    </>
  );
}
