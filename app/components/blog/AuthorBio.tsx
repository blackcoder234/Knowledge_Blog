import Image from "next/image";
import Link from "next/link";
import { Twitter, Linkedin, Github, Globe } from "lucide-react";

interface AuthorBioProps {
  author: {
    name: string;
    title?: string;
    role?: string;
    image: string;
    bannerImage?: string;
    bio?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
      website?: string;
    };
  };
}

export const AuthorBio = ({ author }: AuthorBioProps) => {
  return (
    <div className="rounded-2xl bg-[#0D0D0D] border border-white/5 overflow-hidden my-12 group hover:border-white/10 transition-colors">
      {/* Banner */}
      <div className="h-32 w-full bg-zinc-800 relative">
        {author.bannerImage ? (
          <Image
            src={author.bannerImage}
            alt="Author Banner"
            fill
            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent opacity-60"></div>
      </div>

      <div className="px-8 pb-8 relative">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar - Overlapping */}
          <div className="-mt-12 shrink-0 relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-[#0D0D0D] bg-zinc-800 relative overflow-hidden shadow-xl">
              <Image
                src={author.image}
                alt={author.name}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="pt-2 flex-1 space-y-4 w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h4 className="text-2xl font-serif font-bold text-white leading-tight mb-1">
                  {author.name}
                </h4>
                <p className="text-xs text-accent uppercase tracking-widest font-bold">
                  {author.title || author.role || "Author"}
                </p>
              </div>

              {/* Socials Row (Top Right on Desktop) */}
              <div className="flex items-center gap-3">
                {author.socialLinks?.twitter && (
                  <a
                    href={author.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    title="Twitter"
                  >
                    <Twitter size={16} />
                  </a>
                )}
                {author.socialLinks?.linkedin && (
                  <a
                    href={author.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    title="LinkedIn"
                  >
                    <Linkedin size={16} />
                  </a>
                )}
                {author.socialLinks?.github && (
                  <a
                    href={author.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    title="GitHub"
                  >
                    <Github size={16} />
                  </a>
                )}
                {author.socialLinks?.website && (
                  <a
                    href={author.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    title="Website"
                  >
                    <Globe size={16} />
                  </a>
                )}
              </div>
            </div>

            <p className="text-zinc-400 text-sm leading-relaxed border-b border-white/5 pb-6">
              {author.bio ||
                `An editor and contributor at KnowledgeLog, passionate about unravelling complex topics in ${
                  author.role || "Technology and Science"
                }.`}
            </p>

            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">
                Member since {new Date().getFullYear()}
              </span>
              <Link
                href={`/blog?q=${encodeURIComponent(author.name)}`}
                className="text-white hover:text-accent underline underline-offset-4 decoration-accent/50 hover:decoration-accent transition-all"
              >
                Browse all articles
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
