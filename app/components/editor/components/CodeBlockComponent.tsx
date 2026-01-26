import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";
import { Check, Clipboard, ChevronDown } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

interface CodeBlockProps extends NodeViewProps {
  // Relaxed type for node to avoid strict checks on attrs
}

export const CodeBlockComponent = ({
  node,
  updateAttributes,
}: CodeBlockProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Common languages for the dropdown
  const languages = [
    "javascript",
    "typescript",
    "html",
    "css",
    "json",
    "python",
    "java",
    "c",
    "cpp",
    "bash",
    "sql",
  ];

  const copyToClipboard = () => {
    // Correct way to get text content from a Node in TipTap
    const textContent = node.textContent;

    navigator.clipboard.writeText(textContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="relative my-4 rounded-lg overflow-hidden border border-white/10 shadow-xl bg-[#0d0d0d] group">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5 select-none">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-white transition-colors"
          >
            {node.attrs.language || "auto"}
            <ChevronDown
              size={12}
              className={twMerge(
                "transition-transform",
                isLangOpen && "rotate-180",
              )}
            />
          </button>

          {isLangOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsLangOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-32 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-md shadow-xl z-20 py-1">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      updateAttributes({ language: lang });
                      setIsLangOpen(false);
                    }}
                    className={twMerge(
                      "w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white font-mono",
                      node.attrs.language === lang &&
                        "text-yellow-400 bg-white/5",
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
          title="Copy code"
        >
          {isCopied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Clipboard size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <pre className="!m-0 !bg-[#0d0d0d] !p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
};
