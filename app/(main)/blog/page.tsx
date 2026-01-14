import { Container } from "@/app/components/ui/Container";
import { BlogCard } from "@/app/components/BlogCard";
import { FilterBar } from "@/app/components/ui/FilterBar";
import { Button } from "@/app/components/ui/Button";
import { BlogSearch } from "@/app/components/blog/BlogSearch";
import Image from "next/image";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import Category from "@/models/Category";

export const revalidate = 0; // Dynamic for search

async function getBlogData(searchParams: { q?: string; category?: string }) {
    await dbConnect();
    
    // Build Query
    const query: any = {};
    
    if (searchParams.q) {
        // Simple regex search for now (text search requires indexing)
        query.$or = [
            { title: { $regex: searchParams.q, $options: 'i' } },
            { content: { $regex: searchParams.q, $options: 'i' } },
            { excerpt: { $regex: searchParams.q, $options: 'i' } }
        ];
    }

    if (searchParams.category && searchParams.category !== 'All') {
        query.category = searchParams.category;
    }

    // Featured: Top 3 featured posts (Only if no search/filter is active, typically)
    // If searching, we skip the "Featured" layout and just show results?
    // Let's keep Featured always visible on home, but maybe hide if searching.
    const isFiltering = !!(searchParams.q || (searchParams.category && searchParams.category !== 'All'));

    let featuredStories: any[] = [];
    if (!isFiltering) {
        featuredStories = await Post.find({ featured: true })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
    }

    // Feed: All posts matching query
    // If featured exists, exclude them from feed (unless filtering, then show all matches)
    const featuredIds = featuredStories.map(p => p._id);
    
    if (featuredIds.length > 0) {
        query._id = { $nin: featuredIds };
    }

    const feedPosts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(20) // Limit to 20 for now
        .lean();

    const latestBreaking = await Post.findOne().sort({ createdAt: -1 }).select('title slug').lean();
    
    // Fetch Categories for FilterBar
    const categoriesDocs = await Category.find({}).select('name').sort('name').lean();
    const categories = categoriesDocs.map(c => c.name);

    return { featuredStories, feedPosts, latestBreaking, categories, isFiltering };
}


const editorsPicks = [
    { num: 1, title: "Why Python is eating the world" },
    { num: 2, title: "The hidden cost of cloud computing" },
    { num: 3, title: "Interview: Sam Altman on AGI" },
    { num: 4, title: "Review: Framework Laptop 16" },
];

