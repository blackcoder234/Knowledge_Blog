"use client";

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import Link from "next/link";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import * as katex from "katex";
import "katex/dist/katex.min.css";
import * as mermaid from "mermaid";

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
 * CONTEXT: Renderer Config
 * -------------------------------------------------------------------------------- */
type RendererContextType = {
  onImageClick?: (src: string) => void;
};

const RendererContext = createContext<RendererContextType>({});

/* --------------------------------------------------------------------------------
 * HELPER: Render Marks (Bold, Italic, Link, etc.)
 * -------------------------------------------------------------------------------- */
const renderTextWithMarks = (node: JSONContent) => {
  if (!node.text) return null;

  let element: React.ReactNode = node.text;

  // Mark Order Priority: Link > Code > Bold/Italic
  if (node.marks) {
    node.marks.forEach((mark) => {
      switch (mark.type) {
        case "bold":
          element = <strong>{element}</strong>;
          break;
        case "italic":
          element = <em>{element}</em>;
          break;
        case "strike":
          element = <s>{element}</s>;
          break;
        case "underline":
          element = <u>{element}</u>;
          break;
        case "code":
          // Output semantic code tag. Prose styles handle the look.
          element = <code>{element}</code>;
          break;
        case "link":
          // Uses Next.js Link for optimized routing, but relies on Prose for styling
          element = (
            <Link
              href={mark.attrs?.href || "#"}
              target={mark.attrs?.target}
              rel={
                mark.attrs?.target === "_blank"
                  ? "noopener noreferrer"
                  : undefined
              }
            >
              {element}
            </Link>
          );
          break;
        case "highlight":
          element = <mark>{element}</mark>;
          break;
        case "textStyle":
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
 * COMPONENT: Mermaid Block
 * -------------------------------------------------------------------------------- */
const MermaidBlock = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    const renderChart = async () => {
      try {
        const m = (mermaid as any).default || mermaid;
        // Unique ID for each diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        if (typeof m.render === "function") {
          const { svg } = await m.render(id, code);
          setSvg(svg);
        }
      } catch (e) {
        console.error("Mermaid render error", e);
      }
    };
    renderChart();
  }, [code]);

  if (!svg)
    return (
      <div className="text-zinc-500 animate-pulse font-mono text-xs p-4 border border-white/10 rounded">
        Loading diagram...
      </div>
    );

  return (
    <div
      className="mermaid-svg-container w-full flex justify-center py-4 [&>svg]:max-w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

/* --------------------------------------------------------------------------------
 * COMPONENT: Code Block (Semantic Match)
 * -------------------------------------------------------------------------------- */
// CodeBlock component is now imported from ./CodeBlock.tsx
// Using the dedicated component for consistent industry-standard styling
import { CodeBlock } from "./CodeBlock"; // Ensure this import path is correct based on file structure

/* --------------------------------------------------------------------------------
 * COMPONENT: Math Block (Katex)
 * -------------------------------------------------------------------------------- */
const MathBlock = ({ node }: { node: JSONContent }) => {
  const latex = node.content?.[0]?.text || node.attrs?.latex || "";
  const isBlock = node.attrs?.isBlock ?? true; // Default to block if undefined, or check your specific node logic

  const html = React.useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: isBlock, // Respect the attribute
        throwOnError: false,
        errorColor: "#cc0000",
      });
    } catch (e) {
      return "Math Error";
    }
  }, [latex, isBlock]);

  // If Block: Centered div with margin
  if (isBlock) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "1.5rem 0", // Reduced from 2.5rem for tighter fit
          overflowX: "auto",
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // If Inline: Span with no extra margin
  return (
    <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
  );
};

/* --------------------------------------------------------------------------------
 * HELPER: Class Sanitizer
 * Removes explicit Tailwind utility classes saved by the editor,
 * keeping only semantic classes (callouts, custom lists, alignments).
 * -------------------------------------------------------------------------------- */
const sanitizeClass = (cls: string | undefined): string | undefined => {
  if (!cls) return undefined;

  return (
    cls
      .split(" ")
      .filter((c) => {
        // Keep semantic custom classes
        if (c.startsWith("callout")) return true;
        if (c.startsWith("quote-")) return true;
        if (c.startsWith("list-")) return true;

        // Keep alignment classes if used
        if (
          ["text-left", "text-center", "text-right", "text-justify"].includes(c)
        )
          return true;

        // Discard purely visual utility classes (border-*, text-gray-*, pl-*, etc.)
        return false;
      })
      .join(" ") || undefined
  );
};

