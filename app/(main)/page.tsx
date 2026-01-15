import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import { NewsletterForm } from "@/app/components/NewsletterForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Subscriber from "@/models/Subscriber";

// Fetch posts for the landing page
async function getLandingData() {
    await dbConnect();
    
    // Featured: Latest published featured post
    const featured = await Post.findOne({ featured: true })
        .sort({ createdAt: -1 })
        .populate('author', 'name image')
        .lean();

    // Latest: 6 latest published posts (excluding the featured one if it exists)
    const query: any = {};
    if (featured) {
        query._id = { $ne: featured._id };
    }

    const latest = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('author', 'name image')
        .lean();

    return { 
        featured: featured ? {
            ...featured,
            _id: featured._id.toString(),
            createdAt: featured.createdAt.toISOString(),
            author: { 
                name: featured.author?.name || 'Unknown', 
                image: featured.author?.image || '/placeholder-user.jpg' 
            }
        } : null,
        latest: latest.map((p: any) => ({
            ...p,
            _id: p._id.toString(),
            createdAt: p.createdAt.toISOString(),
            author: { 
                name: p.author?.name || 'Unknown', 
                image: p.author?.image || '/placeholder-user.jpg' 
            }
        }))
    };
}

export const revalidate = 60; // Revalidate every minute

export default async function LandingPage() {
  const { featured, latest } = await getLandingData();

  // Check session for newsletter pre-filling
  const session = await getServerSession(authOptions);
  let initialEmail = '';
  let isSubscribed = false;

  if (session?.user?.email) {
      initialEmail = session.user.email;
      // Check if already subscribed
      await dbConnect();
      const sub = await Subscriber.findOne({ email: initialEmail });
      if (sub) {
          isSubscribed = true;
      }
  }

  return (
    <div className="bg-background min-h-screen">
        
        {/* Full-screen Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-[#000] to-[#000] opacity-80"></div>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                {/* Animated Grid or Particles could go here */}
            </div>

            <Container className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest animate-fade-in-up">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        The Future of Tech
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1]">
                        Explore the <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-200">Frontier</span> of Human Knowledge.
                    </h1>
                    
                    <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Daily deep dives into Artificial Intelligence, Quantum Mechanics, and Astrophysics. Curated for the curious mind.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <Link href="/blog">
                             <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
                                Start Reading
                            </Button>
                        </Link>
                         <Link href="/about">
                             <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
                                About Us
                            </Button>
                         </Link>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-4 text-xs text-zinc-500 font-medium tracking-wide uppercase">
                        <span>Trusted by engineers at</span>
                        <div className="h-px w-8 bg-zinc-800"></div>
                        <span className="text-zinc-400">Google</span>
                        <span className="text-zinc-400">SpaceX</span>
                        <span className="text-zinc-400">MIT</span>
                    </div>
                </div>

                {/* Hero Feature Card (Glassmorphism) */}
                <div className="relative hidden lg:block perspective-1000 group">
                     <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                     {featured ? (
                         <Link href={`/blog/${featured.slug}`} className="block relative bg-[#0D0D0D] border border-white/10 rounded-2xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-500 shadow-2xl">
                            <div className="relative h-64 w-full">
                                <Image src={featured.image} alt={featured.title} fill className="object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                <div className="absolute top-4 left-4 bg-accent text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Featured
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-white mb-4 line-clamp-2 leading-tight group-hover:text-accent transition-colors">
                                    {featured.title}
                                </h3>
                                <p className="text-zinc-400 line-clamp-3 mb-6">
                                    {featured.excerpt}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full overflow-hidden bg-zinc-800">
                                         <Image src={featured.author.image} alt={featured.author.name} width={32} height={32} className="object-cover" />
                                    </div>
                                    <div className="text-xs">
                                        <p className="text-white font-medium">{featured.author.name}</p>
                                        <p className="text-zinc-500">{new Date(featured.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                         </Link>
                     ) : (
                         <div className="h-96 w-full flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl">
                             <p className="text-zinc-500">No featured posts yet.</p>
                         </div>
                     )}
                </div>
            </Container>
        </section>

        {/* Latest Articles Section */}
        <section className="py-24 border-t border-white/5 bg-[#0A0A0A]">
            <Container>
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Latest Insights</h2>
                        <p className="text-zinc-400">Fresh thinking from our editorial team.</p>
                    </div>
                    <Link href="/blog" className="hidden md:flex items-center text-accent hover:text-white transition-colors text-sm font-bold uppercase tracking-widest gap-2">
                        View All Posts 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {latest.map((post: any) => (
                        <Link key={post._id} href={`/blog/${post.slug}`} className="group block bg-[#121212] border border-white/5 rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300">
                            <div className="relative h-56 w-full overflow-hidden">
                                <Image 
                                    src={post.image} 
                                    alt={post.title} 
                                    fill 
                                    className="object-cover transform group-hover:scale-110 transition duration-700" 
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                <div className="absolute top-4 left-4">
                                     <span className="px-2 py-1 bg-black/80 backdrop-blur text-[10px] font-bold text-white uppercase tracking-wider rounded border border-white/10">
                                        {post.category}
                                     </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{post.readTime || '5 min read'}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors leading-snug">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-zinc-400 line-clamp-2">
                                    {post.excerpt}
                                </p>
                            </div>
                        </Link>
                    ))}
                    {latest.length === 0 && (
                         <div className="col-span-3 text-center py-20 bg-white/5 border border-white/10 rounded-lg">
                             <p className="text-zinc-500">No posts found.</p>
                         </div>
                    )}
                </div>

                <div className="mt-12 text-center md:hidden">
                    <Link href="/blog">
                         <Button variant="outline" className="w-full">View All Posts</Button>
                    </Link>
                </div>
            </Container>
        </section>

        {/* Newsletter Section */}
        <section className="py-24 border-t border-white/5 bg-[#000000] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <Container className="relative z-10 max-w-4xl mx-auto text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Stay Ahead of the Curve</h2>
                <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
                    Get a weekly curation of the most significant breakthroughs in technology and science, delivered straight to your inbox. No spam, ever.
                </p>
                
                <div className="bg-[#121212] border border-white/10 p-2 rounded-xl max-w-md mx-auto relative shadow-2xl">
                     <NewsletterForm initialEmail={initialEmail} isSubscribed={isSubscribed} />
                </div>

                <div className="mt-8 text-xs text-zinc-600">
                    By subscribing, you agree to our Privacy Policy and Terms of Service.
                </div>
            </Container>
        </section>
    </div>
  );
}