export default async function BlogPage(props: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const searchParams = await props.searchParams;
  const { featuredStories, feedPosts, latestBreaking, categories, isFiltering } = await getBlogData(searchParams);

  // Handle empty state if needed
  if (!featuredStories.length && !feedPosts.length) {
      return (
          <div className="bg-background min-h-screen pt-32 text-center text-white">
              <Container>
                  <h2 className="text-2xl font-bold mb-4">No posts found</h2>
                  <p className="text-zinc-400">Try adjusting your search or filters.</p>
                  <div className="mt-8">
                       <Link href="/blog" className="text-accent hover:underline">Clear all filters</Link>
                  </div>
              </Container>
          </div>
      )
  }

  // Helper for safe access since array might be smaller than 3
  const mainFeature = featuredStories[0];
  const sideFeatures = featuredStories.slice(1);

  return (
    <div className="bg-background min-h-screen pt-20">
      
      {/* 1. Breaking News Ticker */}
      {latestBreaking && !isFiltering && (
          <div className="bg-accent/10 border-b border-accent/20">
            <Container className="py-2 flex items-center justify-between text-xs md:text-sm">
                 <div className="flex items-center gap-3">
                     <span className="bg-accent text-black font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider animate-pulse">Breaking</span>
                     <span className="text-white truncate max-w-[200px] md:max-w-none">{latestBreaking.title}</span>
                 </div>
                 <Link href={`/blog/${latestBreaking.slug}`} className="hidden md:inline text-accent hover:underline">Read Story &rarr;</Link>
            </Container>
          </div>
      )}

      <Container className="pb-20">
        
        {/* 2. Featured "Bento" Grid - Hide if filtering */}
        {mainFeature && !isFiltering && (
            <section className="py-8 md:py-12">
                <h1 className="sr-only">Featured Stories</h1>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[500px]">
                    {/* Main Feature (Left, 2 cols wide) */}
                    <div className="lg:col-span-2 relative group overflow-hidden rounded-2xl cursor-pointer">
                        <Link href={`/blog/${mainFeature.slug}`} className="block w-full h-full">
                            <div className="absolute inset-0 bg-zinc-800 animate-pulse" /> 
                            {/* Placeholder/Loading background if image loads slow, but handled by Next/Image usually. */}
                            <Image src={mainFeature.image} alt={mainFeature.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8">
                                <span className="text-accent font-bold text-xs uppercase tracking-wider mb-2">{mainFeature.category}</span>
                                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2 group-hover:text-accent transition-colors">{mainFeature.title}</h2>
                                <div className="flex items-center gap-3 text-zinc-300 text-sm">
                                    <span>{mainFeature.author.name}</span>
                                    <span>•</span>
                                    <span>{mainFeature.readTime}</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Secondary Features (Right, 2 stacked) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {sideFeatures.map((story: any) => (
                            <div key={story._id} className="relative flex-1 group overflow-hidden rounded-2xl cursor-pointer min-h-[200px]">
                                <Link href={`/blog/${story.slug}`} className="block w-full h-full">
                                     <Image src={story.image} alt={story.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                                        <span className="text-accent font-bold text-[10px] uppercase tracking-wider mb-1">{story.category}</span>
                                        <h3 className="text-xl font-bold text-white leading-tight group-hover:text-accent transition-colors">{story.title}</h3>
                                     </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {/* 3. Main Feed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
            
            {/* Left Column: Feed */}
            <div className="lg:col-span-8 flex flex-col gap-10">
                <div className="flex flex-col gap-6 border-b border-white/10 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-8 bg-accent rounded-sm"></span>
                            {isFiltering ? `Results for "${searchParams.q || searchParams.category}"` : 'Latest News'}
                        </h2>
                        <BlogSearch />
                    </div>
                    
                    <FilterBar 
                        categories={categories} 
                        activeCategory={searchParams.category || "All"} 
                    />
                </div>

                {/* Feed Items */}
                <div className="space-y-8">
                    {feedPosts.map((post: any, i: number) => (
                        <div key={post._id}>
                            <Link href={`/blog/${post.slug}`}>
                                <div className="flex flex-col md:flex-row gap-6 group cursor-pointer">
                                    <div className="relative w-full md:w-64 h-48 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                                         <Image src={post.image} alt={post.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                                            <span className="text-accent font-bold uppercase">{post.category}</span>
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-accent transition-colors">{post.title}</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                {post.likes}
                                            </div>
                                             <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                {post.views}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            
                            {/* In-Feed Break Mockup (after 2nd post) */}
                            {i === 1 && !isFiltering && (
                                <div className="my-10 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-y border-white/5 py-8 -mx-4 px-4 md:-mx-0 md:rounded-2xl">
                                    <span className="text-xs font-bold text-accent uppercase tracking-wider mb-2 block">Deep Dive</span>
                                    <h4 className="text-xl font-bold text-white mb-2">The Ethics of AGI: A 3-Part Series</h4>
                                    <p className="text-sm text-zinc-400 mb-4">We spoke to 50 leading AI researchers about the future of humanity.</p>
                                    <Button variant="outline" size="sm">Read the Series</Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-center pt-8 border-t border-white/5">
                    {/* Pagination could go here */}
                    <Button variant="outline" className="px-12 w-full md:w-auto">Load More Stories</Button>
                </div>
            </div>

            {/* Right Column: Sticky Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
                <div className="sticky top-24 space-y-8">
                    
                     {/* Newsletter 'Interstitial' Style Widget */}
                    <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-accent/20 transition-colors"></div>
                        <h3 className="text-lg font-bold text-white mb-2">Get the Daily Brief</h3>
                        <p className="text-xs text-zinc-400 mb-4">Join 50,000+ engineers and founders.</p>
                        <div className="flex gap-2">
                             <input type="email" placeholder="Email" className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-accent w-full" />
                             <button className="bg-accent text-black px-4 py-2 rounded font-bold text-sm hover:bg-accent/90">Go</button>
                        </div>
                    </div>

                    {/* Editor's Picks (Numbered List) */}
                    <div>
                        <h3 className="font-bold text-zinc-500 uppercase tracking-wider text-xs mb-4 border-b border-white/10 pb-2">Editor's Picks</h3>
                        <div className="space-y-4">
                            {editorsPicks.map((pick) => (
                                <a key={pick.num} href="#" className="flex gap-4 group items-start">
                                    <span className="text-3xl font-black text-white/20 group-hover:text-accent font-display -mt-2 transition-colors">0{pick.num}</span>
                                    <h4 className="text-sm font-bold text-white group-hover:text-accent transition-colors leading-snug pt-1">{pick.title}</h4>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Topic Cloud */}
                    <div>
                         <h3 className="font-bold text-zinc-500 uppercase tracking-wider text-xs mb-4 border-b border-white/10 pb-2">Discover Topics</h3>
                         <div className="flex flex-wrap gap-2">
                            {categories.map(tag => (
                                <Link key={tag} href={`/blog?category=${tag}`} className="text-xs px-3 py-1.5 bg-white/5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5">
                                    {tag}
                                </Link>
                            ))}
                         </div>
                    </div>

                </div>
            </aside>
        </div>
      </Container>
    </div>
  );
}
