import SectionTitle from '@/components/section-title';
import { StarIcon } from 'lucide-react';

export default function OurTestimonialSection() {
  const data = [
    {
      review:
        'Medora keeps all my prescriptions and reports in one place. No more carrying files to every doctor visit.',
      name: 'Rahul Sharma',
      about: 'Patient',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
    },
    {
      review:
        'Sharing lab reports with my doctor has become instant and stress-free. This platform is genuinely useful.',
      name: 'Karan Verma',
      about: 'Working Professional',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    },
    {
      review:
        'I can finally track my medical history digitally. Everything is organized and accessible anytime.',
      name: 'Amit Patel',
      about: 'Patient',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60',
    },
    {
      review:
        'Very helpful for managing family health records. Clean UI and very easy to navigate.',
      name: 'Pramik Nair',
      about: 'Patient',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60',
    },
    {
      review:
        'Secure, fast, and reliable. I feel confident storing important medical documents here.',
      name: 'Dr. Kavya Singh',
      about: 'Healthcare Professional',
      rating: 5,
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop',
    },
    {
      review:
        'Medora makes healthcare data management simple. Doctors can view reports instantly.',
      name: 'Rohan Gupta',
      about: 'User',
      rating: 5,
      image:
        'https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage1.png',
    },
  ];

  return (
    <section id="testimonials" className='scroll-mt-8 flex flex-col items-center justify-center py-12  '>
      <SectionTitle
        title='What Our Users Say'
        subtitle='Real experiences from patients and healthcare professionals using Medora to manage medical records.'
      />

      <div className='mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {data.map((item, index) => (
          <div
            key={index}
            className='w-full max-w-88 space-y-4 rounded-md border  p-5 dark:bg-neutral-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-md'
          >
            <div className='flex gap-1'>
              {[...Array(item.rating)].map((_, index) => (
                <StarIcon
                  key={index}
                  className='size-4 fill-blue-500 text-blue-500'
                />
              ))}
            </div>

            <p className='line-clamp-3'>“{item.review}”</p>

            <div className='flex items-center gap-2 pt-3'>
              <img
                className='size-10 rounded-full object-cover'
                src={item.image}
                alt={item.name}
              />
              <div>
                <p className='font-medium text-gray-900'>{item.name}</p>
                <p className='text-gray-500 text-xs'>{item.about}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
