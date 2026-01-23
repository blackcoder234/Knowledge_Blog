import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Twitter, Linkedin, Github } from "lucide-react";

interface AuthorBioProps {
  author: {
    _id: string;
    name: string;
    role?: string;
    title?: string;
    image: string;
    bio?: string;
    articleSignature?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
  authorPosts?: any[]; // Allow passing recent posts by author
}

export const AuthorBio = ({ author, authorPosts = [] }: AuthorBioProps) => {
  const defaultSignature = `${author.name} is a contributor at KnowledgeLog, exploring the intersection of modern technology, scientific discovery, and human philosophy.`;

  return (
    <div className="mt-24 space-y-12 text-left">
      {/* Minimalist Signature */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 py-12 border-y border-white/5">
        <Link
          href={`/blog?author=${author._id}`}
          className="shrink-0 group cursor-pointer relative"
        >
          <div className="w-24 h-24 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 ring-1 ring-white/10 group-hover:ring-accent/40 shadow-2xl">
            <Image
              src={author.image}
              alt={author.name}
              fill
              className="object-cover"
            />
          </div>
        </Link>

        <div className="flex-1 text-center md:text-left space-y-5">
          <div>
            <h4 className="text-2xl font-serif font-bold text-white mb-1">
              {author.name}
            </h4>
            <p className="text-xs text-accent uppercase tracking-[0.2em] font-bold opacity-80">
              {author.title || author.role || "Contributor"}
            </p>
          </div>

          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl font-light italic">
            "{author.articleSignature || author.bio || defaultSignature}"
          </p>

          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
            <Link
              href={`/blog?author=${author._id}`}
              className="text-xs font-bold text-white uppercase tracking-wider hover:text-accent transition-colors flex items-center gap-2 group/btn"
            >
              Browse Library{" "}
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>

            <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
              {author.socialLinks?.twitter && (
                <a
                  href={author.socialLinks.twitter}
                  target="_blank"
                  className="hover:text-white transition-colors"
                >
                  <Twitter size={14} />
                </a>
              )}
              {author.socialLinks?.linkedin && (
                <a
                  href={author.socialLinks.linkedin}
                  target="_blank"
                  className="hover:text-white transition-colors"
                >
                  <Linkedin size={14} />
                </a>
              )}
              {author.socialLinks?.github && (
                <a
                  href={author.socialLinks.github}
                  target="_blank"
                  className="hover:text-white transition-colors"
                >
                  <Github size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Author Shelf (Recent Writing) */}
      {authorPosts.length > 0 && (
        <div className="space-y-6">
          <h5 className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-600">
            More by {author.name.split(" ")[0]}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authorPosts.slice(0, 2).map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent/20 hover:bg-white/[0.04] transition-all flex gap-4 items-center"
              >
                <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-zinc-900 relative">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="space-y-1">
                  <h6 className="text-zinc-200 text-sm font-medium line-clamp-2 leading-snug group-hover:text-white transition-colors">
                    {post.title}
                  </h6>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
