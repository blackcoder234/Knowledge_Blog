"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const BlogSearch = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
            params.set('q', query);
        } else {
            params.delete('q');
        }
        router.push(`/blog?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <input
                type="text"
                placeholder="Search articles..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
        </form>
    );
};
