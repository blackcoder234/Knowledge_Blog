import { Container } from './ui/Container';
import { Button } from './ui/Button';

export const Hero = () => {
  const categories = [
    { title: "Quantum Computing", icon: "⚛️" },
    { title: "AI Ethics", icon: "🤖" },
    { title: "Space Tech", icon: "🚀" },
    { title: "Biotech", icon: "🧬" },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients/Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

      <Container className="relative z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 pr-4 backdrop-blur-sm">
            <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Welcome to the Future
            </span>
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-6">
          Future Tech <span className="text-accent">Revolution</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl text-lg text-muted mb-10 leading-relaxed">
          Explore the cutting-edge developments in artificial intelligence, quantum computing, 
          and the technologies shaping our tomorrow.
        </p>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          {categories.map((cat) => (
            <div 
              key={cat.title} 
              className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-accent/50 cursor-pointer"
            >
              <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{cat.title}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
