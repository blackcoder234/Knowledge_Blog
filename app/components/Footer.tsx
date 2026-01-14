import Link from 'next/link';
import { Container } from './ui/Container';

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="text-2xl font-bold tracking-tight text-white mb-2">
                KnowledgeLog
            </Link>
            <p className="text-sm text-muted leading-relaxed">
                Exploring the frontiers of technology. We cover the latest in AI, space exploration, and quantum mechanics to keep you ahead of the curve.
            </p>
            <div className="flex gap-4 mt-2">
                {/* Social Icons Placeholder */}
                {['X', 'Li', 'Md'].map((social) => (
                    <a key={social} href="#" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs text-white hover:bg-accent hover:text-black transition-colors">
                        {social}
                    </a>
                ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-white mb-6">Explore</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted">
                <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
                <li><Link href="/news" className="hover:text-accent transition-colors">Latest News</Link></li>
                <li><Link href="/podcasts" className="hover:text-accent transition-colors">Podcasts</Link></li>
                <li><Link href="/trending" className="hover:text-accent transition-colors">Trending</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Categories</h4>
             <ul className="flex flex-col gap-3 text-sm text-muted">
                <li><Link href="/cat/ai" className="hover:text-accent transition-colors">Artificial Intelligence</Link></li>
                <li><Link href="/cat/quantum" className="hover:text-accent transition-colors">Quantum Computing</Link></li>
                <li><Link href="/cat/startups" className="hover:text-accent transition-colors">Tech Startups</Link></li>
                <li><Link href="/cat/ethics" className="hover:text-accent transition-colors">AI Ethics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Resources</h4>
             <ul className="flex flex-col gap-3 text-sm text-muted">
                <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-8 text-xs text-muted">
            <p>&copy; {new Date().getFullYear()} KnowledgeLog. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
        </div>
      </Container>
    </footer>
  );
};
