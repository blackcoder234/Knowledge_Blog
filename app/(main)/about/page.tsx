import { Container } from "../../components/ui/Container";
import { Button } from "../../components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Globe, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "About KnowledgeLog | Our Mission",
  description:
    "We are a collective of writers, not content farmers. Read about our mission to explore science, technology, and culture with depth and clarity.",
};

const teamMembers = [
  {
    name: "Amarnath Bera",
    role: "Founder & Editor-in-Chief",
    bio: "Amarnath is a software engineer and writer who believes in the power of clear communication. He founded KnowledgeLog to create a space where complex ideas across science, technology, and culture could be explored with depth and nuance.",
    image: "/images/Amarnath_Bera.jpg",
    website: "https://amaranathbera.in",
    socials: {
      website: "https://amaranathbera.in",
      github: "https://github.com/blackcoder234",
      twitter: "https://x.com/beraamarnath5",
      linkedin: "https://www.linkedin.com/in/amarnath-bera/",
    },
  },
];

const values = [
  {
    title: "Write to Understand",
    desc: "We write primarily to clarify our own thinking. Sharing comes second.",
  },
  {
    title: "Depth Over Hype",
    desc: "We avoid trends for the sake of attention. If something matters, it will still matter tomorrow.",
  },
  {
    title: "Practical Curiosity",
    desc: "Ideas are valuable when they connect to real understanding — whether technical, conceptual, or personal.",
  },
  {
    title: "Responsible Technology",
    desc: "We respect privacy, sustainability, and long-term impact. Technology should help people think better, not faster.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen pt-20">
      {/* 1. Hero Section: Mission Statement */}
      <section className="py-24 md:py-32 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10"></div>
        <Container>
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent font-bold tracking-widest text-xs uppercase border border-accent/20 mb-4">
              The Knowledge Engine
            </span>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight tracking-tight">
              A place to write, think, and learn —{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-500">
                slowly and clearly.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              We believe the best learning happens when ideas are written down,
              revisited, and refined. KnowledgeLog is a growing collection of
              notes, explanations, and reflections — written to understand, not
              to impress.
            </p>
          </div>
        </Container>
      </section>

      {/* 2. Stats / Authority Bar */}
      <div className="border-b border-white/5 py-16 bg-[#0A0A0A]">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/5">
            {[
              { label: "Writings Published", value: "150k+" },
              { label: "Topics Explored", value: "10k" },
              { label: "Contributors", value: "500+" },
              { label: "Started in", value: "2025" },
            ].map((stat, i) => (
              <div key={i} className="px-4">
                <div className="text-4xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* 3. Our Story / Narrative */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] -z-10" />
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[600px] rounded-3xl overflow-hidden group shadow-2xl border border-white/10 order-2 lg:order-1">
              <Image
                src="/images/about-editorial.png"
                alt="Workspace with books and laptop"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            <div className="space-y-8 order-1 lg:order-2">
              <h2 className="text-4xl font-serif font-bold text-white">
                Not a Content Farm. <br />A Sanctuary for Thought.
              </h2>
              <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                <p>
                  In a digital landscape flooded with instant reactions and
                  infinite feeds, <strong>KnowledgeLog</strong> is a pause
                  button.
                </p>
                <p>
                  We are a collective of writers, engineers, and thinkers who
                  realized that the most valuable insights aren't found in
                  breaking news notifications, but in slow, deliberate
                  exploration.
                </p>
                <p>
                  Our mission is simple: To curate a space where complex
                  ideas—from the ethics of AI to the philosophy of science—can
                  be unpacked with the depth they deserve. We don't chase
                  clicks; we chase clarity.
                </p>
              </div>
              <div className="pt-4 flex gap-4">
                <Link href="/blog">
                  <Button variant="outline" size="lg">
                    Read Our Latest Essays
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Our Values (Cards) */}
      <section className="py-24 bg-[#080808] border-y border-white/5">
        <Container>
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              How We Think and Write
            </h2>
            <p className="text-zinc-400">
              These principles guide everything published on KnowledgeLog
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, i) => (
              <div
                key={i}
                className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 shadow-lg group"
              >
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-black transition-colors">
                  <span className="font-bold text-accent group-hover:text-black">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
                  {val.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. Team Section */}
      <section className="py-24">
        <Container>
          <div className="mb-16 text-center border-b border-white/5 pb-10 max-w-2xl mx-auto">
            <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">
              Creator
            </span>
            <h2 className="text-4xl font-serif font-bold text-white mb-4">
              Meet the Creator
            </h2>
            <p className="text-zinc-400 text-lg">
              Dedicated to thoughtful curation, clarity, and code.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {teamMembers.map((member, i) => (
              <div
                key={i}
                className="bg-[#121212] border border-white/5 rounded-2xl p-8 md:p-10 flex flex-col items-center text-center hover:border-white/10 transition-colors shadow-2xl relative overflow-hidden"
              >
                <div className="relative h-44 w-44 mb-6 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl ring-2 ring-accent/20">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-accent font-medium text-sm tracking-wide uppercase mb-3">
                  {member.role}
                </p>

                {/* Personal Website Link */}
                <Link
                  href={member.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-accent hover:text-white hover:bg-white/10 hover:border-accent/40 transition-all duration-200 mb-6 group"
                >
                  <Globe size={13} className="text-accent group-hover:scale-110 transition-transform" />
                  <span>amaranathbera.in</span>
                  <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                </Link>

                <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8">
                  {member.bio}
                </p>

                <div className="flex gap-6 justify-center w-full pt-6 border-t border-white/5">
                  {member.socials.website && (
                    <Link
                      href={member.socials.website}
                      className="text-zinc-500 hover:text-accent transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Personal Website"
                    >
                      <span className="sr-only">Website</span>
                      <Globe className="w-5 h-5" />
                    </Link>
                  )}
                  {member.socials.github && (
                    <Link
                      href={member.socials.github}
                      className="text-zinc-500 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="sr-only">GitHub</span>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </Link>
                  )}
                  {member.socials.twitter && (
                    <Link
                      href={member.socials.twitter}
                      className="text-zinc-500 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="sr-only">Twitter</span>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </Link>
                  )}
                  {member.socials.linkedin && (
                    <Link
                      href={member.socials.linkedin}
                      className="text-zinc-500 hover:text-white transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="sr-only">LinkedIn</span>
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. Footer CTA Area */}
      <section className="py-24 border-t border-white/5 bg-[#0A0A0A] relative text-center">
        <Container className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">
            Write. Think. Learn.
          </h2>
          <p className="text-zinc-400 mb-10 max-w-xl mx-auto">
            Join the conversation. Get the latest essays and notes delivered to
            your inbox.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/blog">
              <Button variant="primary" size="lg" className="px-10 py-6">
                Start Exploring
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
