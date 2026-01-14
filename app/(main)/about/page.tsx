import { Container } from "../../components/ui/Container";
import { Button } from "../../components/ui/Button";
import Image from "next/image";

const teamMembers = [
  {
    name: "Alex Rivera",
    role: "Founder & CEO",
    bio: "Former SpaceX engineer with a passion for sustainable energy and AI. obsessively curious about the future.",
    image: "https://placehold.co/400x500/111/FFF?text=Alex",
    socials: { twitter: "#", linkedin: "#" }
  },
  {
    name: "Sarah Chen",
    role: "Chief Technology Officer",
    bio: "PhD in Quantum Computing. Leading our technical vision to bridge the gap between today's web and tomorrow's reality.",
    image: "https://placehold.co/400x500/151515/FFF?text=Sarah",
    socials: { twitter: "#", github: "#" }
  },
  {
    name: "Marcus Johnson",
    role: "Head of Design",
    bio: "Award-winning product designer believing that technology should be invisible, intuitive, and accessible to everyone.",
    image: "https://placehold.co/400x500/222/FFF?text=Marcus",
    socials: { twitter: "#", dribbble: "#" }
  }
];

const values = [
    { title: "Radical Transparency", desc: "We believe in open source, open books, and open communication." },
    { title: "First-Principles Thinking", desc: "We don't just follow trends; we deconstruct problems to find the best solutions." },
    { title: "Long-Term Optimism", desc: "We are building for a future we want to live in, not just for the next quarter." },
    { title: "Design for Humanity", desc: "Technology serves people, not the other way around." }
];

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen pt-20">
      
      {/* 1. Hero Section: Mission Statement */}
      <section className="py-24 md:py-32 border-b border-white/5 relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/10 rounded-full blur-[120px] -z-10"></div>
         <Container>
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <span className="text-accent font-bold tracking-widest text-sm uppercase">Our Mission</span>
                <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                    We are exploring the <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">frontiers of technology</span> to inspire the next generation of builders.
                </h1>
                <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                    KnowledgeLog isn't just a blog; it's a compass for navigating the accelerating pace of innovation. From AI to space travel, we cover what matters.
                </p>
            </div>
         </Container>
      </section>

      {/* 2. Stats / Trust Bar */}
      <div className="border-b border-white/5 py-12 bg-white/[0.02]">
        <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                    { label: "Monthly Readers", value: "2M+" },
                    { label: "Countries Reached", value: "150+" },
                    { label: "Articles Published", value: "5000+" },
                    { label: "Years Active", value: "10" }
                ].map((stat, i) => (
                    <div key={i}>
                        <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                        <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>
        </Container>
      </div>

      {/* 3. Our Story / Narrative */}
      <section className="py-24">
        <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="relative h-[500px] rounded-2xl overflow-hidden group">
                    <Image 
                        src="https://placehold.co/800x1000/111/FFF?text=Our+Journey" 
                        alt="Office Culture" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105 grayscale hover:grayscale-0" 
                    />
                </div>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-white">From a Garage to a Global Voice</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed">
                        <p>
                            It started in 2014 with a simple question: "What comes next?" Three engineers sat in a cramped garage, debating the implications of deep learning and reusable rockets. They realized the world needed a place where complex tech wasn't just reported, but explained and contextualized.
                        </p>
                        <p>
                            Over the last decade, we've grown from a niche newsletter to a global media platform. We've broken stories on quantum breakthroughs, interviewed tech titans, and charted the course of the metaverse.
                        </p>
                        <p>
                            But our core remains the same: radical curiosity and a commitment to truth. We don't just hype the future; we help you understand it.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Button variant="outline">Read Our Manifesto</Button>
                    </div>
                </div>
            </div>
        </Container>
      </section>

      {/* 4. Our Values */}
      <section className="py-24 bg-card border-y border-white/5">
         <Container>
            <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Our Core Values</h2>
                <p className="text-zinc-400">The principles that guide every article we write and every line of code we ship.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((val, i) => (
                    <div key={i} className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-accent/30 transition-colors group">
                        <h3 className="text-xl font-bold text-white mb-4 group-hover:text-accent transition-colors">{val.title}</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">{val.desc}</p>
                    </div>
                ))}
            </div>
         </Container>
      </section>

      {/* 5. Team Section */}
      <section className="py-24">
         <Container>
            <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Meet the Builders</h2>
                <p className="text-zinc-400">The diverse minds behind KnowledgeLog.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {teamMembers.map((member, i) => (
                    <div key={i} className="group relative">
                        <div className="relative h-[400px] w-full rounded-2xl overflow-hidden bg-zinc-800 border border-white/5">
                            <Image 
                                src={member.image} 
                                alt={member.name} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>
                            
                            {/* Content */}
                            <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>
                                <p className="text-accent font-medium text-sm mb-4">{member.role}</p>
                                <p className="text-zinc-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 mb-4 line-clamp-3">
                                    {member.bio}
                                </p>
                                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200">
                                    {Object.entries(member.socials).map(([platform, link]) => (
                                        <a key={platform} href={link} className="text-zinc-400 hover:text-white capitalize text-xs font-bold tracking-wider">
                                            {platform}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </Container>
      </section>

      {/* 6. CTA */}
      <section className="py-20 border-t border-white/10 text-center">
          <Container>
              <h2 className="text-3xl font-bold text-white mb-6">Want to shape the future with us?</h2>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto">We are always looking for curious minds to join our editorial and engineering teams.</p>
              <Button variant="primary" className="px-8">View Open Positions</Button>
          </Container>
      </section>

    </div>
  );
}
