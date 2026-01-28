import { Container } from "@/app/components/ui/Container";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import Category from "@/models/Category";
import User from "@/models/User";
import { NewsletterForm } from "@/app/components/NewsletterForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Subscriber from "@/models/Subscriber";

import Setting from "@/models/Setting";

// Fetch posts for the landing page
async function getLandingData() {
  try {
    await dbConnect();

    // Fetch Quote Settings
    const settings = await Setting.find({
      key: { $in: ["home_quote_text", "home_quote_author", "home_quote_link"] },
    });
    const config = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const quote = {
      text:
        config.home_quote_text ||
        "When information is everywhere, understanding becomes rare. KnowledgeLog slows the pace, inviting readers to think, question, and connect ideas across science, history, and culture — not to follow trends, but to build perspective.",
      author: config.home_quote_author || "KnowledgeLog Editorial",
      link: config.home_quote_link || "/blog",
    };

    // Featured: 3 featured (or trending) posts for maximum attraction
    let posts = await Post.find({ status: "published", featured: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("author", "name image")
      .populate("category", "name")
      .lean();

    // Fallback: If no featured posts, use popular posts (views)
    if (posts.length < 3) {
      const popular = await Post.find({
        status: "published",
        _id: { $nin: posts.map((p: any) => p._id) },
      })
        .sort({ views: -1 })
        .limit(3 - posts.length)
        .populate("author", "name image")
        .populate("category", "name")
        .lean();
      posts = [...posts, ...popular];
    }

    // Final Fallback: Latest
    if (posts.length < 3) {
      const latest = await Post.find({
        status: "published",
        _id: { $nin: posts.map((p: any) => p._id) },
      })
        .sort({ createdAt: -1 })
        .limit(3 - posts.length)
        .populate("author", "name image")
        .populate("category", "name")
        .lean();
      posts = [...posts, ...latest];
    }

    // Trending: Fetch top 5 viewed posts for ticker
    const trending = await Post.find({ status: "published" })
      .sort({ views: -1 })
      .limit(5)
      .select("title slug")
      .lean();

    // Authors: Fetch top 4 authors with most posts or specific roles
    const authors = await User.find({
      role: { $in: ["admin", "super_admin", "editor"] },
    })
      .select("name image bio _id")
      .limit(4)
      .lean();

    return {
      latest: posts.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        category: p.category?.name || "Uncategorized",
        createdAt: p.createdAt.toISOString(),
        author: {
          name: p.author?.name || "Unknown",
          image: p.author?.image || "/placeholder-user.jpg",
        },
      })),
      trending: trending.map((p: any) => ({
        title: p.title,
        slug: p.slug,
      })),
      quote,
      authors: authors.map((a: any) => ({
        ...a,
        _id: a._id.toString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching landing data:", error);
    return {
      latest: [],
      trending: [],
      quote: {
        text: "Error loading quote.",
        author: "System",
        link: "#",
      },
      authors: [],
    };
  }
}

export const revalidate = 60; // Revalidate every minute

import { TrendingTicker } from "@/app/components/ui/TrendingTicker";

export default async function LandingPage() {
  const { latest, trending, quote, authors } = await getLandingData();

  // Check session for newsletter pre-filling
  const session = await getServerSession(authOptions);
  let initialEmail = "";
  let isSubscribed = false;

  if (session?.user?.email) {
    initialEmail = session.user.email;
    await dbConnect();
    const sub = await Subscriber.findOne({ email: initialEmail });
    if (sub) {
      isSubscribed = true;
    }
  }

  return (
    <div className="bg-background min-h-screen">
      {/* 0. Trending Ticker */}
      <TrendingTicker posts={trending} />

      {/* 
        1) Hero / Editorial Introduction
        - 2 Column Grid
        - Updated Image: Abstract Light/Glass
      */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 border-b border-white/5 overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="z-10 order-2 lg:order-1">
              <h1 className="text-5xl md:text-7xl font-serif font-medium text-white tracking-tight leading-[1.1] mb-8">
                Clarity in a generic <br />
                <span className="italic text-zinc-400">world of noise.</span>
              </h1>

              <p className="text-xl md:text-2xl text-zinc-300 font-light leading-relaxed max-w-lg text-balance mb-10">
                KnowledgeLog explores the intersections of technology, science,
                and culture. We prioritize depth over speed and explanation over
                sensation.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="#recent-writing">
                  <Button
                    size="lg"
                    className="rounded-full text-base font-medium px-8"
                  >
                    Start Reading
                  </Button>
                </Link>
                <Link href="/about">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full text-base font-medium px-8 border-white/20 hover:bg-white/10"
                  >
                    Our Mission
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Image - Conceptual Theme: Abstract Light/Structure */}
            <div className="relative order-1 lg:order-2 h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-accent/5 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent z-10 pointer-events-none"></div>
              <Image
                src="/images/hero_floating_pages.png"
                alt="Clarity in Noise - Architectural"
                fill
                className="object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000 ease-in-out"
                priority
              />
            </div>
          </div>

          {/* Background Glow */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none opacity-40 mix-blend-screen"></div>
        </Container>
      </section>

      {/* 2. Topics Strip (Interactive Pills) */}
      <section className="border-b border-white/5 bg-[#050505]">
        <Container>
          <div className="py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
              Browse by Topic:
            </span>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { name: "Technology", icon: "⚡" },
                { name: "Science", icon: "🧬" },
                { name: "Culture", icon: "🗣️" },
                { name: "Philosophy", icon: "👁️" },
              ].map((topic) => (
                <Link
                  key={topic.name}
                  href={`/blog?genre=${topic.name}`}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:border-accent/50 bg-[#0A0A0A] hover:bg-accent/10 transition-all"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">
                    {topic.icon}
                  </span>
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                    {topic.name}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/blog"
              className="text-xs text-accent hover:underline decoration-accent underline-offset-4 uppercase tracking-widest font-bold"
            >
              View All Categories &rarr;
            </Link>
          </div>
        </Container>
      </section>

      {/* 2.5 Featured Quote Section (New) */}
      <section className="py-24 bg-zinc-950 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <Container>
          <div className="max-w-6xl mx-auto text-center relative z-10">
            {/* Quote Mark */}
            <span className="block text-7xl text-accent/25 font-serif leading-none mb-6">
              “
            </span>

            {/* Main Quote Text - Font Serif (Lora) */}
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif text-zinc-100 font-normal leading-relaxed tracking-wide mb-10 text-balance italic">
              "{quote.text}"
            </blockquote>

            {/* Citation - Font Sans (Inter/Space) */}
            <cite className="not-italic flex flex-col items-center gap-2">
              <span className="w-12 h-px bg-accent/50 mb-2"></span>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-accent font-sans">
                {quote.author}
              </span>
            </cite>

            {quote.link && quote.link !== "#" && (
              <div className="mt-12">
                <Link
                  href={quote.link}
                  className="text-xs font-medium uppercase tracking-widest border-b border-zinc-700 text-zinc-500 hover:text-white hover:border-white transition-all pb-1 font-sans"
                >
                  Read the Full Manifesto
                </Link>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* 3. Featured Stories (Simple Grid) */}
      <section className="py-24 bg-[#0A0A0A]" id="recent-writing">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">
                Editor's Choice
              </span>
              <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
                Featured <span className="text-zinc-500 italic">Stories</span>
              </h2>
            </div>
            <Link
              href="/blog"
              className="px-6 py-2 rounded-full border border-white/10 text-sm font-medium text-white hover:bg-white hover:text-black transition-all"
            >
              View Archive &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latest.map((post: any) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl mb-6 bg-zinc-900 border border-white/5 shadow-2xl">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold text-white border border-white/10 rounded-full shadow-lg">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3 font-medium">
                    <span className="text-accent">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span>{post.readTime || "5 min read"}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors leading-tight mb-3">
                    {post.title}
                  </h3>
                  <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Philosophy Section */}
      <section className="py-20 bg-[#050505] border-y border-white/5">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-20">
            <span className="text-accent text-xs font-bold uppercase tracking-widest">
              Our Philosophy
            </span>
            <p className="text-2xl md:text-3xl font-serif leading-relaxed text-zinc-300 italic">
              "We believe that understanding the world requires patience. In an
              age of instant reactions, we choose reflection, clarity, and
              depth."
            </p>
          </div>

          {/* FUTURE: Our Voices / Writers - Uncomment when data is available
           {authors.length > 0 && (
               <div className="border-t border-white/5 pt-16">
                   <h3 className="text-center text-sm font-bold text-zinc-500 uppercase tracking-widest mb-10">
                       Our Voices
                   </h3>
                   <div className="flex flex-wrap justify-center gap-12 md:gap-20">
                       {authors.map((author: any) => (
                           <div key={author._id} className="text-center group">
                               <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-accent transition-colors">
                                   <Image 
                                        src={author.image || "/placeholder-user.jpg"} 
                                        alt={author.name} 
                                        fill 
                                        className="object-cover"
                                    />
                               </div>
                               <h4 className="text-white font-bold group-hover:text-accent transition-colors">
                                   {author.name}
                               </h4>
                               <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wide">
                                   Editor
                               </p>
                           </div>
                       ))}
                   </div>
               </div>
           )}
           */}
        </Container>
      </section>

      {/* 5. Impact / Stats Section */}
      <section className="py-20 border-b border-white/5 bg-[#050505]">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 font-display">
                50k+
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Monthly Readers
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 font-display">
                120+
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Countries Reach
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 font-display">
                500+
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Articles Published
              </div>
            </div>
            <div className="p-4">
              <div className="text-4xl md:text-5xl font-black text-white mb-2 font-display">
                Top 10
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Tech Blogs 2024
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. Newsletter Section (Clean & Minimal) */}
      <section
        id="newsletter"
        className="py-24 border-t border-white/5 bg-black relative overflow-hidden"
      >
        <Container className="relative z-10 max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-serif text-white mb-4">Stay Updated</h2>
          <p className="text-zinc-400 mb-8 font-light leading-relaxed">
            Join our readership. We send one email per week with our latest
            essays and notes. No spam, ever.
          </p>

          <div className="max-w-md mx-auto">
            <NewsletterForm
              initialEmail={initialEmail}
              isSubscribed={isSubscribed}
            />
          </div>
        </Container>
      </section>
    </div>
  );
}
