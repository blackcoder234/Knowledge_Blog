import { Container } from './ui/Container';
import { Button } from './ui/Button';
import Image from 'next/image';

interface NewsPost {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  excerpt: string;
}

export const NewsHero = () => {
  const featuredNews: NewsPost = {
    id: 'featured-1',
    title: "Global Summit on AI Safety: Key Takeaways",
    category: "Policy",
    author: "Elena Fisher",
    date: "Oct 15, 2024",
    imageUrl: "https://placehold.co/1200x600/1a1a1a/FFF?text=AI+Safety+Summit",
    excerpt: "World leaders and tech giants gathered in London to establish the first international framework for artificial intelligence safety protocols."
  };

  return (
    <section className="relative w-full py-12 md:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-card border border-white/10 group cursor-pointer">
           <div className="relative h-[400px] md:h-[500px] w-full">
             <Image
               src={featuredNews.imageUrl}
               alt={featuredNews.title}
               fill
               className="object-cover transition-transform duration-700 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
           </div>
           
           <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
             <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                Featured News
             </div>
             
             <h2 className="mb-4 max-w-4xl text-3xl font-bold leading-tight text-white md:text-5xl group-hover:text-accent transition-colors">
                {featuredNews.title}
             </h2>
             
             <p className="mb-8 max-w-2xl text-lg text-zinc-300 line-clamp-2 md:line-clamp-none">
                {featuredNews.excerpt}
             </p>
             
             <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
                <span className="flex items-center gap-2 text-white font-medium">
                    <div className="h-8 w-8 rounded-full bg-zinc-700" /> {/* Avatar Placeholder */}
                    {featuredNews.author}
                </span>
                <span>{featuredNews.date}</span>
                <span className="hidden md:inline">•</span>
                <span>5 min read</span>
                
                <Button variant="primary" className="ml-auto">
                    Read Full Story
                </Button>
             </div>
           </div>
        </div>
      </Container>
    </section>
  );
};
