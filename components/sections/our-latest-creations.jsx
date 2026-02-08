import SectionTitle from "@/components/section-title";

export default function OurLatestCreations() {

    const data = [
        {
            title: 'Autumn Leaf Harmony',
            description: 'Earthy seasonal tones with organic patterns, bringing coziness and natural charm into interiors.',
            image: '/assets/image-1.png',
        },
        {
            title: 'Winter Frost Calm',
            description: 'Crisp whites with frosted details, enhancing minimalist and contemporary spaces with sophistication.',
            image: '/assets/image-2.png',
        },
        {
            title: 'Spring Canvas',
            description: 'Pastel floral tones that uplift interiors with beauty, freshness, and vibrant seasonal energy.',
            image: '/assets/image-3.png',
        },
    ];
    return (
        <section className="flex flex-col items-center justify-center mt-40">
            <SectionTitle title="Our Latest Creations" subtitle="A visual collection of our most recent works - each piece crafted with intention, emotion, and style." />
            <div className="flex flex-wrap items-center justify-center gap-10 mt-16">
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