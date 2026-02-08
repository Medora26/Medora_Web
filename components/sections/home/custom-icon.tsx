import { ICustomIcon } from "@/types";

export default function CustomIcon({ icon: Icon, dir = 'left' }: ICustomIcon) {
    return (
        <div className={`bg-orange-500 shadow-[inset_0_4px_4px_rgba(255,255,255,0.25),0_4px_10px_rgba(0,0,0,0.15)] p-2 aspect-square rounded-lg text-white ${dir === 'left' ? '-rotate-15' : 'rotate-15'}`}>
            <Icon size={24} />
        </div>
    )
}