/* --------------------------------------------------------------------------------
 * MAIN RENDERER
 * -------------------------------------------------------------------------------- */
export const JsonRenderer = ({
  content,
  onImageClick,
}: {
  content: JSONContent | JSONContent[];
  onImageClick?: (src: string) => void;
}) => {
  const nodes = Array.isArray(content) ? content : content.content;
  if (!nodes) return null;

  return (
    <RendererContext.Provider value={{ onImageClick }}>
      {nodes.map((node, index) => (
        <NodeRenderer key={index} node={node} />
      ))}
    </RendererContext.Provider>
  );
};

const NodeRenderer = ({ node }: { node: JSONContent }) => {
  switch (node.type) {
    case "doc":
      return <JsonRenderer content={node.content || []} />;

    case "paragraph":
      return (
        <p className={sanitizeClass(node.attrs?.class)}>
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
      const textContent = node.content?.map((c) => c.text).join(" ") || "";
      const slug = textContent.toLowerCase().replace(/[^\w]+/g, "-");

      // Structure aligned with ArticleContent post-processor
      return (
        <Tag id={slug} className="group flex items-center">
          {node.content?.map((c, i) =>
            c.type === "text" ? (
              renderTextWithMarks(c)
            ) : (
              <NodeRenderer key={i} node={c} />
            ),
          )}
          <a
            href={`#${slug}`}
            className="anchor-link ml-2 opacity-0 focus:opacity-100 group-hover:opacity-100 transition-opacity text-accent no-underline"
          >
            #
          </a>
        </Tag>
      );

    case "image":
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { onImageClick } = useContext(RendererContext);
      const { width, height, textAlign } = node.attrs || {};

      // Calculate alignment styles for the FIGURE container
      const figureStyle: React.CSSProperties = {
        textAlign: (textAlign as any) || "center",
        // If the editor saves specific alignments, handle them (e.g. float? usually just text-align for simple block images)
        display: "block",
        margin: "2em auto", // Default vertical spacing
      };

      // Calculate image specific styles
      const imgStyle: React.CSSProperties = {
        width: width || "100%",
        maxWidth: "100%",
        height: height || "auto",
        display: "inline-block", // Allows text-align on parent to work
      };

      return (
        <figure style={figureStyle}>
          <img
            src={node.attrs?.src}
            alt={node.attrs?.alt || ""}
            title={node.attrs?.title}
            onClick={() => onImageClick?.(node.attrs?.src)}
            style={imgStyle}
            className={onImageClick ? "cursor-zoom-in" : ""}
          />
          {node.attrs?.title && (
            <figcaption className="text-center text-sm text-zinc-500 mt-3 italic">
              {node.attrs.title}
            </figcaption>
          )}
        </figure>
      );

    case "codeBlock":
      const language = node.attrs?.language || "text";
      const rawCode = node.content?.map((c) => c.text).join("") || "";
      return <CodeBlock language={language} code={rawCode} />;

    case "blockquote":
      // Rely on globals.css for styling (including callouts)
      return (
        <blockquote className={sanitizeClass(node.attrs?.class)}>
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </blockquote>
      );

    case "bulletList":
      return (
        <ul className={sanitizeClass(node.attrs?.class)}>
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className={sanitizeClass(node.attrs?.class)}>
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </ol>
      );

    case "listItem":
      return (
        <li>
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </li>
      );

    case "horizontalRule":
      return <hr />;

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

    case "mathEquation":
      return <MathBlock node={node} />;

    case "mermaid":
      // Supports standard Tiptap Mermaid nodes
      const code = node.attrs?.code || node.content?.[0]?.text || "";
      return <MermaidBlock code={code} />;

    case "table":
      // Output raw table, let Prose handle styling/scrolling
      // Wrapped in a div for responsive scrolling (Industrial Standard)
      return (
        <div className="overflow-x-auto my-8 w-full">
          <table className="w-auto text-left border-collapse border border-white/10 rounded-lg shadow-sm">
            <tbody>
              {node.content?.map((c, i) => (
                <NodeRenderer key={i} node={c} />
              ))}
            </tbody>
          </table>
        </div>
      );

    case "tableRow":
      return (
        <tr>
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </tr>
      );

    case "tableHeader":
      return (
        <th>
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </th>
      );

    case "tableCell":
      return (
        <td>
          {node.content?.map((c, i) => (
            <NodeRenderer key={i} node={c} />
          ))}
        </td>
      );

    case "text":
      return renderTextWithMarks(node);

    default:
      console.warn("Unknown node type:", node.type);
      return null;
  }
};
