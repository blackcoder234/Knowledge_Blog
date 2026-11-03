import { sanitizeItemLink } from "./urlValidator";

export interface DraftSectionInput {
  heading: string;
  level?: 2 | 3;
  paragraphs: string[];
  callout?: {
    type: "tip" | "info" | "warning" | "danger" | "success";
    text: string;
  };
  keyTakeaways?: string[];
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface GeneratedDraftOutput {
  contentJson: any; // TipTap document JSON
  contentHtml: string; // Semantic HTML fallback
  plainText: string;
  wordCount: number;
  readTime: string;
}

/**
 * Converts structured editorial sections into native KnowledgeLog TipTap JSON
 * and semantic HTML matching editor.config.ts extensions.
 */
export function buildTipTapDraft(
  sections: DraftSectionInput[],
  sources: { title: string; url: string; publisher: string; publishedAt?: Date; excerpt?: string }[]
): GeneratedDraftOutput {
  const contentJsonNodes: any[] = [];
  const htmlParts: string[] = [];
  let totalWords = 0;
  const plainTextParts: string[] = [];

  for (const sec of sections) {
    const headingLevel = sec.level || 2;

    // 1. Heading
    contentJsonNodes.push({
      type: "heading",
      attrs: { level: headingLevel },
      content: [{ type: "text", text: sec.heading }],
    });
    htmlParts.push(`<h${headingLevel}>${escapeHtml(sec.heading)}</h${headingLevel}>`);
    plainTextParts.push(sec.heading);
    totalWords += countWords(sec.heading);

    // 2. Callout block if present
    if (sec.callout && sec.callout.text) {
      const calloutClass = `callout callout-${sec.callout.type || "info"}`;
      contentJsonNodes.push({
        type: "blockquote",
        attrs: { class: calloutClass },
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: sec.callout.text }],
          },
        ],
      });
      htmlParts.push(
        `<blockquote class="${calloutClass}"><p>${escapeHtml(sec.callout.text)}</p></blockquote>`
      );
      plainTextParts.push(sec.callout.text);
      totalWords += countWords(sec.callout.text);
    }

    // 3. Paragraphs
    for (const para of sec.paragraphs) {
      if (!para.trim()) continue;
      contentJsonNodes.push({
        type: "paragraph",
        content: [{ type: "text", text: para }],
      });
      htmlParts.push(`<p>${escapeHtml(para)}</p>`);
      plainTextParts.push(para);
      totalWords += countWords(para);
    }

    // 4. Code snippet if present
    if (sec.codeSnippet && sec.codeSnippet.code) {
      contentJsonNodes.push({
        type: "codeBlock",
        attrs: { language: sec.codeSnippet.language || "typescript" },
        content: [{ type: "text", text: sec.codeSnippet.code }],
      });
      htmlParts.push(
        `<pre><code class="language-${sec.codeSnippet.language || "typescript"}">${escapeHtml(
          sec.codeSnippet.code
        )}</code></pre>`
      );
      plainTextParts.push(sec.codeSnippet.code);
      totalWords += countWords(sec.codeSnippet.code);
    }

    // 5. Key takeaways list if present
    if (sec.keyTakeaways && sec.keyTakeaways.length > 0) {
      const listNodes = sec.keyTakeaways.map((item) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: item }],
          },
        ],
      }));
      contentJsonNodes.push({
        type: "bulletList",
        content: listNodes,
      });

      const listHtml = sec.keyTakeaways
        .map((item) => `<li><p>${escapeHtml(item)}</p></li>`)
        .join("");
      htmlParts.push(`<ul>${listHtml}</ul>`);

      for (const item of sec.keyTakeaways) {
        plainTextParts.push(item);
        totalWords += countWords(item);
      }
    }
  }

  // 6. Append Sources & References Section at the end
  if (sources && sources.length > 0) {
    contentJsonNodes.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Sources & Provenance" }],
    });
    htmlParts.push(`<h3>Sources & Provenance</h3>`);

    const sourceListNodes = sources.map((s) => {
      const safeUrl = sanitizeItemLink(s.url) || "#";
      const dateText = s.publishedAt
        ? ` (${new Date(s.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })})`
        : "";
      return {
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `${s.publisher}${dateText}: `,
                marks: [{ type: "bold" }],
              },
              {
                type: "text",
                text: s.title,
                marks: [
                  {
                    type: "link",
                    attrs: { href: safeUrl, target: "_blank", rel: "noopener noreferrer" },
                  },
                ],
              },
            ],
          },
        ],
      };
    });

    contentJsonNodes.push({
      type: "bulletList",
      content: sourceListNodes,
    });

    const sourceListHtml = sources
      .map((s) => {
        const safeUrl = sanitizeItemLink(s.url) || "#";
        const dateText = s.publishedAt
          ? ` (${new Date(s.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })})`
          : "";
        return `<li><p><strong>${escapeHtml(s.publisher)}${escapeHtml(dateText)}:</strong> <a href="${escapeHtml(
          safeUrl
        )}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title)}</a></p></li>`;
      })
      .join("");
    htmlParts.push(`<ul>${sourceListHtml}</ul>`);
  }

  const readTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

  return {
    contentJson: {
      type: "doc",
      content: contentJsonNodes,
    },
    contentHtml: htmlParts.join("\n"),
    plainText: plainTextParts.join("\n\n"),
    wordCount: totalWords,
    readTime: `${readTimeMinutes} min read`,
  };
}

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

