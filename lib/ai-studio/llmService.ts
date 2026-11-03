import dbConnect from "@/lib/db";
import AIStudioSettings from "@/models/AIStudioSettings";
import { CategoryInterestMetric } from "./interestEngine";
import { DraftSectionInput } from "./tiptapGenerator";
import {
  quarantineResearchItems,
  getPromptInjectionGuardInstruction,
} from "./promptSanitizer";

export interface GeneratedOpportunityItem {
  proposedTitle: string;
  categorySlug: string;
  tags: string[];
  targetReader: string;
  whyItMattersNow: string;
  audienceInterestScore: number;
  scoreBreakdown?: {
    relevance: number;
    readerInterest: number;
    sourceCredibility: number;
    originality: number;
    timeliness: number;
    duplicatePenalty: number;
    totalScore: number;
    explanation: string;
  };
  suggestedFormat: "deep-dive" | "explainer" | "analysis" | "case-study";
  estimatedReadTime: string;
  duplicateRiskScore: number;
  confidenceScore: number;
  primarySources: {
    title: string;
    url: string;
    publisher: string;
    publishedAt?: Date;
  }[];
  researchDossier?: {
    sourceUrl: string;
    publisher: string;
    retrievalDate: Date;
    publishedDate?: Date;
    relevantExcerpt: string;
    credibilityTier: "tier1_academic" | "tier2_journalism" | "tier3_community";
    claimsSupported: string[];
    isVerified: boolean;
  }[];
  isHeuristicSuggestion?: boolean;
}

interface SynthesisResearchItem {
  title: string;
  url: string;
  authorOrPublisher?: string;
  publishedAt?: Date;
  summary?: string;
}

export interface GeneratedBrief {
  thesis: string;
  outline: { section: string; keyPoints: string[] }[];
  claimsRequiringCitations: string[];
  counterarguments: string[];
  suggestedInternalLinks: string[];
  seoTitle: string;
  seoDescription: string;
  suggestedSlug: string;
}

export interface LLMCallResult {
  text: string | null;
  provider: "gemini" | "openai" | "none";
  model: string;
  error?: string;
}

/**
 * Universal LLM caller with controlled cross-provider failover.
 * Only attempts OpenAI if Gemini is selected AND cross-provider failover is enabled in settings.
 * Strict model isolation guarantees Gemini model IDs are never sent to OpenAI.
 */
export async function callLLM(systemPrompt: string, userPrompt: string): Promise<LLMCallResult> {
  await dbConnect();
  const settings = await AIStudioSettings.findOne();

  // Universal Kill Switch Guard
  if (settings?.killSwitch) {
    console.warn("AI Studio LLM call aborted: Emergency kill switch is active.");
    return { text: null, provider: "none", model: "none", error: "AI Studio kill switch is active" };
  }

  const selectedProvider = settings?.provider || "gemini";
  const allowCrossProvider = Boolean(settings?.allowCrossProviderFailover);
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try Gemini
  if (selectedProvider === "gemini") {
    if (!geminiKey) {
      if (!allowCrossProvider || !openaiKey) {
        return {
          text: null,
          provider: "gemini",
          model: "none",
          error: "GEMINI_API_KEY is not configured and cross-provider failover is disabled.",
        };
      }
    } else {
      let configuredModel = settings?.modelName || "gemini-3.8-flash";
      if (!configuredModel.startsWith("gemini")) {
        configuredModel = "gemini-3.8-flash";
      }

      const candidateModels = [
        configuredModel,
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
      ].filter((v, i, a) => a.indexOf(v) === i);

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 6000,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return { text, provider: "gemini", model };
            }
          }
        } catch (e: any) {
          console.warn(`Gemini model ${model} call error:`, e?.message || e);
        }
      }

      if (!allowCrossProvider || !openaiKey) {
        return {
          text: null,
          provider: "gemini",
          model: configuredModel,
          error: "All Gemini candidate models failed and cross-provider failover is disabled.",
        };
      }

      console.warn("Gemini candidate models failed. Engaging authorized cross-provider failover to OpenAI...");
    }
  }

  // 2. Try OpenAI (either explicitly selected or authorized failover)
  if (selectedProvider === "openai" || (selectedProvider === "gemini" && allowCrossProvider)) {
    if (!openaiKey) {
      return {
        text: null,
        provider: "openai",
        model: "none",
        error: "OPENAI_API_KEY is not configured.",
      };
    }

    let model = "gpt-4o-mini";
    if (
      settings?.modelName &&
      (settings.modelName.startsWith("gpt-") ||
        settings.modelName.startsWith("o1") ||
        settings.modelName.startsWith("o3"))
    ) {
      model = settings.modelName;
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.35,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          return { text, provider: "openai", model };
        }
      }
    } catch (e: any) {
      console.error("OpenAI call error:", e?.message || e);
      return {
        text: null,
        provider: "openai",
        model,
        error: e?.message || "OpenAI API call failed.",
      };
    }
  }

  return {
    text: null,
    provider: "none",
    model: "none",
    error: "No AI provider succeeded.",
  };
}

