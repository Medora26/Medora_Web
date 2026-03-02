 export interface TestimonialsDataProps  {
     review: string;
     name: string;
     about: string;
     image?: string | undefined;
 }
 
 export const TestimonialsData: TestimonialsDataProps[] = [
    {
      review:
        'Medora keeps all my prescriptions and reports in one place. No more carrying files to every doctor visit.',
      name: 'Rahul Sharma',
      about: 'Patient',
     
      image:
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
    },
    {
      review:
        'Sharing lab reports with my doctor has become instant and stress-free. This platform is genuinely useful.',
      name: 'Karan Verma',
      about: 'Working Professional',
     
      image:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    },
    {
      review:
        'I can finally track my medical history digitally. Everything is organized and accessible anytime.',
      name: 'Amit Patel',
      about: 'Patient',
     
      image:
        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=60',
    },
    {
      review:
        'Very helpful for managing family health records. Clean UI and very easy to navigate.',
      name: 'Pramik Nair',
      about: 'Patient',
     
      image:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60',
    },
    {
      review:
        'Secure, fast, and reliable. I feel confident storing important medical documents here.',
      name: 'Dr. Kavya Singh',
      about: 'Healthcare Professional',
      
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop',
    },
    {
      review:
        'Medora makes healthcare data management simple. Doctors can view reports instantly.',
      name: 'Rohan Gupta',
      about: 'User',
   
      image:
        'https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage1.png',
    },
  ];