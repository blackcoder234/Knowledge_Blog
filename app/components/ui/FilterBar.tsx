"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface FilterProps {
  categories: string[];
  activeCategory: string;
}

export const FilterBar = ({ categories, activeCategory }: FilterProps) => {
    const searchParams = useSearchParams();

    const createQueryString = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'All') {
            params.delete(name);
        } else {
            params.set(name, value);
        }
        return params.toString();
    };

    return (
        <div className="flex flex-wrap items-center gap-4 border-b border-white/10 pb-4 mb-10 text-white">
            <Link
                href={`/blog?${createQueryString('category', 'All')}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === 'All' 
                        ? 'bg-accent text-black' 
                        : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'
                }`}
            >
                All
            </Link>
            {categories.map((cat) => (
                <Link 
                    key={cat}
                    href={`/blog?${createQueryString('category', cat)}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeCategory === cat 
                            ? 'bg-accent text-black' 
                            : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'
                    }`}
                >
                    {cat}
                </Link>
            ))}
        </div>
    );
};

export default FilterBar;
