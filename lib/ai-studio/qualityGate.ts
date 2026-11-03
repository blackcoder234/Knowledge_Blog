import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import AIQualityReview, { IAIQualityReview } from "@/models/AIQualityReview";
import AIStudioSettings from "@/models/AIStudioSettings";
import mongoose from "mongoose";

export interface QualityCheckInput {
  postId: string;
  title: string;
  excerpt: string;
  content: string; // HTML or plain text
  plainText: string;
  seoTitle?: string;
  seoDescription?: string;
  image?: string;
  tags?: string[];
  primarySources?: {
    title: string;
    url: string;
    publisher: string;
    publishedAt?: Date | string;
  }[];
}

/**
 * Calculates Flesch Reading Ease score:
 * 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
 */
export function calculateFleschReadingEase(text: string): {
  score: number;
  gradeLevel: string;
} {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { score: 100, gradeLevel: "N/A" };

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const wordCount = words.length;

  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += countSyllables(word);
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = totalSyllables / wordCount;

  const rawScore =
    206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let gradeLevel = "Standard (High School)";
  if (score >= 90) gradeLevel = "Very Easy (5th grade)";
  else if (score >= 80) gradeLevel = "Easy (6th grade)";
  else if (score >= 70) gradeLevel = "Fairly Easy (7th grade)";
  else if (score >= 60) gradeLevel = "Standard / Conversational (8th-9th grade)";
  else if (score >= 50) gradeLevel = "Fairly Difficult (High School)";
  else if (score >= 30) gradeLevel = "Difficult (College Level)";
  else gradeLevel = "Very Difficult (Academic/Scientific Research)";

  return { score, gradeLevel };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? Math.max(1, syllables.length) : 1;
}

