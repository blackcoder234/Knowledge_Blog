import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import React, { useState } from "react";
import { Check, Copy, FileCode } from "lucide-react";

export const CodeBlockComponent = ({
  node,
  updateAttributes,
  extension,
}: any) => {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || "text";

  const handleCopy = () => {
    // Get text content from the node
    const code = node.textContent;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="relative group my-6 rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#121212] border-b border-white/5 select-none text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <FileCode size={14} className="text-cyan-500" />
          <span className="font-mono uppercase opacity-80">{language}</span>
        </div>

        {/* Language Selection (Simplified dropdown or click to toggle could be added here later) */}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="!m-0 !p-4 !bg-[#1e1e1e] overflow-x-auto">
        {/* @ts-ignore */}
        <NodeViewContent as="code" className={`language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
};
