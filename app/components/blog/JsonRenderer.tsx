"use client";

import React, { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import * as katex from "katex";
import "katex/dist/katex.min.css";

/* --------------------------------------------------------------------------------
 * TYPES
 * -------------------------------------------------------------------------------- */
type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
  }[];
  text?: string;
  [key: string]: any;
};

/* --------------------------------------------------------------------------------
 * HELPER: Render Marks (Bold, Italic, Link, etc.)
 * -------------------------------------------------------------------------------- */
const renderTextWithMarks = (node: JSONContent) => {
  if (!node.text) return null;

  let element: React.ReactNode = node.text;

  // Mark Order Priority: Link > Code > Bold/Italic
  // But usually we just wrap iteratively.

  if (node.marks) {
    node.marks.forEach((mark) => {
      switch (mark.type) {
        case "bold":
          element = <strong className="text-white font-bold">{element}</strong>;
          break;
        case "italic":
          element = <em className="italic">{element}</em>;
          break;
        case "strike":
          element = <s className="line-through opacity-70">{element}</s>;
          break;
        case "underline":
          element = (
            <u className="underline underline-offset-4 decoration-accent/30">
              {element}
            </u>
          );
          break;
        case "code":
          element = (
            <code className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-mono text-sm">
              {element}
            </code>
          );
          break;
        case "link":
          element = (
            <Link
              href={mark.attrs?.href || "#"}
              target={mark.attrs?.target}
              rel={
                mark.attrs?.target === "_blank"
                  ? "noopener noreferrer"
                  : undefined
              }
              className="text-accent hover:text-accent/80 underline decoration-accent/30 hover:decoration-accent transition-all"
            >
              {element}
            </Link>
          );
          break;
        case "highlight":
          element = (
            <mark className="bg-yellow-500/20 text-yellow-200 rounded px-1">
              {element}
            </mark>
          );
          break;
        case "textStyle":
          // Handle color if present
          if (mark.attrs?.color) {
            element = (
              <span style={{ color: mark.attrs.color }}>{element}</span>
            );
          }
          break;
      }
    });
  }

  return <React.Fragment key={Math.random()}>{element}</React.Fragment>;
};

/* --------------------------------------------------------------------------------
 * COMPONENT: Code Block (with Copy & Highlight)
 * -------------------------------------------------------------------------------- */
