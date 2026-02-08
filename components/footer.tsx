import { DribbbleIcon, LinkedinIcon, TwitterIcon, YoutubeIcon } from "lucide-react";

export default function Footer() {

    const data = [
        {
            title: 'Company',
            links: [
                { title: 'About us', href: '#about-us' },
                { title: 'Our vision', href: '#our-vision' },
                { title: 'Community', href: '#community' },
                { title: 'Careers', href: '#careers' },
                { title: 'Term & conditions', href: '#term-and-conditions' },
                { title: 'Privacy', href: '#privacy' },
            ],
        },
        {
            title: 'Account',
            links: [
                { title: 'Settings', href: '#settings' },
                { title: 'Refund policy', href: '#refund-policy' },
                { title: 'Affiliates', href: '#affiliates' },
                { title: 'Gift cards', href: '#gift-cards' },
            ],
        },
        {
            title: 'Contact',
            links: [
                { title: 'Contact us', href: '#contact-us' },
                { title: 'Instagram', href: '#instagram' },
                { title: 'Linkedin', href: '#linkedin' },
                { title: 'Github', href: '#github' },
            ],
        },
    ];
    return (
        <footer className="px-4 md:px-16 lg:px-24 text-[13px] py-16 bg-white text-gray-500">
            <div className="flex flex-wrap items-start min-md:justify-between gap-10 md:gap-[60px]">
                
                {data.map((item, index) => (
                    <div key={index} className="max-w-80">
                        <p className="font-semibold text-gray-800">{item.title}</p>
                        <ul className="mt-5 space-y-2">
                            {item.links.map((link, index) => (
                                <li key={index}>
                                    <a href={link.href} className="hover:text-indigo-500 transition">
                                        {link.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div className="max-w-80 md:ml-40">
                    <p className='font-semibold text-gray-800'>Sign up for newsletter</p>
                    <p className='mt-5 text-sm'>
                        The latest news, articles and resources, sent to your inbox weekly.
                    </p>
                    <div className='flex items-center mt-4'>
                        <input type="email" className='bg-white w-full border border-gray-300 h-9 px-3 outline-none' />
                        <button className="w-full py-3 rounded-full text-white font-medium bg-gradient-to-r from-indigo-600 to-violet-500 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
                               Sign Up
                         </button>


                    </div>
                </div>
            </div>
        
        </footer>
    );
};