import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import Category from '@/models/Category';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();

    // 1. Clear existing data
    await Post.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});

    // 2. Seed Users
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPasswordAdmin = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = {
        name: "Admin User",
        email: process.env.ADMIN_EMAIL || "admin@knowledgelog.com",
        password: hashedPasswordAdmin,
        role: "admin",
        image: "https://placehold.co/100x100/333/FFF?text=ADMIN"
    };

    const hashedUserPassword = await bcrypt.hash("user123", 10);
    const regularUser = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: hashedUserPassword,
        role: "user",
        image: "https://placehold.co/100x100/111/FFF?text=JD"
    };

    await User.insertMany([adminUser, regularUser]);

    // 3. Seed Categories
    const categories = [
        { name: "Artificial Intelligence", slug: "artificial-intelligence", genre: "Technology", language: "English", description: "Exploring the frontiers of AI and machine learning." },
        { name: "Quantum Physics", slug: "quantum-physics", genre: "Science", language: "English", description: "The weird and wonderful world of subatomic particles." },
        { name: "Astrophysics", slug: "astrophysics", genre: "Science", language: "English", description: "Understanding the cosmos, from black holes to the Big Bang." },
        { name: "Chemistry", slug: "chemistry", genre: "Science", language: "English", description: "The study of matter, reactions, and molecular structures." },
        { name: "Mathematics", slug: "mathematics", genre: "Science", language: "English", description: "The language of the universe." }
    ];

    await Category.insertMany(categories);

    // 4. Seed Posts
    const posts = [
      // Topic 1: AI Impact
      {
        title: "The Effects of AI on Humanity: Salvation or Subjugation?",
        slug: "effects-of-ai-on-humanity",
        excerpt: "As Artificial Intelligence becomes ubiquitous, we examine its profound impact on our workforce, creativity, and social fabric. Is it a tool for liberation or a catalyst for obsolescence?",
        content: `
            <p class="lead text-xl text-zinc-300 mb-6">We stand at the precipice of a new era. The integration of Artificial Intelligence into every facet of our lives is no longer a futuristic concept—it is our reality.</p>
            
            <h3 class="text-2xl font-bold text-white mt-8 mb-4">The Positive Disruption</h3>
            <p>On one hand, AI offers unprecedented opportunities. In <strong>healthcare</strong>, algorithms are detecting various cancers with higher accuracy than human radiologists. In <strong>science</strong>, AlphaFold has solved the 50-year-old protein folding problem, accelerating drug discovery. AI is the ultimate force multiplier, handling mundane tasks and freeing humans to pursue higher-order creative and strategic work.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">The Shadow of Obsolescence</h3>
            <p>However, the rapid pace of automation brings valid anxieties. Goldman Sachs predicts that Generative AI could expose 300 million jobs to automation. The question is not just about economic displacement, but about <em>human agency</em>. If an algorithm curates what we read, write, and see, are we losing our cognitive independence?</p>
            
            <h3 class="text-2xl font-bold text-white mt-8 mb-4">The Verdict</h3>
            <p>AI is neither inherently good nor bad; it is a mirror reflecting our own intentions. The challenge of the 21st century will not be building smarter machines, but ensuring those machines remain aligned with human values.</p>
        `,
        category: "Artificial Intelligence",
        image: "/images/blog/ai_impact.png",
        author: { name: "Dr. Elena Vos", role: "Tech Ethicist", image: "https://placehold.co/100x100/111/FFF?text=EV" },
        readTime: "8 min",
        views: 1250,
        likes: 450,
        featured: true,
        tags: ["AI", "Ethics", "Future", "Society"],
        createdAt: new Date()
      },
      // Topic 2: Quantum Computing
      {
        title: "Quantum Computing: The End of Encryption as We Know It",
        slug: "quantum-computing-end-of-encryption",
        excerpt: "Traditional computers think in bits. Quantum computers think in possibilities. This shift promises to solve insoluble problems but threatens global security infrastructures.",
        content: `
            <p class="lead text-xl text-zinc-300 mb-6">Imagine a maze. A classical computer solves it by trying every path one by one. A quantum computer tries every path <em>simultaneously</em>.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">Superposition and Entanglement</h3>
            <p>Quantum computing harnesses the strange laws of quantum mechanics. Unlike a bit (0 or 1), a <strong>qubit</strong> can exist in a state of superposition, representing both 0 and 1 at the same time. This allows for exponential processing power relative to the number of qubits.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">The Threat to RSA</h3>
            <p>Our entire internet security (banking, emails, military comms) relies on RSA encryption, which is based on the difficulty of factoring large prime numbers. A sufficiently powerful quantum computer, running Shor's Algorithm, could crack this in seconds. We are now in a race towards <strong>Post-Quantum Cryptography</strong>—algorithms resistant to quantum attacks.</p>
        `,
        category: "Quantum Physics",
        image: "/images/blog/quantum_chip.png",
        author: { name: "Marcus Chen", role: "Physics Editor", image: "https://placehold.co/100x100/333/FFF?text=MC" },
        readTime: "10 min",
        views: 980,
        likes: 320,
        featured: false,
        tags: ["Quantum", "Computing", "Security", "Physics"],
        createdAt: new Date(Date.now() - 86400000)
      },
      // Topic 3: Black Holes
      {
        title: "Beyond the Event Horizon: What Lies Inside a Black Hole?",
        slug: "inside-black-hole-mystery",
        excerpt: "Black holes are the universe's ultimate trapdoors. We explore the paradoxes, the singularities, and the possibility that they are gateways to other universes.",
        content: `
            <p class="lead text-xl text-zinc-300 mb-6">"God divided the light from the darkness." In the case of black holes, gravity divides the knowable universe from the unknowable.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">The Singularity</h3>
            <p>At the center of a black hole lies the Singularity—a point of infinite density and zero volume where the laws of physics break down. General Relativity tells us space and time curve infinitely; Quantum Mechanics tells us this is impossible. Reconciling these two views is the holy grail of physics.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">Spaghettification</h3>
            <p>If you were to fall in, the tidal forces would differ so strongly between your head and your feet that you would be stretched into a long, thin noodle. A gruesome end, but a fascinating display of gravity's power.</p>
        `,
        category: "Astrophysics",
        image: "/images/blog/black_hole.png",
        author: { name: "Sarah Miller", role: "Astrophysicist", image: "https://placehold.co/100x100/444/FFF?text=SM" },
        readTime: "12 min",
        views: 2100,
        likes: 890,
        featured: false,
        tags: ["Space", "Physics", "Black Hole", "Universe"],
        createdAt: new Date(Date.now() - 172800000)
      },
      // Topic 4: Chemistry
      {
        title: "The Molecular Ballet: How Chemistry Shapes Our World",
        slug: "chemistry-molecular-ballet",
        excerpt: "From the air we breathe to the emotions we feel, everything is a chemical reaction. A look at the unseen molecular dance that creates reality.",
        content: `
            <p class="lead text-xl text-zinc-300 mb-6">Chemistry is often called the 'Central Science' because it bridges physics with biology. It is the study of change itself.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">The Magic of Covalent Bonds</h3>
            <p>Consider water (H2O). Two flammable hydrogen atoms bond with one combustion-supporting oxygen atom to create a substance that extinguishes fire. This emergent property is the essence of chemistry—the whole is different from the sum of its parts.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">Synthetic Futures</h3>
            <p>Modern chemistry is moving beyond observation to creation. With <strong>CRISPR</strong> and synthetic biology, we are reprogramming the chemistry of life. With new polymers, we are creating self-healing materials. The lab of the future is not just discovering nature's rules, but rewriting them.</p>
        `,
        category: "Chemistry",
        image: "/images/blog/chemistry.png",
        author: { name: "Dr. James Wong", role: "Chemist", image: "https://placehold.co/100x100/555/FFF?text=JW" },
        readTime: "7 min",
        views: 650,
        likes: 150,
        featured: false,
        tags: ["Chemistry", "Science", "Molecules", "Innovation"],
        createdAt: new Date(Date.now() - 259200000)
      },
      // Topic 5: Mathematics
      {
        title: "The Golden Ratio: Is Math Discovered or Invented?",
        slug: "golden-ratio-math-discovered",
        excerpt: "The Fibonacci sequence appears in pinecones, galaxies, and financial markets. Does mathematics exist independently of the human mind?",
        content: `
            <p class="lead text-xl text-zinc-300 mb-6">Galileo famously said, "The universe is written in the language of mathematics." But did we write the dictionary?</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">Phi (φ) - The Divine Proportion</h3>
            <p>The number 1.618... appears startlingly often in nature. From the spiral of a nautilus shell to the proportions of the Parthenon, the Golden Ratio suggests a hidden order to chaos. This universality leads Platonists to argue that mathematical forms are real, abstract objects waiting to be discovered.</p>

            <h3 class="text-2xl font-bold text-white mt-8 mb-4">The Unreasonable Effectiveness</h3>
            <p>Why should abstract equations developed in a room perfectly describe the motion of planets light-years away? The precision with which math models reality remains one of the deepest philosophical mysteries of science.</p>
        `,
        category: "Mathematics",
        image: "/images/blog/mathematics.png",
        author: { name: "Prof. Alan Turing", role: "Mathematician", image: "https://placehold.co/100x100/666/FFF?text=AT" },
        readTime: "9 min",
        views: 1500,
        likes: 560,
        featured: false,
        tags: ["Math", "Philosophy", "Golden Ratio", "Science"],
        createdAt: new Date(Date.now() - 345600000)
      }
    ];

    await Post.insertMany(posts);

    return NextResponse.json({ 
      message: 'Database seeded successfully', 
      usersCount: 2,
      categoriesCount: categories.length,
      postsCount: posts.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

