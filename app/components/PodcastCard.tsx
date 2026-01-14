import Image from 'next/image';

interface Podcast {
    id: string;
    title: string;
    host: string;
    guest: string;
    date: string;
    duration: string;
    imageUrl: string;
    description: string;
}

export const PodcastCard = ({ podcast, active = false }: { podcast: Podcast, active?: boolean }) => {
    return (
        <div className={`group flex flex-col md:flex-row gap-6 p-4 rounded-2xl border transition-all hover:bg-white/5 ${active ? 'bg-white/5 border-accent/50' : 'bg-transparent border-transparent hover:border-white/10'}`}>
            <div className="relative h-48 w-full md:w-48 flex-shrink-0 overflow-hidden rounded-xl">
                 <Image 
                    src={podcast.imageUrl} 
                    alt={podcast.title} 
                    fill 
                    className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors cursor-pointer">
                    <div className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center pl-1 shadow-lg transform group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col justify-center flex-1">
                 <div className="flex items-center gap-3 text-xs font-bold tracking-wider text-accent uppercase mb-2">
                    <span>Episode {podcast.id}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{podcast.date}</span>
                 </div>
                 
                 <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors cursor-pointer">
                    {podcast.title}
                 </h3>
                 
                 <p className="text-sm text-muted mb-4 line-clamp-2">
                    {podcast.description}
                 </p>
                 
                 <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {podcast.duration}
                    </span>
                    <span>with <span className="text-white">{podcast.guest}</span></span>
                 </div>
            </div>
            
             <div className="hidden md:flex flex-col justify-center items-end gap-2">
                 <button className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                 </button>
                 <button className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                 </button>
             </div>
        </div>
    );
};
