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

// Fetch posts for the landing page
async function getLandingData() {
  try {
    await dbConnect();

    // Latest: 3 latest published posts
    const latest = await Post.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("author", "name image")
      .populate("category", "name")
      .lean();

    return {
      latest: latest.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        category: p.category?.name || "Uncategorized",
        createdAt: p.createdAt.toISOString(),
        author: {
          name: p.author?.name || "Unknown",
          image: p.author?.image || "/placeholder-user.jpg",
        },
      })),
    };
  } catch (error) {
    console.error("Error fetching landing data:", error);
    return {
      latest: [],
    };
  }
}

export const revalidate = 60; // Revalidate every minute

export default async function LandingPage() {
  const { latest } = await getLandingData();

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
      {/* 
        1) Hero / Editorial Introduction
        - 2 Column Grid
        - Updated Image: Abstract Light/Glass
      */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 border-b border-white/5 overflow-hidden">
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

      {/* 3. Latest 3 Articles (Full Color, Clean Grid) */}
      <section className="py-24 bg-[#0A0A0A]">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">
                Recently Published
              </span>
              <h2 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
                Latest <span className="text-zinc-500 italic">Writing</span>
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
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <span className="text-accent text-xs font-bold uppercase tracking-widest">
              Our Philosophy
            </span>
            <p className="text-2xl md:text-3xl font-serif leading-relaxed text-zinc-300 italic">
              "We believe that understanding the world requires patience. In an
              age of instant reactions, we choose reflection, clarity, and
              depth."
            </p>
          </div>
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
