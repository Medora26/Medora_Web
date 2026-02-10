'use client';

import SectionTitle from '@/components/section-title';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';

export default function FaqSection() {
 const [isOpen, setIsOpen] = useState<number | null>(null);

  const data = [
    {
      question: 'Is my medical data secure on Medora?',
      answer: 'Yes. All records are encrypted and stored securely so only you and authorized doctors can access them.',
    },
    {
      question: 'What kind of records can I upload?',
      answer: 'You can upload prescriptions, lab reports, scans, health history documents, and other medical files.',
    },
    {
      question: 'Can I share my reports with doctors?',
      answer: 'Yes. You can instantly share records with doctors whenever needed without carrying physical files.',
    },
    {
      question: 'Can I access my records anytime?',
      answer: 'Absolutely. Your medical data stays available 24/7 from any device.',
    },
    {
      question: 'Do I need technical knowledge to use Medora?',
      answer: 'No. Medora is designed to be simple and easy for anyone to use.',
    },
    {
      question: 'Is Medora free to use?',
      answer: 'Yes, you can start using Medora and uploading records without any upfront cost.',
    },
  ];

  return (
    <section id="faq" className='scroll-mt-18 flex flex-col items-center justify-center  bg-white text-black'>

      <SectionTitle
        title="FAQ's"
        subtitle="-Everything you need to know about storing and managing your medical records with Medora."
      />

      <div className='mx-auto mt-12 w-full max-w-xl'>
        {data.map((item, index) => (
          <div key={index} className='flex flex-col border-b border-gray-200 bg-white'>
            <h3
              className='flex cursor-pointer items-start justify-between gap-4 py-4 font-medium text-black'
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

    </section>
  );
}