const SENSATIONALIST_PATTERNS = [
  /\b(you won't believe|shocking truth|mind-blowing|game changer|miracle cure|guaranteed secret)\b/i,
  /\b(everyone is talking about|100% proven|undeniably revolutionary|never before seen)\b/i,
];

const UNSUPPORTED_CERTAINTY_PATTERNS = [
  /\b(without any doubt|irrefutable proof|impossible to disprove|case closed on)\b/i,
  /\b(scientifically settled forever|everyone knows that|it is simply impossible that)\b/i,
];

const HIGH_RISK_TOPIC_KEYWORDS = [
  "cure", "clinical trial", "medical diagnosis", "prescription", "therapeutic dosage",
  "guaranteed stock return", "financial investment advice", "legal liability immunity",
  "remote code execution exploit", "zero-day vulnerability",
];

/**
 * Performs heuristic quality checks; citation presence is not claim verification.
 */
export async function auditPostDraft(
  input: QualityCheckInput
): Promise<IAIQualityReview> {
  await dbConnect();
  const settings = await AIStudioSettings.findOne().lean();
  const thresholds = {
    minOverallScore: settings?.qualityThresholds?.minOverallScore ?? 80,
    minSourceFreshnessDays: settings?.qualityThresholds?.minSourceFreshnessDays ?? 30,
    maxDuplicateRiskScore: settings?.qualityThresholds?.maxDuplicateRiskScore ?? 30,
    minReadabilityScore: settings?.qualityThresholds?.minReadabilityScore ?? 55,
  };

  const recommendations: string[] = [];
  const textToCheck = `${input.title}\n${input.excerpt}\n${input.plainText}`.toLowerCase();

  // 1. High-Risk Topic Screening
  const isHighRiskTopic = HIGH_RISK_TOPIC_KEYWORDS.some((kw) => textToCheck.includes(kw));
  if (isHighRiskTopic) {
    recommendations.push(
      "High-Risk Subject Matter: Contains sensitive claims (health, finance, security, or legal). Requires rigorous human editorial sign-off."
    );
  }

  // 2. Source Coverage & Freshness
  const sources = input.primarySources || [];
  const sourcesCount = sources.length;
  const now = Date.now();
  const freshnessCutoff = now - thresholds.minSourceFreshnessDays * 86400000;
  const sourceFreshness = sources.map((source) => {
    if (!source.publishedAt) return "unknown";
    const publishedAt = new Date(source.publishedAt).getTime();
    if (!Number.isFinite(publishedAt) || publishedAt > now) return "unknown";
    return publishedAt < freshnessCutoff ? "stale" : "fresh";
  });
  const staleSourceCount = sourceFreshness.filter((status) => status === "stale").length;
  const unknownFreshnessCount = sourceFreshness.filter((status) => status === "unknown").length;
  const sourceFreshnessScore = sourcesCount
    ? Math.round(((sourcesCount - staleSourceCount - unknownFreshnessCount) / sourcesCount) * 100)
    : 0;
  if (staleSourceCount > 0) {
    recommendations.push(
      `${staleSourceCount} research source(s) are older than the configured ${thresholds.minSourceFreshnessDays}-day freshness window.`,
    );
  }
  if (unknownFreshnessCount > 0) {
    recommendations.push(
      `Publication dates are unavailable for ${unknownFreshnessCount} source(s); verify their freshness manually.`,
    );
  }
  let sourceCoverageScore = 100;
  let sourceDetails = `${sourcesCount} source(s) recorded; inclusion and claim support in the article are not automatically verified.`;

  if (sourcesCount === 0) {
    sourceCoverageScore = 40;
    sourceDetails = "No external research sources or citations were registered.";
    recommendations.push(
      "Add at least 1-2 authoritative primary sources or citations to ground the claims."
    );
  } else if (sourcesCount < 2) {
    sourceCoverageScore = 75;
    sourceDetails = "1 source recorded. Additional cross-references are recommended.";
  }

  // 3. Claims Breakdown Analysis
  const claimsBreakdown: Array<{
    claim: string;
    status: "supported" | "partially_supported" | "unsupported" | "opinion";
    sourceUrl?: string;
    riskLevel: string;
  }> = [];

  if (sourcesCount > 0) {
    claimsBreakdown.push({
      claim: `Primary source is cited, but claim-to-source support has not been automatically verified: "${sources[0].title}"`,
      status: "partially_supported",
      sourceUrl: sources[0].url,
      riskLevel: "low",
    });
  } else {
    claimsBreakdown.push({
      claim: "Key thesis relies on internal inference without registered external citation.",
      status: "unsupported",
      riskLevel: isHighRiskTopic ? "high" : "medium",
    });
  }

  // 4. Unsupported Certainty & Hype Check
  const detectedCertaintyClaims: string[] = [];
  for (const regex of UNSUPPORTED_CERTAINTY_PATTERNS) {
    const match = textToCheck.match(regex);
    if (match) detectedCertaintyClaims.push(match[0]);
  }

  const hasUnsupportedClaims = detectedCertaintyClaims.length > 0;
  if (hasUnsupportedClaims) {
    recommendations.push(
      `Tone refinement: Rephrase absolute statements (${detectedCertaintyClaims
        .slice(0, 3)
        .join(", ")}) to preserve intellectual humility and nuance.`
    );
    claimsBreakdown.push({
      claim: `Absolute rhetorical phrasing detected: "${detectedCertaintyClaims[0]}"`,
      status: "unsupported",
      riskLevel: "medium",
    });
  }

  // 5. Sensationalism / Misinformation Flags
  let misinformationFlagged = false;
  let misinfoNotes = "No sensationalist or clickbait patterns detected.";
  const clickbaitMatches: string[] = [];

  for (const regex of SENSATIONALIST_PATTERNS) {
    const match = textToCheck.match(regex);
    if (match) clickbaitMatches.push(match[0]);
  }

  if (clickbaitMatches.length > 0) {
    misinformationFlagged = true;
    misinfoNotes = `Potential clickbait phrases detected: ${clickbaitMatches.join(
      ", "
    )}`;
    recommendations.push(
      "Replace clickbait phrases with clear, explanatory editorial language."
    );
  }

  // 6. Duplicate / Cannibalization Risk Check
  const existingPosts = await Post.find({
    _id: { $ne: new mongoose.Types.ObjectId(input.postId) },
    status: { $in: ["published", "scheduled"] },
  })
    .select("title slug tags")
    .lean();

  let highestDuplicateScore = 0;
  let conflictingSlug: string | undefined;
  let conflictingTitle: string | undefined;

  const currentTitleTokens = new Set(
    input.title
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );

  for (const post of existingPosts) {
    const otherTokens = post.title
      .toLowerCase()
      .split(/\W+/)
      .filter((w: string) => w.length > 3);

    let matchCount = 0;
    for (const token of otherTokens) {
      if (currentTitleTokens.has(token)) matchCount++;
    }

    if (currentTitleTokens.size > 0) {
      const overlapPct = Math.round(
        (matchCount / Math.max(currentTitleTokens.size, otherTokens.length)) * 100
      );
      if (overlapPct > highestDuplicateScore) {
        highestDuplicateScore = overlapPct;
        conflictingSlug = post.slug;
        conflictingTitle = post.title;
      }
    }
  }

  if (highestDuplicateScore > thresholds.maxDuplicateRiskScore) {
    recommendations.push(
      `Duplicate Risk (${highestDuplicateScore}%): Closely matches existing post "${conflictingTitle}". Differentiate the thesis or angle.`
    );
  }

  // 7. SEO Completeness Check
  const missingSeoFields: string[] = [];
  if (!input.title || input.title.trim().length < 10)
    missingSeoFields.push("Title too short (<10 chars)");
  if (!input.excerpt || input.excerpt.trim().length < 50)
    missingSeoFields.push("Excerpt/meta description too short (<50 chars)");
  if (!input.image) missingSeoFields.push("Featured Image missing");
  if (!input.tags || input.tags.length === 0)
    missingSeoFields.push("Tags missing");

  const seoPassed = missingSeoFields.length === 0;
  if (!seoPassed) {
    recommendations.push(`SEO check: Missing ${missingSeoFields.join(", ")}.`);
  }

  // 8. Readability Check
  const { score: fleschScore, gradeLevel } = calculateFleschReadingEase(
    input.plainText
  );

  if (fleschScore < thresholds.minReadabilityScore) {
    recommendations.push(
      `Readability is somewhat dense (${fleschScore}/100, ${gradeLevel}). Consider shortening long paragraphs or breaking up complex compound sentences.`
    );
  }

  // 9. Editorial Voice Score
  let editorialVoiceScore = 95;
  if (hasUnsupportedClaims) editorialVoiceScore -= 20;
  if (misinformationFlagged) editorialVoiceScore -= 25;
  if (highestDuplicateScore > thresholds.maxDuplicateRiskScore) editorialVoiceScore -= 15;

  // Composite Score
  let compositeScore = Math.round(
    sourceCoverageScore * 0.25 +
      (hasUnsupportedClaims ? 60 : 100) * 0.15 +
      (100 - highestDuplicateScore) * 0.15 +
      (seoPassed ? 100 : 70) * 0.15 +
      Math.min(100, fleschScore + 30) * 0.15 +
      editorialVoiceScore * 0.15
  );

  compositeScore = Math.max(20, Math.min(100, compositeScore));

  // Source presence is not proof that the cited material supports the article's claims.
  const passed =
    compositeScore >= thresholds.minOverallScore &&
    !misinformationFlagged &&
    sourcesCount > 0 &&
    seoPassed &&
    highestDuplicateScore <= thresholds.maxDuplicateRiskScore &&
    fleschScore >= thresholds.minReadabilityScore &&
    staleSourceCount === 0 &&
    unknownFreshnessCount === 0;

  // Source overlap metric (citation density)
  const sourceOverlapScore = Math.min(30, sourcesCount * 7);

  // Save review
  const review = await AIQualityReview.create({
    postId: new mongoose.Types.ObjectId(input.postId),
    overallScore: compositeScore,
    passed,
    highRiskTopic: isHighRiskTopic,
    claimsBreakdown,
    checks: {
      sourceFreshness: {
        score: sourceFreshnessScore,
        staleCount: staleSourceCount,
        unknownCount: unknownFreshnessCount,
      },
      sourceCoverage: {
        score: sourceCoverageScore,
        details: sourceDetails,
        sourceCount: sourcesCount,
      },
      unsupportedClaims: {
        detected: hasUnsupportedClaims,
        claims: detectedCertaintyClaims,
      },
      duplicateRisk: {
        score: highestDuplicateScore,
        conflictingPostSlug: conflictingSlug,
        conflictingPostTitle: conflictingTitle,
      },
      misinformationFlags: {
        flagged: misinformationFlagged,
        notes: misinfoNotes,
      },
      plagiarismRisk: {
        score: sourceOverlapScore,
        highestOverlapUrl: sources[0]?.url,
      },
      sourceOverlapRisk: {
        score: sourceOverlapScore,
        details: `${sourcesCount} source reference(s) recorded. Citation presence does not verify that a source supports a claim.`,
      },
      seoCompleteness: {
        passed: seoPassed,
        missingFields: missingSeoFields,
      },
      readabilityScore: {
        fleschScore,
        gradeLevel,
      },
      editorialVoice: {
        score: editorialVoiceScore,
        styleNotes:
          editorialVoiceScore >= 80
            ? "Strong alignment with KnowledgeLog's thoughtful, depth-focused editorial voice."
            : "Review tone recommendations to better match KnowledgeLog standards.",
      },
    },
    recommendations,
    reviewedAt: new Date(),
  });

  return review;
}