/**
 * Resilient JSON extractor that cleanly strips markdown blocks and extracts JSON objects or arrays.
 */
export function extractJsonFromText<T = any>(rawText: string): T | null {
  if (!rawText || typeof rawText !== "string") return null;

  const stripped = rawText
    .replace(/^```(?:json)?\s*/gim, "")
    .replace(/\s*```$/gm, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {}

  const firstBracket = rawText.indexOf("[");
  const firstBrace = rawText.indexOf("{");
  let startIdx = -1;
  let endIdx = -1;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    endIdx = rawText.lastIndexOf("]");
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endIdx = rawText.lastIndexOf("}");
  }

  if (startIdx !== -1 && endIdx > startIdx) {
    const candidate = rawText.slice(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  return null;
}

/**
 * Computes transparent, multidimensional score breakdown for an opportunity.
 */
export function calculateTransparentScore(params: {
  relevanceBase: number;
  readerInterestScore: number;
  sourceTrustScore: number;
  originalityScore: number;
  duplicateRisk: number;
}) {
  const relevance = Math.max(5, Math.min(25, Math.round(params.relevanceBase * 0.25)));
  const readerInterest = Math.max(5, Math.min(25, Math.round(params.readerInterestScore * 0.25)));
  const sourceCredibility = Math.max(5, Math.min(20, Math.round(params.sourceTrustScore * 0.2)));
  const originality = Math.max(5, Math.min(15, Math.round(params.originalityScore * 0.15)));
  const timeliness = 12;
  const duplicatePenalty = Math.max(0, Math.min(25, Math.round(params.duplicateRisk * 0.7)));

  const totalScore = Math.max(
    10,
    Math.min(100, relevance + readerInterest + sourceCredibility + originality + timeliness - duplicatePenalty)
  );

  const explanation = `Score: ${totalScore}/100 [Relevance: ${relevance}/25, Reader Interest: ${readerInterest}/25, Sources: ${sourceCredibility}/20, Originality: ${originality}/15, Timeliness: ${timeliness}/15, Duplicate Penalty: -${duplicatePenalty}]`;

  return {
    relevance,
    readerInterest,
    sourceCredibility,
    originality,
    timeliness,
    duplicatePenalty,
    totalScore,
    explanation,
  };
}

/**
 * Generates ranked editorial opportunities from audience interest metrics and recent research items.
 */
export async function synthesizeOpportunities(
  categoryMetrics: CategoryInterestMetric[],
  researchItems: SynthesisResearchItem[]
): Promise<GeneratedOpportunityItem[]> {
  const topMetrics = categoryMetrics.slice(0, 4);
  const approvedSources = new Map(
    researchItems.map((item) => [
      item.url,
      {
        title: item.title,
        url: item.url,
        publisher: item.authorOrPublisher || "Approved Research Feed",
        publishedAt: item.publishedAt,
        summary: item.summary,
      },
    ]),
  );

  const quarantinedResearch = quarantineResearchItems(
    researchItems.slice(0, 8).map((r) => ({
      title: r.title,
      url: r.url,
      summary: r.summary,
      authorOrPublisher: r.authorOrPublisher,
    }))
  );

  const securityInstructions = getPromptInjectionGuardInstruction();

  const systemPrompt = `You are the Lead Editorial Strategist for KnowledgeLog (a high-signal publication focused on technology, science, and systems thinking: "depth over hype, clear, thoughtful, no clickbait").
Generate high-value article ideas that match audience demand and recent research.

${securityInstructions}

Return your response ONLY as valid JSON (an array of objects).
Do not include markdown code fence formatting or backticks.`;

  const userPrompt = `Audience Trends:
${JSON.stringify(topMetrics, null, 2)}

Approved Research Items:
${quarantinedResearch}

Synthesize 3-5 distinct, high-signal article opportunities. For each provide:
- proposedTitle (string)
- categorySlug (matching one of: ${categoryMetrics.map((c) => c.categorySlug).join(", ")})
- tags (array of 3-5 strings)
- targetReader (string)
- whyItMattersNow (string, 2 sentences)
- audienceInterestScore (number 65-95)
- suggestedFormat ("deep-dive" | "explainer" | "analysis")
- estimatedReadTime ("6 min read")
- duplicateRiskScore (number 5-20)
- confidenceScore (number 80-95)
- primarySources (array of { title, url, publisher }); choose only URLs from the approved research items and copy each URL exactly. Never invent or modify a source URL.`;

  const llmResult = await callLLM(systemPrompt, userPrompt);

  if (llmResult.text) {
    try {
      const parsed = extractJsonFromText<GeneratedOpportunityItem[]>(llmResult.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => {
          const primarySources = Array.isArray(item.primarySources)
            ? item.primarySources.flatMap((source) => {
                if (!source || typeof source.url !== "string") return [];
                const approvedSource = approvedSources.get(source.url);
                return approvedSource ? [approvedSource] : [];
              })
            : [];
          const breakdown = calculateTransparentScore({
            relevanceBase: 88,
            readerInterestScore: item.audienceInterestScore || 75,
            sourceTrustScore: primarySources.length > 0 ? 85 : 50,
            originalityScore: 82,
            duplicateRisk: item.duplicateRiskScore || 10,
          });

          const researchDossier = primarySources.map((source) => ({
            sourceUrl: source.url,
            publisher: source.publisher,
            retrievalDate: new Date(),
            publishedDate: source.publishedAt,
            relevantExcerpt: source.summary || "Selected for editorial research; source claims require human verification.",
            credibilityTier: "tier2_journalism" as const,
            claimsSupported: [],
            isVerified: false,
          }));

          return {
            ...item,
            primarySources,
            audienceInterestScore: breakdown.totalScore,
            scoreBreakdown: breakdown,
            researchDossier,
            isHeuristicSuggestion: false,
          };
        });
      }
    } catch (e) {
      console.error("Failed to parse LLM opportunity JSON:", e);
    }
  }

  // Algorithmic Fallback Scaffolding (explicitly flagged as heuristic suggestions, NOT simulated AI articles)
  const fallbackOpportunities: GeneratedOpportunityItem[] = [];

  for (let i = 0; i < Math.min(3, topMetrics.length); i++) {
    const metric = topMetrics[i];
    const relatedResearch = researchItems.filter((r) =>
      r.title.toLowerCase().includes(metric.categorySlug.toLowerCase()) ||
      (metric.topTags[0] && r.title.toLowerCase().includes(metric.topTags[0].tag.toLowerCase()))
    );

    const primarySources = relatedResearch.slice(0, 2).map((r) => ({
      title: r.title,
      url: r.url,
      publisher: r.authorOrPublisher || "Approved Research Feed",
      publishedAt: r.publishedAt,
    }));

    if (primarySources.length === 0 && researchItems.length > 0) {
      primarySources.push({
        title: researchItems[0].title,
        url: researchItems[0].url,
        publisher: researchItems[0].authorOrPublisher || "Approved Source",
        publishedAt: researchItems[0].publishedAt,
      });
    }

    const tagSample = metric.topTags.map((t) => t.tag).slice(0, 3);
    const mainTopic = tagSample[0] ? tagSample[0].toUpperCase() : metric.categoryName;

    const breakdown = calculateTransparentScore({
      relevanceBase: 80,
      readerInterestScore: metric.interestScore,
      sourceTrustScore: primarySources.length > 0 ? 80 : 40,
      originalityScore: 70,
      duplicateRisk: 12,
    });

    const researchDossier = primarySources.map((s) => ({
      sourceUrl: s.url,
      publisher: s.publisher,
      retrievalDate: new Date(),
      publishedDate: s.publishedAt ? new Date(s.publishedAt) : undefined,
      relevantExcerpt: relatedResearch.find((item) => item.url === s.url)?.summary ||
        "Selected for editorial research; source claims require human verification.",
      credibilityTier: "tier2_journalism" as const,
      claimsSupported: [],
      isVerified: false,
    }));

    fallbackOpportunities.push({
      proposedTitle: `Architectural Principles of Modern ${mainTopic}: A Pragmatic Deep Dive`,
      categorySlug: metric.categorySlug,
      tags: tagSample.length > 0 ? tagSample : [metric.categorySlug, "systems", "architecture"],
      targetReader: `Engineers, researchers, and technical architects working with ${metric.categoryName}`,
      whyItMattersNow: `With ${metric.recentViews30d} recent page views and ${metric.totalBookmarks} bookmarks in ${metric.categoryName}, readers are seeking rigorous, hype-free analysis of fundamental tradeoffs.`,
      audienceInterestScore: breakdown.totalScore,
      scoreBreakdown: breakdown,
      suggestedFormat: "deep-dive",
      estimatedReadTime: "7 min read",
      duplicateRiskScore: 12,
      confidenceScore: 88,
      primarySources,
      researchDossier,
      isHeuristicSuggestion: true, // Transparent indicator for human editors
    });
  }

  return fallbackOpportunities;
}

/**
 * Generates an editorial brief and outline for an approved opportunity.
 */
export async function generateBrief(opportunity: any): Promise<GeneratedBrief> {
  const systemPrompt = `You are the Lead Editorial Director at KnowledgeLog.
Create a structured research brief for an article titled "${opportunity.proposedTitle}".
Adhere to the voice: "Clear, thoughtful, intellectually honest, depth over hype, no clickbait".
Output ONLY valid JSON matching the requested schema. No markdown wrapping.`;

  const userPrompt = `Topic: ${opportunity.proposedTitle}
Category: ${opportunity.categorySlug || "Technology"}
Target Reader: ${opportunity.targetReader}
Sources:
${(opportunity.primarySources || []).map((s: any) => `- ${s.publisher}: ${s.title} (${s.url})`).join("\n")}

Generate JSON with:
{
  "thesis": "One paragraph crisp editorial thesis",
  "outline": [
    { "section": "Section 1 Title", "keyPoints": ["point 1", "point 2"] },
    { "section": "Section 2 Title", "keyPoints": ["point 1", "point 2"] },
    { "section": "Section 3 Title", "keyPoints": ["point 1", "point 2"] }
  ],
  "claimsRequiringCitations": ["claim 1", "claim 2"],
  "counterarguments": ["potential limitation or critique 1"],
  "suggestedInternalLinks": ["System Architecture", "Performance Benchmarks"],
  "seoTitle": "SEO title under 60 chars",
  "seoDescription": "Meta description under 155 chars",
  "suggestedSlug": "kebab-case-slug"
}`;

  const llmResult = await callLLM(systemPrompt, userPrompt);

  if (llmResult.text) {
    try {
      const parsed = extractJsonFromText<GeneratedBrief>(llmResult.text);
      if (parsed && parsed.thesis && Array.isArray(parsed.outline)) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse brief JSON:", e);
    }
  }

  // Fallback outline scaffolding
  const slug = opportunity.proposedTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return {
    thesis: `This article examines the structural tradeoffs, real-world constraints, and design patterns in ${opportunity.proposedTitle}, moving past surface-level hype to provide actionable mental models.`,
    outline: [
      {
        section: "The Core Problem & Context",
        keyPoints: [
          "Historical context and why previous paradigms struggled to scale",
          "The fundamental tension between flexibility and operational complexity",
        ],
      },
      {
        section: "Key Mechanisms and Tradeoffs",
        keyPoints: [
          "Breakdown of internal invariants and lifecycle guarantees",
          "Concrete performance, latency, and resource considerations",
        ],
      },
      {
        section: "Practical Recommendations & Future Trajectory",
        keyPoints: [
          "Actionable heuristics for practitioners deciding when and where to adopt",
          "Open questions and upcoming developments in the ecosystem",
        ],
      },
    ],
    claimsRequiringCitations: [
      "Observed performance degradation under concurrent read-heavy workloads",
      "Benchmark metrics cited in recent peer-reviewed literature",
    ],
    counterarguments: [
      "In simpler single-node deployments, simpler alternative abstractions often outperform more complex setups",
    ],
    suggestedInternalLinks: ["Engineering Principles", "Performance Evaluation"],
    seoTitle: `${opportunity.proposedTitle.slice(0, 50)} | KnowledgeLog`,
    seoDescription: `A thoughtful, in-depth architectural breakdown of ${opportunity.proposedTitle}. Tradeoffs, principles, and real-world takeaways.`,
    suggestedSlug: slug,
  };
}

/**
 * Generates the full, rich article content as structured sections suitable for TipTap JSON generation.
 * Requires genuine successful LLM output. Never silently returns canned placeholder paragraphs.
 */
export async function generateDraftSections(
  opportunity: any,
  brief: GeneratedBrief
): Promise<{ sections: DraftSectionInput[]; provider: string; model: string }> {
  const systemPrompt = `You are an expert staff writer and domain authority for KnowledgeLog (editorial motto: "depth over hype, clear, thoughtful, no clickbait, no unsupported certainty").
Write full, extensive, highly substantive text for this article based on the outline.
Each section MUST contain:
- heading (matching the section title)
- level (2)
- paragraphs: array of 2 to 4 rich, detailed, comprehensive paragraphs explaining the mechanisms, tradeoffs, context, and practical takeaways.
- callout: optional object { "type": "info" | "tip" | "warning" | "success", "text": "..." }
- keyTakeaways: array of 2-3 bullet points
- codeSnippet: optional object { "language": string, "code": string } if technical/code is relevant

Return your response ONLY as a JSON array of section objects.
Do not wrap in markdown code fences or backticks.`;

  const userPrompt = `Article Title: ${opportunity.proposedTitle}
Thesis: ${brief.thesis}
Outline:
${JSON.stringify(brief.outline, null, 2)}
Claims requiring citation:
${(brief.claimsRequiringCitations || []).join("\n")}
Counterarguments & edge cases:
${(brief.counterarguments || []).join("\n")}

Write the complete in-depth article sections in JSON format now.`;

  const llmResult = await callLLM(systemPrompt, userPrompt);
  if (llmResult.text) {
    try {
      const parsed = extractJsonFromText<DraftSectionInput[]>(llmResult.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          sections: parsed,
          provider: llmResult.provider,
          model: llmResult.model,
        };
      }
    } catch (e) {
      console.error("Failed to parse real draft sections JSON from LLM:", e);
    }
  }

  // Strictly enforce genuine section synthesis (Issue 10)
  throw new Error(
    `AI draft generation failed: ${llmResult.error || "Model returned invalid content"}. Complete draft sections could not be synthesized.`
  );
}
