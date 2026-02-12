'use client';

import SectionTitle from '@/components/section-title';
import {  MinusIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function FaqSection() {
 const [isOpen, setIsOpen] = useState<number | null>(null);

const data = [
  {
    question: 'Is my medical data secure on Medora?',
    answer: 'Yes. All records are encrypted and securely stored so only you and authorized doctors can access them.',
  },
  {
    question: 'What kind of records can I upload?',
    answer: 'You can upload prescriptions, lab reports, scans, and other medical files.',
  },
  {
    question: 'Can I share my reports with doctors?',
    answer: 'Yes. Share records securely without carrying physical files.',
  },
  {
    question: 'Can I access my records anytime?',
    answer: 'Yes. Your medical data stays available 24/7 from any device.',
  },
];


  return (
    <section id="faq" className='scroll-mt-18 flex flex-col items-center justify-center py-24'>

      <SectionTitle
        title="FAQ's"
        subtitle="-Everything you need to know about storing and managing your medical records with Medora."
      />

      <div className='mx-auto mt-12 w-full max-w-xl'>
        {data.map((item, index) => (
          <div key={index} className='flex flex-col border-b border-gray-200 '>
            <h3
              className='flex cursor-pointer items-start justify-between gap-4 py-4 font-medium '
              onClick={() => setIsOpen(isOpen === index ? null : index)}
            >
              {item.question}
              {isOpen === index
                ? <MinusIcon className='size-5 text-gray-500' />
                : <PlusIcon className='size-5 text-gray-500' />
              }
            </h3>

            <p className={`pb-4 text-sm text-gray-500 ${isOpen === index ? 'block' : 'hidden'}`}>
              {item.answer}
            </p>
          </div>
        ))}       
      </div>
<div className="mt-10 text-center">
  <Link
    href="/faqs"
    className="text-indigo-600 font-semibold hover:text-indigo-700 transition"
  >
    View all FAQs →
  </Link>
</div>

    </section>
    
    
  );
}
