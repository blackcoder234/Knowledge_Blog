import { Button } from './ui/Button';
import Image from 'next/image';

interface Resource {
    title: string;
    description: string;
    type: 'Ebook' | 'Whitepaper' | 'Report';
    size: string;
    imageUrl: string;
}

export const ResourceCard = ({ resource }: { resource: Resource }) => {
    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-card p-0 transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 flex flex-col h-full">
            <div className="relative h-48 w-full overflow-hidden bg-zinc-800">
                <Image 
                    src={resource.imageUrl} 
                    alt={resource.title} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                 <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10 flex items-center gap-1">
                    {resource.type === 'Ebook' ? '📚' : resource.type === 'Whitepaper' ? '📄' : '📊'}
                    {resource.type}
                 </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                    {resource.title}
                </h3>
                <p className="text-sm text-muted mb-6 flex-1">
                    {resource.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="text-xs text-zinc-500 font-mono">{resource.size}</span>
                    <Button variant="outline" size="sm" className="gap-2 group-hover:bg-accent group-hover:text-black group-hover:border-accent">
                        Download
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 9.75V1.5m0 0 3 3m-3-3-3 3" />
                        </svg>
                    </Button>
                </div>
            </div>
        </div>
    );
};
