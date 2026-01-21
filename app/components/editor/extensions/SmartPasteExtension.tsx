import { Extension, ExtensionAttribute, PasteRule } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Slice, Fragment, Schema, Node } from "@tiptap/pm/model";

// Map common unicode math symbols to LaTeX
const UNICODE_TO_LATEX: Record<string, string> = {
  "∇": "\\nabla",
  "⋅": "\\cdot",
  "×": "\\times",
  "∂": "\\partial",
  "∑": "\\sum",
  "∏": "\\prod",
  "∫": "\\int",
  "≈": "\\approx",
  "≠": "\\neq",
  "≤": "\\leq",
  "≥": "\\geq",
  "∞": "\\infty",
  ε: "\\epsilon",
  θ: "\\theta",
  π: "\\pi",
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  δ: "\\delta",
  μ: "\\mu",
  ρ: "\\rho",
  σ: "\\sigma",
  Ω: "\\Omega",
  Δ: "\\Delta",
  "∅": "\\emptyset",
  "∈": "\\in",
  "∉": "\\notin",
  "⊂": "\\subset",
  "⊃": "\\supset",
  "∪": "\\cup",
  "∩": "\\cap",
  "→": "\\rightarrow",
  "⇒": "\\Rightarrow",
  "⇔": "\\Leftrightarrow",
  "∀": "\\forall",
  "∃": "\\exists",
};

// Heuristic: specific symbols that strongly suggest a line is a math equation
const STRONG_MATH_SYMBOLS = ["∇", "∂", "∑", "∫"];

