import { Container } from "@/app/components/ui/Container";
import Image from "next/image";
import { TableOfContents } from "@/app/components/TableOfContents";
import { BlogCard } from "@/app/components/BlogCard";
import { Button } from "@/app/components/ui/Button";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import { notFound } from "next/navigation";
import { CommentsSection } from "@/app/components/blog/CommentsSection";
import { SocialShare } from "@/app/components/blog/SocialShare";

import { Metadata } from "next";

export const revalidate = 60;
export const dynamicParams = true; // Allow new posts not generated at build time

export async function generateStaticParams() {
  await dbConnect();
  const posts = await Post.find({ status: "published" }).select("slug").lean();

  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || post.title;
  const image = post.ogImage || post.image;
  const canonical =
    post.canonicalUrl || `https://knowledgelog.blog/blog/${slug}`;
  const robots: Metadata["robots"] = post.noindex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      };

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [image],
      type: "article",
      url: canonical,
      publishedTime: post.createdAt
        ? new Date(post.createdAt).toISOString()
        : undefined,
      modifiedTime: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : undefined,
      authors: [post.author?.name || "KnowledgeLog Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [image],
    },
    alternates: {
      canonical: canonical,
    },
    robots: robots,
  };
}

// Fetch post by slug
async function getPost(slug: string) {
  await dbConnect();
  const post = await Post.findOne({ slug }).lean();
  return post;
}

// Fetch related posts (simple logic: same category, different ID)
async function getRelatedPosts(category: string, currentId: any) {
  await dbConnect();
  const related = await Post.find({
    category,
    _id: { $ne: currentId },
    status: "published",
  })
    .limit(3)
    .lean();
  return related;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { NewsletterForm } from "@/app/components/NewsletterForm";
import Subscriber from "@/models/Subscriber";
import { ViewCounter } from "@/app/components/blog/ViewCounter";
import { ReadingProgress } from "@/app/components/blog/ReadingProgress";
import { AuthorBio } from "@/app/components/blog/AuthorBio";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  const session = await getServerSession(authOptions);

  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "admin";
  const canPreview = ["admin", "super_admin", "editor"].includes(userRole);

  if (!post) {
    notFound();
  }

  // Hide unpublished posts from public
  if (post.status !== "published" && !canPreview) {
    notFound();
  }

  let initialEmail = "";
  let isSubscribed = false;

  if (session?.user?.email) {
    initialEmail = session.user.email;
    // Check if already subscribed
    await dbConnect();
    const sub = await Subscriber.findOne({ email: initialEmail });
    if (sub) {
      isSubscribed = true;
    }
  }

  const relatedPosts = await getRelatedPosts(post.category, post._id);

  return (
    <div className="bg-background min-h-screen pt-20">
      <ReadingProgress />
      <ViewCounter slug={slug} />
      {/* Full Width Hero */}
      <div className="relative w-full h-[500px]">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <Container className="relative h-full flex flex-col justify-end pb-16">
          <div className="flex justify-between items-end mb-4">
            <div className="inline-block rounded-full border border-accent/50 bg-accent/10 px-4 py-1 text-sm font-medium text-accent backdrop-blur-md">
              {post.category}
            </div>
            {isAdmin && (
              <Link href={`/admin/posts/${post._id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/50 backdrop-blur border-white/20 hover:bg-black/70"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Post
                </Button>
              </Link>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6 max-w-4xl leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden border border-white/20 relative">
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-white font-medium">{post.author.name}</p>
                <p className="text-xs text-muted">{post.author.role}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-sm text-muted">
              <p>{new Date(post.createdAt).toLocaleDateString()}</p>
              <p>{post.readTime}</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <article className="lg:col-span-8">
            {/* Intro (Bold) */}
            <p className="text-xl font-medium text-white/90 mb-10 border-b border-white/10 pb-10 leading-relaxed">
              {post.excerpt}
            </p>

            <div
              className="prose prose-invert prose-lg text-zinc-300 prose-headings:font-serif prose-headings:text-white prose-headings:font-medium prose-strong:text-white prose-blockquote:border-l-accent prose-blockquote:bg-white/5 prose-blockquote:py-4 prose-blockquote:pl-6 prose-blockquote:not-italic prose-code:text-accent prose-code:bg-white/5 prose-code:p-1 prose-code:rounded ProseMirror"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <AuthorBio author={post.author} />

            {/* Tags & Share */}
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-2">
                {post.tags &&
                  post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-white/5 text-sm text-zinc-400 hover:text-white cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
              <div className="flex gap-4">
                <SocialShare
                  url={`https://knowledgelog.blog/blog/${slug}`}
                  title={post.title}
                  postId={post._id.toString()}
                  initialLikes={post.likes || 0}
                  layout="horizontal"
                />
              </div>
            </div>

            <CommentsSection postId={post._id.toString()} />
          </article>

          <aside className="lg:col-span-4 space-y-12 h-fit sticky top-24">
            {/* Table of Contents */}
            <div className="hidden lg:block">
              <TableOfContents />
            </div>

            {/* Newsletter Widget - Premium Look */}
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-black p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-accent/10 transition-colors"></div>
              <h4 className="text-xl font-serif font-medium text-white mb-2 relative z-10">
                KnowledgeLog Weekly
              </h4>
              <p className="text-sm text-zinc-400 mb-6 relative z-10 leading-relaxed">
                Join 50k+ readers. Get the Sunday digest of our best stories.
              </p>
              <div className="relative z-10">
                <NewsletterForm
                  initialEmail={initialEmail}
                  isSubscribed={isSubscribed}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-24">
            <h3 className="text-2xl font-bold text-white mb-8">Similar News</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((related: any) => (
                <BlogCard
                  key={related._id}
                  post={{
                    slug: related.slug,
                    title: related.title,
                    excerpt: related.excerpt,
                    date: new Date(related.createdAt).toLocaleDateString(),
                    category: related.category,
                    imageUrl: related.image,
                    likes: related.likes,
                    views: related.views,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
