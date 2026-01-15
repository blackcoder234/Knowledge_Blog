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

  // Latest: 3 latest published posts (no featured logic needed per new design)
  const latest = await Post.find({})
    .sort({ createdAt: -1 })
    .limit(3)
    .populate("author", "name image")
    .lean();

  return {
    latest: latest.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt.toISOString(),
      author: {
        name: p.author?.name || "Unknown",
        image: p.author?.image || "/placeholder-user.jpg",
      },
    })),
  };
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
      {/* 1. Balanced Hero Section (Text Left, Visual Right) */}
      {/* 1. Balanced Hero Section (Text Left, Visual Right) */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 border-b border-white/5 overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <h1 className="text-5xl md:text-7xl font-serif font-medium text-white tracking-tight leading-[1.1]">
                Perspectives on the <br />
                <span className="italic text-zinc-400">future directly.</span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-400 max-w-lg leading-relaxed font-light">
                A collection of essays and notes on{" "}
                <span className="text-zinc-200">Technology</span>,{" "}
                <span className="text-zinc-200">Science</span>, and{" "}
                <span className="text-zinc-200">Culture</span>. Deep dives into
                the ideas shaping our world.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/blog">
                  <Button
                    size="lg"
                    className="h-14 px-8 rounded-full text-lg bg-white text-black hover:bg-zinc-200 font-medium tracking-wide transition-all"
                  >
                    Start Reading
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Side Visual - Abstract Tech/Organic Image */}
            <div className="relative h-[400px] md:h-[600px] w-full hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-[100px] -z-10"></div>
              <Image
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
                alt="Abstract Form"
                fill
                className="object-contain opacity-90 grayscale hover:grayscale-0 transition-all duration-1000"
                priority
              />
            </div>
          </div>
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

      {/* 4. Impact / Stats Section (New) */}
      {/* 4. Purpose / Mission Statement (Replaces Stats) */}
      <section className="py-24 border-y border-white/5 bg-[#050505]">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h3 className="text-2xl md:text-3xl font-serif leading-relaxed text-zinc-200">
              "KnowledgeLog exists to separate signal from noise. We explore the
              intersections of logic and creativity, bringing you thoughtful
              analysis on the things that matter."
            </h3>
            <div className="w-16 h-px bg-accent/50 mx-auto"></div>
          </div>
        </Container>
      </section>

      {/* 5. Newsletter Section (Clean & Minimal) */}
      <section
        id="newsletter"
        className="py-32 border-t border-white/5 bg-black relative overflow-hidden"
      >
        <Container className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-6">
            Weekly Digest
          </h2>
          <p className="text-base text-zinc-400 mb-10 leading-relaxed font-light">
            One email per week. No algorithms, just new ideas.
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
