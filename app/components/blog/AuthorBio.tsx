import Image from "next/image";
import Link from "next/link";

interface AuthorBioProps {
  author: {
    name: string;
    role: string;
    image: string;
    bio?: string; // We might need to add bio to User model later, for now optional
  };
}

export const AuthorBio = ({ author }: AuthorBioProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-8 rounded-2xl bg-white/5 border border-white/5 my-12">
      <div className="relative shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 border-accent/20">
        <Image
          src={author.image}
          alt={author.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="text-center md:text-left space-y-2">
        <h4 className="text-xl font-serif text-white font-medium">
          Written by <span className="text-accent">{author.name}</span>
        </h4>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
          {author.role}
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
          {author.bio ||
            `An editor and contributor at KnowledgeLog, passionate about unravelling complex topics in ${author.role || "Technology and Science"}.`}
        </p>
        <div className="pt-2">
          <Link
            href={`/blog?q=${author.name}`}
            className="text-xs text-white hover:text-accent underline underline-offset-4"
          >
            View all posts by {author.name}
          </Link>
        </div>
      </div>
    </div>
  );
};
