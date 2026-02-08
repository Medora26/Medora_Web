'use client';

import SectionTitle from '@/components/section-title';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

export default function FaqSection() {
    const [isOpen, setIsOpen] = useState(false);
    const data = [
        {
            question: 'Do I need coding or design experience to use PrebuiltUI?',
            answer: "Basic coding knowledge (HTML/CSS, Tailwind) helps, but advanced design skills aren't required. You can use components as-is or customize them.",
        },
        {
            question: 'What is PrebuiltUI and how does it help developers and designers?',
            answer: 'PrebuiltUI provides ready-to-use, customizable UI components and templates, saving time for developers and designers.',
        },
        {
            question: 'Can I use PrebuiltUI components in my existing project?',
            answer: 'Yes, components can be integrated into HTML, React, Next.js, Vue, and other projects using Tailwind CSS.',
        },
        {
            question: 'How customizable are the generated components?',
            answer: 'Components are highly customizable with Tailwind utility classes, theming, and structural adjustments.',
        },
        {
            question: 'Does PrebuiltUI support team collaboration?',
            answer: "There's no clear documentation on built-in collaboration features. Check their support for team options.",
        },
        {
            question: 'Can I try PrebuiltUI before purchasing a plan?',
            answer: 'Yes, you can try PrebuiltUI with full access to features.',
        },
    ];

    return (
        <section className='flex flex-col items-center justify-center mt-40'>
            <SectionTitle title="FAQ's" subtitle="Looking for answers to your frequently asked questions? Check out our FAQ's section below to find." />
            <div className='mx-auto mt-12 w-full max-w-xl'>
                {data.map((item, index) => (
                    <div key={index} className='flex flex-col border-b border-gray-200 bg-white'>
                        <h3 className='flex cursor-pointer items-start justify-between gap-4 py-4 font-medium' onClick={() => setIsOpen(isOpen === index ? null : index)}>
                            {item.question}
                            {isOpen === index ? <MinusIcon className='size-5 text-gray-500' /> : <PlusIcon className='size-5 text-gray-500' />}
                        </h3>
                        <p className={`pb-4 text-sm/6 text-gray-500 ${isOpen === index ? 'block' : 'hidden'}`}>{item.answer}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}