export const SmartPasteExtension = Extension.create({
  name: "smartPaste",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("smartPaste"),
        props: {
          handlePaste: (view, event, slice) => {
            const { state } = view;
            const { schema } = state;

            // Get text content to check for patterns
            const text = event.clipboardData?.getData("text/plain");

            // If we have HTML, we generally want to let Tiptap handle it (preserves bold, links, etc.)
            // UNLESS it's explicitly a code block or specific math structure we want to force.
            // For now, if there is HTML, often it's better to default to returning false,
            // unless the text is VERY clearly a code fence or absolute math block.
            // However, a user might paste '$$...$$' from a website which comes as HTML.
            // Let's rely on the text pattern matching.
            if (!text) return false;

            const trimmed = text.trim();

            // 1. Check for Code Block (Fence)
            // Matches ```lang ... ```
            if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
              const codeContent = text
                .trim()
                .replace(/^```[a-z]*\n?|```$/g, "");
              const language = text.trim().match(/^```([a-z]+)/)?.[1] || "";
              if (schema.nodes.codeBlock) {
                const node = schema.nodes.codeBlock.create(
                  { language },
                  schema.text(codeContent),
                );
                const tr = state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
                return true; // Handled
              }
            }

            // 2. Scan for "Smart Math" Structures
            // We only intervene if we are CONFIDENT.
            // Otherwise we return false and let other rules/parsers handle it.

            const lines = text.split(/\r?\n/);

            // MATH HEURISTICS CHECK
            // We want to detect:
            // - Explicit blocks: $$...$$, \[...\], \begin{...}
            // - Strong symbols: ∇, ∂, etc mixed with variables.
            // - We do NOT want to detect: "Price = $5"

            let hasStrongMath = false;
            let isExplicitLatex = false;

            // Global Explicit Checks on the whole block
            if (
              /^\$\$[\s\S]*\$\$$/.test(trimmed) ||
              /^\\\[[\s\S]*\\\]$/.test(trimmed) ||
              /^\\begin\{[\s\S]*\\end\{[^}]+\}$/.test(trimmed)
            ) {
              isExplicitLatex = true;
            }

            // Line-by-line Strong Symbol Check
            if (!isExplicitLatex) {
              const mathLines = lines.filter((line) => {
                const l = line.trim();
                if (!l) return false;
                // Check for Strong Symbols
                const hasStrong = STRONG_MATH_SYMBOLS.some((s) =>
                  l.includes(s),
                );
                // Check for explicit latex commands
                const hasLatexCmd =
                  /\\(?:frac|sum|prod|int|partial|nabla|theta|alpha|beta|gamma|delta|sigma|omega|Delta|in|notin|subset|supset|cup|cap|forall|exists)/.test(
                    l,
                  );
                return hasStrong || hasLatexCmd;
              });

              // If a significant portion of lines look like math, treat as math
              // For a single line paste, strict check.
              if (
                mathLines.length > 0 &&
                mathLines.length >= lines.filter((l) => l.trim()).length * 0.5
              ) {
                hasStrongMath = true;
              }
            }

            // If it's not Code, and not Math, return false immediately to allow rich text paste.
            if (!isExplicitLatex && !hasStrongMath) {
              return false;
            }

            // --- PROCESSING LOGIC (Only runs if we decided it IS math) ---

            const nodes: Node[] = [];
            let mathBuffer: string[] = [];
            let inLatexBlock = false;

            const flushMathBuffer = () => {
              if (mathBuffer.length === 0) return;

              const first = mathBuffer[0].trim();
              const last = mathBuffer[mathBuffer.length - 1].trim();
              const isEnv = /^\\begin\{/.test(first) && /\\end\{/.test(last);

              let finalLatex = "";

              if (isEnv) {
                // Flatten align blocks primarily
                if (/^\\begin\{align\*?\}/.test(first)) {
                  const joined = mathBuffer.join(" ");
                  finalLatex = joined
                    .replace(/^\\begin\{align\*?\}/, "")
                    .replace(/\\end\{align\*?\}/, "")
                    .replace(/\\\\/g, ", \\quad ") // Comma separation preference
                    .replace(/&/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
                } else {
                  finalLatex = mathBuffer.join("\n");
                }
              } else {
                // Heuristic conversion for "Smart" paste (Unicode -> Latex)
                const converted = mathBuffer.map((line) => {
                  let l = line.trim();
                  Object.entries(UNICODE_TO_LATEX).forEach(([uni, tex]) => {
                    l = l.split(uni).join(tex + " ");
                  });
                  // Convert subscripts like A₀ -> A_0
                  l = l.replace(/([a-zA-Z\\]+)([₀-₉]+)/g, (_, c, s) => {
                    const nums = s
                      .split("")
                      .map((ch: string) => ch.charCodeAt(0) - 8320)
                      .join("");
                    return `${c.trim()}_${nums}`;
                  });
                  return l;
                });

                if (converted.length === 1) {
                  finalLatex = converted[0]
                    .replace(/^\$\$/, "")
                    .replace(/\$\$$/, "")
                    .replace(/^\\\[/, "")
                    .replace(/\\\]$/, "");
                } else {
                  finalLatex = `\\begin{aligned}\n${converted.join(" \\\\\n")}\n\\end{aligned}`;
                }
              }

              if (schema.nodes.math) {
                nodes.push(
                  schema.nodes.math.create({
                    latex: finalLatex,
                    displayMode: "block",
                  }),
                );
                // nodes.push(schema.nodes.paragraph.create()); // Optional spacer
              }
              mathBuffer = [];
            };

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;

              // Check for Block Start
              const isBlockStart =
                /^\\begin\{/.test(line) ||
                line.startsWith("$$") ||
                line.startsWith("\\[");

              if (isBlockStart) {
                if (mathBuffer.length > 0 && !inLatexBlock) {
                  flushMathBuffer();
                }
                inLatexBlock = true;
              }

              if (inLatexBlock) {
                mathBuffer.push(line);
                // Check for Block End
                const isBlockEnd =
                  /\\end\{/.test(line) ||
                  line.endsWith("$$") ||
                  line.endsWith("\\]");
                if (isBlockEnd) {
                  inLatexBlock = false;
                  flushMathBuffer();
                }
                continue;
              }

              // Normal Line in a "Math" paste context
              mathBuffer.push(line);
            }
            flushMathBuffer();

            if (nodes.length > 0) {
              const fragment = Fragment.fromArray(nodes);
              const tr = state.tr.replaceSelection(new Slice(fragment, 0, 0));
              view.dispatch(tr);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },

  // Keep the simple regex paste rules for inline things that handlePaste might miss if mixed with text
  addPasteRules() {
    return [
      // H1: # Heading
      new PasteRule({
        find: /^(?:#\s)(.+)$/gm,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          if (match[1]) {
            tr.replaceWith(
              range.from,
              range.to,
              state.schema.nodes.heading.create(
                { level: 1 },
                state.schema.text(match[1]),
              ),
            );
          }
        },
      }),
      // H2: ## Heading
      new PasteRule({
        find: /^(?:##\s)(.+)$/gm,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          if (match[1]) {
            tr.replaceWith(
              range.from,
              range.to,
              state.schema.nodes.heading.create(
                { level: 2 },
                state.schema.text(match[1]),
              ),
            );
          }
        },
      }),
      // H3: ### Heading
      new PasteRule({
        find: /^(?:###\s)(.+)$/gm,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          if (match[1]) {
            tr.replaceWith(
              range.from,
              range.to,
              state.schema.nodes.heading.create(
                { level: 3 },
                state.schema.text(match[1]),
              ),
            );
          }
        },
      }),
    ];
  },
});
