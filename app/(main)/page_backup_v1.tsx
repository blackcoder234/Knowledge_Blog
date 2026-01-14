import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import { NewsletterForm } from "../components/NewsletterForm";

// Helper to fetch data
// We add tags to 'unstable_cache' or similar if we wanted valid revalidation, 
// but for now, we just rely on standard Next.js caching behavior (static unless dynamic func used).
// Since we are connecting to DB, we should probably mark this page as dynamic or use revalidate.
export const revalidate = 60; // Revalidate every minute

async function getHomepageData() {
  await dbConnect();
  
  const coverStories = await Post.find({ featured: true })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  const coverStory = coverStories[0];

  // Top stories: just latest posts (excluding cover)
  // Or specific Logic. Let's say top 3 posts by views or just latest.
  const topStories = await Post.find({ _id: { $ne: coverStory?._id } })
    .sort({ createdAt: -1 }) // Simple latest for now
    .limit(3)
    .lean();
    
  // Timeline: Latest posts (excluding cover & top)
  const excludeIds = [coverStory?._id, ...topStories.map(p => p._id)].filter(Boolean);
  const timelineFeed = await Post.find({ _id: { $nin: excludeIds } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
    
    return { coverStory, topStories, timelineFeed };
}


const trendingTopics = [
    "Generative Video", "Post-Quantum", "Fusion Energy", "Spatial Web", "Bio-Computing", "Zero-Knowledge"
];

const marketStats = [
    { label: "AI Index", value: "+12.4%" },
    { label: "Quantum VC", value: "$4.2B" },
    { label: "Clean Tech", value: "↑ High" }
];

// Helper to format date relative
function formatTimeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function formatTimelineDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth()) return "Today";
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(date: Date) {
     return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default async function Home() {
  const { coverStory, topStories, timelineFeed } = await getHomepageData();

  // If no data seeded yet, handle gracefully or show empty state
  if (!coverStory) {
      return (
          <div className="min-h-screen flex items-center justify-center text-white bg-background">
              <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Welcome to KnowledgeLog</h1>
                  <p className="text-zinc-400 mb-8">No content found. Please seed the database.</p>
                  <Link href="/api/seed">
                    <Button>Seed Database</Button>
                  </Link>
              </div>
          </div>
      )
  }

  return (
    <div className="bg-background min-h-screen text-white font-sans selection:bg-accent selection:text-black">
      
      {/* 1. The News Grid Hero */}
      <section className="pt-24 pb-12 border-b border-white/5">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* Left: Cover Story (8 Cols) */}
                <div className="lg:col-span-8 group cursor-pointer">
                    <Link href={`/blog/${coverStory.slug}`}>
                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm mb-6 border border-white/10">
                            <Image 
                                src={coverStory.image} 
                                alt={coverStory.title} 
                                fill 
                                className="object-cover transition-transform duration-1000 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80"></div>
                            <div className="absolute bottom-0 left-0 p-8 md:p-12">
                                <span className="inline-block px-3 py-1 bg-accent text-black text-[10px] font-bold uppercase tracking-widest mb-4">
                                    {coverStory.category}
                                </span>
                                <h1 className="text-4xl md:text-6xl font-bold leading-[1.1] mb-4 text-white group-hover:underline decoration-accent underline-offset-8">
                                    {coverStory.title}
                                </h1>
                                <p className="text-lg text-zinc-300 line-clamp-2 max-w-2xl font-light">
                                    {coverStory.excerpt}
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Right: Top Stories Stack (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col justify-between border-l border-white/5 pl-0 lg:pl-12">
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Developing Stories
                        </h3>
                        <div className="space-y-8">
                            {topStories.map((story: any) => (
                                <Link href={`/blog/${story.slug}`} key={story._id}>
                                    <div className="group cursor-pointer mb-8">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-mono text-zinc-500">{formatTimeAgo(story.createdAt)}</span>
                                            <span className="text-[10px] font-bold uppercase text-accent border border-accent/20 px-1 rounded-sm">{story.category}</span>
                                        </div>
                                        <h4 className="text-xl font-bold leading-snug group-hover:text-zinc-300 transition-colors">
                                            {story.title}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                    
                    {/* Market Ticker Widget */}
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Market Pulse</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {marketStats.map((stat, i) => (
                                <div key={i}>
                                    <div className="text-xl font-mono font-bold text-white">{stat.value}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
          </Container>
      </section>

      {/* 2. Topic Cloud Marquee */}
      <div className="border-b border-white/5 py-4 overflow-hidden bg-zinc-900/30">
        <div className="flex gap-12 animate-marquee whitespace-nowrap px-4">
            {[...trendingTopics, ...trendingTopics].map((topic, i) => (
                <span key={i} className="text-sm font-mono font-medium text-zinc-400 uppercase tracking-widest hover:text-white cursor-pointer transition-colors">
                    # {topic}
                </span>
            ))}
        </div>
      </div>

      {/* 3. The Timeline Feed */}
      <section className="py-20">
          <Container>
              <div className="flex flex-col lg:flex-row gap-16">
                  
                  {/* Timeline Content */}
                  <div className="lg:w-9/12">
                      <h2 className="text-2xl font-bold mb-12 flex items-center gap-4">
                          <span className="w-1 h-8 bg-accent"></span>
                          The Feed
                      </h2>
                      
                      <div className="relative border-l border-white/10 ml-3 md:ml-0 space-y-16 pl-8 md:pl-0">
                          {timelineFeed.map((post: any) => (
                              <Link href={`/blog/${post.slug}`} key={post._id}>
                                  <div className="relative flex flex-col md:flex-row gap-8 md:gap-12 group cursor-pointer mb-16">
                                      {/* Mobile Timeline Dot */}
                                      <div className="absolute left-[-37px] top-2 w-3 h-3 rounded-full bg-zinc-800 border-2 border-background group-hover:bg-accent transition-colors md:hidden"></div>
                                      
                                      {/* Time Column (Desktop) */}
                                      <div className="hidden md:flex flex-col items-end w-24 shrink-0 pt-1 text-right relative">
                                           <span className="text-lg font-mono font-bold text-white block">{formatTime(post.createdAt)}</span>
                                           <span className="text-xs text-zinc-500 block uppercase tracking-wide">{formatTimelineDate(post.createdAt)}</span>
                                           {/* Desktop Timeline Dot */}
                                           <div className="absolute right-[-53px] top-3 w-3 h-3 rounded-full bg-zinc-800 border-2 border-background group-hover:bg-accent transition-colors z-10"></div>
                                      </div>
    
                                      {/* Content */}
                                      <div className="flex-1">
                                          <div className="flex flex-col md:flex-row gap-6 items-start">
                                              <div className="w-full md:w-[240px] aspect-video relative overflow-hidden rounded-sm bg-zinc-900 shrink-0">
                                                  <Image 
                                                      src={post.image} 
                                                      alt={post.title} 
                                                      fill 
                                                      className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                                                  />
                                              </div>
                                              <div>
                                                  <span className="text-xs font-bold text-accent uppercase tracking-wider mb-2 block">{post.category}</span>
                                                  <h3 className="text-2xl font-bold leading-tight mb-3 group-hover:text-zinc-300 transition-colors">
                                                      {post.title}
                                                  </h3>
                                                  <p className="text-zinc-400 font-light leading-relaxed">
                                                      {post.excerpt}
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </Link>
                          ))}
                      </div>

                      <div className="mt-20 flex justify-center">
                          <Link href="/blog">
                             <Button variant="outline" className="w-full md:w-auto px-12 py-4">Load Previous Days</Button>
                          </Link>
                      </div>
                  </div>

                  {/* Sidebar (Sticky) */}
                  <aside className="lg:w-3/12 space-y-12">
                      <NewsletterForm />

                      <div className="border-t border-white/5 pt-8">
                          <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Editors' Picks</h4>
                          <ul className="space-y-4">
                              <li className="text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors leading-relaxed">
                                  The Ethics of Autonomous Weapons Systems
                              </li>
                              <li className="text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors leading-relaxed">
                                  Why Rust is replacing C++ in Defense Tech
                              </li>
                              <li className="text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors leading-relaxed">
                                  Interview: Sam Altman to leave OpenAI?
                              </li>
                          </ul>
                      </div>
                  </aside>

              </div>
          </Container>
      </section>

      {/* 4. Footer CTA */}
      <section className="bg-white text-black py-24">
          <Container>
              <div className="flex flex-col items-center text-center">
                  <h2 className="text-5xl md:text-8xl font-serif font-bold mb-8 tracking-tighter">KnowledgeLog.</h2>
                  <p className="max-w-xl mx-auto text-xl font-light text-zinc-600 mb-12">
                      Exploring the frontiers of technology, design, and culture.
                  </p>
                  <div className="flex gap-8 text-xs font-bold uppercase tracking-widest">
                       <Link href="/about" className="hover:underline">About</Link>
                       <Link href="/contact" className="hover:underline">Contact</Link>
                       <Link href="/careers" className="hover:underline">Careers</Link>
                  </div>
              </div>
          </Container>
      </section>

    </div>
  );
}
