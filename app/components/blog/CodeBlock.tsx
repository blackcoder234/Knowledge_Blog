import React, { useState } from "react";
import hljs from "highlight.js/lib/core";
// Import only common languages to keep bundle size low
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml"; // handles HTML
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import { Check, Clipboard, Copy } from "lucide-react";

// Register languages
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("c", c);
hljs.registerLanguage("cpp", cpp);

// Theme (Dracula/One Dark Hybrid)
// We'll embed strict theme CSS here to ensure it overrides everything
const HIGHLIGHT_STYLES = `
  .hljs-comment, .hljs-quote { color: #6272a4; font-style: italic; }
  .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section, .hljs-link { color: #ff79c6; }
  .hljs-attribute, .hljs-name, .hljs-symbol, .hljs-bullet, .hljs-subst { color: #f1fa8c; }
  .hljs-string, .hljs-meta, .hljs-addition, .hljs-type { color: #f1fa8c; }
  .hljs-title, .hljs-built_in, .hljs-function, .hljs-class .hljs-title { color: #50fa7b; }
  .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-tag, .hljs-number, .hljs-regexp { color: #8be9fd; }
  .hljs-emphasis { font-style: italic; }
  .hljs-strong { font-weight: bold; }
`;

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  language = "text",
  code,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  // Normalize language for highlight.js
  const lang = language.toLowerCase();

  // Highlight code safely
  const highlightedCode = (() => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch (e) {
      return code; // Fallback to plain text
    }
  })();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative my-6 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-[#0d0d0d] group font-sans">
      <style>{HIGHLIGHT_STYLES}</style>

      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5 select-none font-sans">
        {/* Language Label */}
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5 opacity-50">
            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
          </span>
          <span className="ml-2 text-xs font-medium text-gray-400 uppercase tracking-wider font-mono">
            {lang || "CODE"}
          </span>
        </div>

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {isCopied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="relative overflow-x-auto">
        <pre className="!m-0 !bg-[#0d0d0d] !p-5 text-[0.9em] leading-relaxed font-mono">
          <code
            className={`hljs language-${lang} !bg-transparent !p-0 !text-[#f8f8f2] font-mono`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
};