const CodeBlock = ({ node }: { node: JSONContent }) => {
  const language = node.attrs?.language || "text";
  const rawCode = node.content?.map((c) => c.text).join("") || "";
  const [copied, setCopied] = React.useState(false);

  // Syntax Highlight (Client-side)
  // We can use a ref or just simple dangerouslySetInnerHTML with hljs result
  const highlightedCode = React.useMemo(() => {
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(rawCode, { language }).value;
      }
      return hljs.highlightAuto(rawCode).value;
    } catch (e) {
      return rawCode;
    }
  }, [rawCode, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-8 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/5">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-zinc-300">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------------
 * COMPONENT: Math Block (Katex)
 * -------------------------------------------------------------------------------- */
const MathBlock = ({ node }: { node: JSONContent }) => {
  const latex = node.content?.[0]?.text || ""; // Assuming text content
  // OR it might be in attrs in some extensions
  // Let's assume text node inside math block for now, or adapt if schema differs.
  // Actually, Tiptap math extension usually calls it 'math_display' or 'math_inline'.
  // If it's a block, it renders standard Katex display mode.

  // Fallback if structure is slightly different (e.g. attrs.latex)
  const formula = latex || node.attrs?.latex || "";

  const html = React.useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
        errorColor: "#cc0000",
      });
    } catch (e) {
      return "Math Error";
    }
  }, [formula]);

  return (
    <div
      className="my-8 flex justify-center overflow-x-auto p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/* --------------------------------------------------------------------------------
 * MAIN RENDERER
 * -------------------------------------------------------------------------------- */
export const JsonRenderer = ({
  content,
}: {
  content: JSONContent | JSONContent[];
}) => {
  // Handle if content is the top-level doc { type: 'doc', content: [...] }
  const nodes = Array.isArray(content) ? content : content.content;

  if (!nodes) return null;

  return (
    <div className="space-y-2">
      {" "}
      {/* Tiny generic spacing, relying on block margins */}
      {nodes.map((node, index) => (
        <NodeRenderer key={index} node={node} />
      ))}
    </div>
  );
};

const NodeRenderer = ({ node }: { node: JSONContent }) => {
  switch (node.type) {
    case "paragraph":
      return (
        <p className="text-xl leading-relaxed font-light text-zinc-300/90 my-6">
          {node.content?.map((c, i) =>
            c.type === "text" ? (
              renderTextWithMarks(c)
            ) : (
              <NodeRenderer key={i} node={c} />
            ),
          )}
        </p>
      );

    case "heading":
      const level = node.attrs?.level || 1;
      const Tag = `h${level}` as React.ElementType;
      const sizes: Record<string, string> = {
        h1: "text-4xl font-bold text-white mb-8 mt-12",
        h2: "text-3xl font-bold text-white mb-6 mt-12 border-b border-white/10 pb-4",
        h3: "text-2xl font-semibold text-white mb-4 mt-8",
        h4: "text-xl font-bold text-white mb-4 mt-8",
        h5: "text-lg font-bold text-zinc-200 mb-2 mt-6",
        h6: "text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2 mt-6",
      };

      // Generate an ID for anchor links (if missing, we assume one)
      // Simple text-to-slug logic for anchors
      const textContent = node.content?.map((c) => c.text).join(" ") || "";
      const slug = textContent.toLowerCase().replace(/[^\w]+/g, "-");

      return (
        <Tag id={slug} className={`font-serif ${sizes[`h${level}`] || ""}`}>
          {/* Anchor Link on Hover */}
          <span className="group flex items-center">
            {node.content?.map((c, i) =>
              c.type === "text" ? (
                renderTextWithMarks(c)
              ) : (
                <NodeRenderer key={i} node={c} />
              ),
            )}
            <a
              href={`#${slug}`}
              className="ml-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity no-underline"
            >
              #
            </a>
          </span>
        </Tag>
      );

    case "image":
      return (
        <figure className="my-10">
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
            {/* Native Next.js Image or simple img? 
                        Next.js Image requires known width/height which Tiptap might not give precisely per resize.
                        We'll use standard img for flexibility with max-w-full.
                     */}
            <img
              src={node.attrs?.src}
              alt={node.attrs?.alt || ""}
              className="w-full h-auto cursor-zoom-in"
              style={{ width: node.attrs?.width || "100%" }}
            />
          </div>
          {node.attrs?.title && (
            <figcaption className="text-center text-sm text-zinc-500 mt-3 italic">
              {node.attrs.title}
            </figcaption>
          )}
        </figure>
      );

    case "codeBlock":
      return <CodeBlock node={node} />;

    case "blockquote":
      return (
        <blockquote className="border-l-4 border-accent pl-6 italic text-zinc-400 my-8 py-2 text-lg bg-white/5 rounded-r-lg">
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </blockquote>
      );

    case "bulletList":
      return (
        <ul className="list-disc pl-6 my-6 text-zinc-300 space-y-2 marker:text-accent/60">
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal pl-6 my-6 text-zinc-300 space-y-2 marker:text-accent font-medium">
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </ol>
      );

    case "listItem":
      return (
        <li className="pl-2">
          {/* List Items often wrapp Text in Paragraphs, we want to unwrap if simple, or keep if complex. 
                     Tiptap schema: listItem -> [paragraph -> text]
                     We usually just render children.
                 */}
          {node.content?.map((c, i) =>
            // If it's a generic paragraph inside a list item, we might want to strip the excessive margin of 'p'
            // or just render it. Let's inspect type.
            c.type === "paragraph" ? (
              <span key={i} className="block mb-2">
                {c.content?.map((sub, j) =>
                  sub.type === "text" ? (
                    renderTextWithMarks(sub)
                  ) : (
                    <NodeRenderer key={j} node={sub} />
                  ),
                )}
              </span>
            ) : (
              <NodeRenderer key={i} node={c} />
            ),
          )}
        </li>
      );

    case "horizontalRule":
      return <hr className="border-white/10 my-16" />;

    case "youtube":
      return (
        <div className="relative aspect-video my-10 rounded-xl overflow-hidden shadow-xl border border-white/10 bg-black">
          <iframe
            src={node.attrs?.src}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title="YouTube video"
          />
        </div>
      );

    // Add Math Equation Support
    case "mathEquation":
      return <MathBlock node={node} />;

    case "text":
      // Usually handled by parent, but if standalone:
      return renderTextWithMarks(node);

    default:
      console.warn("Unknown node type:", node.type, node);
      return null;
  }
};
