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
        <footer className="px-4 md:px-16 lg:px-24 text-[13px] mt-32 text-gray-500">
            <div className="flex flex-wrap items-start min-md:justify-between gap-10 md:gap-[60px]">
                <a href="https://prebuiltui.com?utm_source=material" className="max-w-80">
                    <svg width="30" height="33" viewBox="0 0 30 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 4.54907L14.75 8.43392L21.5 4.54907M8 27.8283V20.0736L1.25 16.1887M28.25 16.1887L21.5 20.0736V27.8283M1.655 8.65805L14.75 16.2036L27.845 8.65805M14.75 31.25V16.1887M28.25 22.1654V10.212C28.2495 9.68795 28.1106 9.17326 27.8473 8.71956C27.584 8.26585 27.2056 7.88909 26.75 7.62707L16.25 1.65036C15.7939 1.38808 15.2766 1.25 14.75 1.25C14.2234 1.25 13.7061 1.38808 13.25 1.65036L2.75 7.62707C2.29439 7.88909 1.91597 8.26585 1.65269 8.71956C1.38941 9.17326 1.25054 9.68795 1.25 10.212V22.1654C1.25054 22.6895 1.38941 23.2041 1.65269 23.6578C1.91597 24.1115 2.29439 24.4883 2.75 24.7503L13.25 30.727C13.7061 30.9893 14.2234 31.1274 14.75 31.1274C15.2766 31.1274 15.7939 30.9893 16.25 30.727L26.75 24.7503C27.2056 24.4883 27.584 24.1115 27.8473 23.6578C28.1106 23.2041 28.2495 22.6895 28.25 22.1654Z" stroke="url(#paint0_linear_8073_1433)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="paint0_linear_8073_1433" x1="14.75" y1="1.25" x2="14.75" y2="31.25" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#A2A2A2" />
                                <stop offset="1" stopColor="#383838" />
                            </linearGradient>
                        </defs>
                    </svg>
                </a>
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
                        <button className='flex shrink-0 items-center justify-center btn text-white h-9 px-6'>
                            Sign up
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col md:flex-row py-7 mt-12 border-gray-200 md:justify-between max-md:items-center border-t max-md:text-center gap-2 items-end">
                <p className="text-center">© 2025 <a href="https://prebuiltui.com?utm_source=material">PrebuiltUI, All rights reserved.</a></p>
                <div className="flex items-center gap-4">
                    <a href="https://dribbble.com/prebuiltui" target="_blank" rel="noreferrer">
                        <DribbbleIcon className="size-5 text-gray-400 hover:text-indigo-500" />
                    </a>
                    <a href="https://www.linkedin.com/company/prebuiltui" target="_blank" rel="noreferrer">
                        <LinkedinIcon className="size-5 text-gray-400 hover:text-indigo-500" />
                    </a>
                    <a href="https://x.com/prebuiltui" target="_blank" rel="noreferrer">
                        <TwitterIcon className="size-5 text-gray-400 hover:text-indigo-500" />
                    </a>
                    <a href="https://www.youtube.com/@prebuiltui" target="_blank" rel="noreferrer">
                        <YoutubeIcon className="size-6 text-gray-400 hover:text-indigo-500" />
                    </a>
                </div>
            </div>
        </footer>
    );
};