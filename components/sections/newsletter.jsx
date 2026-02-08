import SectionTitle from '@/components/section-title';

export default function Newsletter() {
    return (
        <section className='flex flex-col items-center justify-center mt-40'>
            <SectionTitle title='Join Newsletter' subtitle='A visual collection of our most recent works - each piece crafted with intention, emotion and style.' />

            <div className='flex bg-slate-100 text-sm p-1 rounded-full w-full max-w-xl my-10 border-2 border-white ring ring-slate-200'>
                <input className='flex-1 rounded-full pl-5 max-md:py-3 outline-none' type='text' placeholder='Enter your email address' />
                <button className='font-medium hidden md:block btn text-white px-7 py-3 rounded-full hover:opacity-90 active:scale-95 transition'>
                    Get Updates
                </button>
            </div>
            <button className='font-medium md:hidden btn text-white px-7 py-3 rounded-full hover:opacity-90 active:scale-95 transition'>
                Get Updates
            </button>
        </section>
    );
}
