import dbConnect from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import Media from "@/models/Media";
import AIStudioSettings from "@/models/AIStudioSettings";

export interface ImageGenerationOptions {
  title: string;
  category?: string;
  tags?: string[];
  thesis?: string;
  customPrompt?: string;
}

export class AIStudioDisabledError extends Error {
  constructor() {
    super("AI Studio is currently disabled by the emergency kill switch.");
    this.name = "AIStudioDisabledError";
  }
}

// Curated high-resolution editorial imagery per topic for bulletproof fallback
const TOPIC_PRESETS: Record<string, string[]> = {
  ai: [
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  ],
  systems: [
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  ],
  security: [
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80",
  ],
  science: [
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
  ],
  editorial: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  ],
};

function selectPresetImage(title: string, tags: string[] = []): string {
  const combined = (title + " " + tags.join(" ")).toLowerCase();
  let categoryKey = "editorial";

  if (combined.includes("ai") || combined.includes("model") || combined.includes("llm") || combined.includes("neural") || combined.includes("intelligence")) {
    categoryKey = "ai";
  } else if (combined.includes("system") || combined.includes("cloud") || combined.includes("architecture") || combined.includes("database") || combined.includes("distributed")) {
    categoryKey = "systems";
  } else if (combined.includes("security") || combined.includes("crypto") || combined.includes("privacy") || combined.includes("auth")) {
    categoryKey = "security";
  } else if (combined.includes("science") || combined.includes("physics") || combined.includes("quantum") || combined.includes("research")) {
    categoryKey = "science";
  }

  const pool = TOPIC_PRESETS[categoryKey] || TOPIC_PRESETS.editorial;
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

/**
 * Generates or curates an editorial cover image, uploads it to Cloudinary (if configured),
 * records it in the Media collection, and returns the public CDN URL.
 */
export async function generateCoverImage(options: ImageGenerationOptions): Promise<string> {
  const { title, tags = [], customPrompt } = options;

  await dbConnect();
  const settings = await AIStudioSettings.findOne();
  if (settings?.killSwitch) throw new AIStudioDisabledError();

  let candidateUrl: string | null = null;

  // 1. Try Pollinations AI with prompt tailored to the article
  try {
    const promptText = customPrompt || 
      `High-end modern editorial illustration for "${title}", conceptual digital artwork, dark aesthetic, clean minimalist geometry, 8k resolution, cinematic lighting, no text, no watermark`;
    
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1200&height=675&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    const testRes = await fetch(pollinationsUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
    });

    if (testRes.ok) {
      candidateUrl = pollinationsUrl;
    }
  } catch (e) {
    // Timeout or rate limit; proceed to curated fallback
  }

  // 2. Fallback to topic-tailored curated preset if AI generation was throttled
  if (!candidateUrl) {
    candidateUrl = selectPresetImage(title, tags);
  }

  // 3. Persist to Cloudinary if credentials are configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const uploadResult = await cloudinary.uploader.upload(candidateUrl, {
        folder: "knowledgelog/posts",
        fetch_format: "auto",
        quality: "auto",
      });

      if (uploadResult?.secure_url) {
        // Save to Media collection
        try {
          await dbConnect();
          await Media.create({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            filename: `ai-cover-${Date.now()}`,
            format: uploadResult.format,
            size: uploadResult.bytes || 0,
            width: uploadResult.width,
            height: uploadResult.height,
            folder: "posts",
            altText: title,
          });
        } catch (mediaErr) {
          console.warn("Could not save to Media collection:", mediaErr);
        }

        return uploadResult.secure_url;
      }
    } catch (cloudErr) {
      console.warn("Cloudinary upload failed, falling back to direct URL:", cloudErr);
    }
  }

  return candidateUrl;
}
