import { ArrowRightIcon } from "lucide-react";

export default function WhatWeDoSection() {
    return (
        <section className="flex flex-col md:flex-row items-center justify-center gap-20 mt-20">
            <div className="relative shadow-2xl shadow-indigo-600/40 rounded-2xl overflow-hidden shrink-0">
                <img className="max-w-sm w-full object-cover rounded-2xl"
                    src="https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?q=80&w=451&h=451&auto=format&fit=crop"
                    alt="" />
                <div className="flex items-center gap-1 max-w-72 absolute bottom-8 left-8 bg-white p-4 rounded-xl">
                    <div className="flex -space-x-4 shrink-0">
                        <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200" alt="image"
                            className="size-9 rounded-full border-[3px] border-white hover:-translate-y-1 transition z-1" />
                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200" alt="image"
                            className="size-9 rounded-full border-[3px] border-white hover:-translate-y-1 transition z-[2]" />
                        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&h=200&auto=format&fit=crop"
                            alt="image"
                            className="size-9 rounded-full border-[3px] border-white hover:-translate-y-1 transition z-[3]" />
                        <div
                            className="flex items-center justify-center text-xs  text-white size-9 rounded-full border-[3px] border-white bg-indigo-600 hover:-translate-y-1 transition z-[4]">
                            50+
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-800">Join our developer community</p>
                </div>
            </div>
            <div className="text-sm text-slate-600 max-w-md">
                <h1 className="text-xl uppercase font-semibold text-slate-700">What we do?</h1>
                <div className="w-24 h-[3px] rounded-full bg-gradient-to-r from-indigo-600 to-[#DDD9FF]"></div>
                <p className="mt-8">PrebuiltUI helps you build faster by transforming your design vision into fully functional,
                    production-ready UI components. </p>
                <p className="mt-4">Whether you're launching a SaaS app, landing page, or dashboard, our collection of Tailwind
                    CSS components is crafted to boost your development speed and improve user experience.</p>
                <p className="mt-4">From UI design systems to automation-ready layouts, PrebuiltUI empowers you to build
                    beautifully and scale effortlessly.</p>
                <button className="flex items-center gap-2 mt-8 hover:opacity-90 transition btn py-3 px-8 rounded-full text-white">
                    <span>Read more</span>
                    <ArrowRightIcon className='size-5' />
                </button>
            </div>
        </section>
    );
};