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

export const revalidate = 60;

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
        _id: { $ne: currentId } 
    })
    .limit(3)
    .lean();
    return related;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
      notFound();
  }

  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'admin';

  const relatedPosts = await getRelatedPosts(post.category, post._id);

  return (
    <div className="bg-background min-h-screen pt-20">
        
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
                            <Button variant="outline" size="sm" className="bg-black/50 backdrop-blur border-white/20 hover:bg-black/70">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Edit Post
                            </Button>
                        </Link>
                    )}
                 </div>

                 <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight">
                    {post.title}
                 </h1>
                 
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                         <div className="h-12 w-12 rounded-full overflow-hidden border border-white/20 relative">
                            <Image src={post.author.image} alt={post.author.name} fill className="object-cover" />
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
                     <p className="text-xl font-medium text-white mb-8 border-b border-white/10 pb-8">
                        {post.excerpt}
                     </p>

                    <div 
                        className="prose prose-invert prose-lg max-w-none text-zinc-300 headings:text-white headings:font-bold strong:text-white blockquote:border-l-accent blockquote:bg-white/5 blockquote:py-4 blockquote:pl-6 blockquote:rounded-r-lg code:text-accent code:bg-white/5 code:p-1 code:rounded ProseMirror"
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                    />
                    
                    {/* Tags & Share */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex gap-2">
                             {post.tags && post.tags.map((tag: string) => (
                                 <span key={tag} className="px-3 py-1 rounded-full bg-white/5 text-sm text-zinc-400 hover:text-white cursor-pointer">#{tag}</span>
                             ))}
                        </div>
                        <div className="flex gap-4">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                {post.likes} Likes
                            </Button>
                             <Button variant="ghost" size="sm" className="gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                Share
                            </Button>
                        </div>
                    </div>

                    <CommentsSection postId={post._id.toString()} />
                </article>

                {/* Sidebar */}
                <aside className="lg:col-span-4 space-y-8">
                    <TableOfContents />
                    
                    {/* Newsletter Widget */}
                    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-card to-zinc-900 p-6 text-center">
                         <h4 className="text-xl font-bold text-white mb-2">Subscribe to News</h4>
                         <p className="text-sm text-muted mb-6">Get the latest posts delivered to your email.</p>
                         <input type="email" placeholder="Your email" className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 mb-3 text-sm focus:outline-none focus:border-accent" />
                         <Button variant="primary" className="w-full">
                            Subscribe
                         </Button>
                    </div>
                </aside>
            </div>
            
             {/* Related Posts */}
             {relatedPosts.length > 0 && (
                 <div className="mt-24">
                    <h3 className="text-2xl font-bold text-white mb-8">Similar News</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {relatedPosts.map((related: any) => (
                            <BlogCard key={related._id} post={{
                                id: related._id.toString(),
                                title: related.title,
                                excerpt: related.excerpt,
                                date: new Date(related.createdAt).toLocaleDateString(),
                                category: related.category,
                                imageUrl: related.image,
                                likes: related.likes,
                                views: related.views
                            }} />
                         ))}
                    </div>
                 </div>
             )}
        </Container>
    </div>
  );
}
