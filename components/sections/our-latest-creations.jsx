import SectionTitle from "@/components/section-title";

export default function OurLatestCreations() {

  const data = [
    {
      title: 'Digital Prescriptions',
      description: 'Store and access prescriptions securely anytime without worrying about losing paper records.',
      image: '/assets/image-1.png',
    },
    {
      title: 'Lab Reports & Scans',
      description: 'Keep all medical reports, scans, and test results organized in one safe digital place.',
      image: '/assets/image-2.png',
    },
    {
      title: 'Health History Timeline',
      description: 'Track treatments, diagnoses, and doctor visits with a complete medical history timeline.',
      image: '/assets/image-3.png',
    },
  ];

  return (
    <section className="flex flex-col items-center justify-center py-16 bg-white text-black">

      <SectionTitle
        title="Medical Records in One Place"
        subtitle="Everything you need to manage prescriptions, reports, and health history — securely and instantly."
      />

      <div className="flex flex-wrap items-center justify-center gap-10 mt-12">
        {data.map((item, index) => (
          <div key={index} className="max-w-80 hover:-translate-y-0.5 transition duration-300">
            <img className="rounded-xl" src={item.image} alt={item.title} />
            <h3 className="text-base font-semibold text-slate-700 mt-4">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
