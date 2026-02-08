'use client';

import { ArrowRightIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export default function HeroSection() {
    const installCommand = 'npm install prebuiltui@latest';
    const [isCopied, setIsCopied] = useState(false);

    const logos = [
        '/companies-logo/instagram.svg',
        '/companies-logo/framer.svg',
        '/companies-logo/microsoft.svg',
        '/companies-logo/huawei.svg',
        '/companies-logo/walmart.svg',
    ]

    const handleCopy = () => {
        setIsCopied(true);
        navigator.clipboard.writeText(installCommand);
        setTimeout(() => {
            setIsCopied(false);
        }, 3000);
    }

    return (
        <section className="flex flex-col items-center justify-center relative h-svh overflow-hidden">
            <svg className="absolute inset-0 -z-10" width="1440" height="1018" viewBox="0 0 1440 1018" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#a)">
                    <ellipse cx="271.282" cy="200.379" rx="271.282" ry="200.379" fill="#FBFFE1" />
                </g>
                <g filter="url(#b)">
                    <ellipse cx="993.487" cy="451.53" rx="359.487" ry="265.53" fill="url(#c)" fillOpacity=".1" />
                </g>
                <defs>
                    <filter id="a" x="-300" y="-300" width="1142.56" height="1000.76" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="150" result="effect1_foregroundBlur_8119_961" />
                    </filter>
                    <filter id="b" x="333.9" y="-114.1" width="1319.18" height="1131.26" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="150.05" result="effect1_foregroundBlur_8119_961" />
                        <feTurbulence type="fractalNoise" baseFrequency="inf inf" stitchTiles="stitch" numOctaves="3" result="noise" seed="9943" />
                        <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
                        <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                            <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0" />
                        </feComponentTransfer>
                        <feComposite operator="in" in2="effect1_foregroundBlur_8119_961" in="coloredNoise1" result="noise1Clipped" />
                        <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
                        <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
                        <feMerge result="effect2_noise_8119_961">
                            <feMergeNode in="effect1_foregroundBlur_8119_961" />
                            <feMergeNode in="color1" />
                        </feMerge>
                    </filter>
                    <linearGradient id="c" x1="550.41" y1="500.394" x2="1343.15" y2="82.986" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F6DFF4" />
                        <stop offset=".196" stopColor="#FF6E00" />
                        <stop offset=".407" stopColor="#F8C04D" />
                        <stop offset=".586" stopColor="#EF3EC2" />
                        <stop offset=".816" stopColor="#4700EC" />
                        <stop offset=".949" stopColor="#5100BA" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="flex flex-wrap items-center justify-center p-1.5 rounded-full border border-indigo-100">
                <div className="flex items-center -space-x-3">
                    <img className="size-7 rounded-full border-3 border-white"
                        src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=50" alt="userImage1" />
                    <img className="size-7 rounded-full border-3 border-white"
                        src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50" alt="userImage2" />
                    <img className="size-7 rounded-full border-3 border-white"
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=50&h=50&auto=format&fit=crop"
                        alt="userImage3" />
                </div>
                <p className="pl-2 pr-3 text-gray-600">Join community of 1m+ founders </p>
            </div>

            <h1
                className="text-4xl md:text-6xl/18 text-center font-semibold max-w-2xl mt-5 bg-gradient-to-r from-black to-[#748298] text-transparent bg-clip-text">
                Build, Launch & Scale with{" "}
                <span className="bg-gradient-to-b from-indigo-300 to-indigo-600 bg-clip-text text-transparent">PrebuiltUI</span>.
            </h1>
            <p className="text-slate-600 md:text-base max-md:px-2 text-center max-w-lg mt-3">
                A high-performance, serverless Postgres database that helps you ship fast and scale without limits.
            </p>

            <button
                className="flex items-center gap-2 btn hover:opacity-90 text-white px-8 py-3 mt-8 rounded-full transition">
                <span>get started for free</span>
                <ArrowRightIcon className='size-5' />
            </button>

            <div className="text-gray-400 bg-gradient-to-b from-indigo-600/50 to-gray-300/50 p-px rounded-[7px] mt-8">
                <div className="flex items-center gap-2 bg-white rounded-md px-4 py-3">
                    $ <span>{installCommand}</span>
                    <button onClick={handleCopy} className="cursor-pointer ml-2">
                        {isCopied ? <CheckIcon className='size-4' /> : <CopyIcon className='size-4' />}
                    </button>
                </div>
            </div>
            <p className="py-6 text-slate-600 mt-14">Trusting by leading brands, including —</p>

            <div className="flex flex-wrap justify-between max-sm:justify-center gap-10 max-w-4xl w-full mx-auto py-4" id="logo-container">
                {logos.map((logo, index) => <img key={index} src={logo} alt="logo" className="h-7 w-auto max-w-xs" />)}
            </div>
        </section >
    );
}