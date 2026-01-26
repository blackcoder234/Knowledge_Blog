import { type JSONContent } from "@tiptap/react";

import katex from "katex";
import "katex/dist/katex.min.css";
import { createLowlight, common } from "lowlight";
import { toHtml } from "hast-util-to-html";

const lowlight = createLowlight(common);

interface RendererProps {
  content: JSONContent;
}

// Simple block renderers
const RenderNode = ({ node }: { node: JSONContent }) => {
  switch (node.type) {
    case "doc":
      return (
        <div className="prose prose-invert max-w-none">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </div>
      );

    case "paragraph":
      return (
        <p className="mb-4 text-gray-300 leading-relaxed">
          {node.content?.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </p>
      );

    case "heading": {
      const level = node.attrs?.level || 1;
      const Tag = `h${level}` as any;
      const sizes = {
        1: "text-4xl",
        2: "text-3xl",
        3: "text-2xl",
        4: "text-xl",
        5: "text-lg",
        6: "text-base",
      };
      const className = `${sizes[level as 1 | 2 | 3 | 4 | 5 | 6] || "text-4xl"} font-serif font-bold text-white mt-8 mb-4`;
      return (
        <Tag className={className}>
          {node.content?.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote className="border-l-4 border-yellow-500 pl-4 italic my-6 text-gray-400 bg-yellow-500/10 py-2 rounded-r">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </blockquote>
      );

    case "codeBlock": {
      const language = node.attrs?.language || "text";
      let html = "";
      try {
        const tree = lowlight.highlight(
          language,
          node.content?.[0]?.text || "",
        );
        html = toHtml(tree as any);
      } catch (e) {
        html = node.content?.[0]?.text || "";
      }
      return (
        <pre className="bg-[#0d0d0d] p-4 rounded-lg border border-white/10 overflow-x-auto my-4 text-sm font-mono shadow-inner">
          <code
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
      );
    }

    case "image":
      return (
        <figure className="my-8">
          <img
            src={node.attrs?.src}
            alt={node.attrs?.alt || ""}
            className="rounded-lg shadow-lg border border-white/5 w-full h-auto"
            loading="lazy"
          />
          {node.attrs?.title && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">
              {node.attrs.title}
            </figcaption>
          )}
        </figure>
      );

    case "bulletList":
      return (
        <ul className="list-disc pl-6 space-y-1 mb-4 marker:text-yellow-500">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="list-decimal pl-6 space-y-1 mb-4 marker:text-yellow-500">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </ol>
      );

    case "listItem":
      return (
        <li className="pl-1">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </li>
      );

    case "mathematics":
    case "mathEquation": {
      const latex = node.attrs?.latex || "";
      const isBlock = node.attrs?.isBlock || false;
      try {
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: isBlock,
        });
        return (
          <span
            dangerouslySetInnerHTML={{ __html: html }}
            className={isBlock ? "block my-4 text-center" : "mx-1 inline-block"}
          />
        );
      } catch (e) {
        return <code className="text-red-400">{latex}</code>;
      }
    }

    case "horizontalRule":
      return <hr className="border-white/10 my-8" />;

    case "table":
      return (
        <div className="overflow-x-auto my-6 border border-white/10 rounded-lg">
          <table className="min-w-full text-left">
            <tbody>
              {node.content?.map((child, i) => (
                <RenderNode key={i} node={child} />
              ))}
            </tbody>
          </table>
        </div>
      );

    case "tableRow":
      return (
        <tr className="border-b border-white/5 last:border-0">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </tr>
      );

    case "tableHeader":
      return (
        <th className="p-3 bg-white/5 font-semibold text-gray-200 border-r border-white/5 last:border-0">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </th>
      );

    case "tableCell":
      return (
        <td className="p-3 border-r border-white/5 last:border-0 align-top">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </td>
      );

    default:
      console.warn("Unknown node type:", node.type);
      return null;
  }
};

const RenderInline = ({ node }: { node: JSONContent }) => {
  if (node.type === "text") {
    let text = <>{node.text}</>;

    if (node.marks) {
      node.marks.forEach((mark) => {
        switch (mark.type) {
          case "bold":
            text = <strong className="font-bold text-white">{text}</strong>;
            break;
          case "italic":
            text = <em className="italic">{text}</em>;
            break;
          case "underline":
            text = (
              <u className="underline decoration-yellow-500/50 underline-offset-4">
                {text}
              </u>
            );
            break;
          case "strike":
            text = <s className="line-through opacity-70">{text}</s>;
            break;
          case "code":
            text = (
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-yellow-200">
                {text}
              </code>
            );
            break;
          case "link":
            text = (
              <a
                href={mark.attrs?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 underline underline-offset-4"
              >
                {text}
              </a>
            );
            break;
        }
      });
    }
    return text;
  }

  // Handle inline nodes like mathematics
  if (node.type === "mathematics" || node.type === "mathEquation") {
    return <RenderNode node={node} />;
  }

  return null;
};

export const TipTapRenderer = ({ content }: RendererProps) => {
  if (!content) return null;
  return <RenderNode node={content} />;
};
