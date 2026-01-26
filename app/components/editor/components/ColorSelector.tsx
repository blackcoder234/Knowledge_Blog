import { useState, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import {
  Palette,
  Baseline,
  Highlighter as HighlighterIcon,
  Check,
  Plus,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

interface ColorSelectorProps {
  editor: Editor;
}

// Text colors: Vibrant, Readable
const TEXT_COLORS = [
  { name: "Default", color: "#e4e4e7" },
  { name: "Gray", color: "#a1a1aa" },
  { name: "White", color: "#ffffff" },
  { name: "Red", color: "#fb7185" },
  { name: "Orange", color: "#fb923c" },
  { name: "Amber", color: "#fbbf24" },
  { name: "Yellow", color: "#facc15" },
  { name: "Lime", color: "#a3e635" },
  { name: "Green", color: "#4ade80" },
  { name: "Emerald", color: "#34d399" },
  { name: "Teal", color: "#2dd4bf" },
  { name: "Cyan", color: "#22d3ee" },
  { name: "Blue", color: "#60a5fa" },
  { name: "Indigo", color: "#818cf8" },
  { name: "Violet", color: "#a78bfa" },
  { name: "Purple", color: "#c084fc" },
  { name: "Fuchsia", color: "#e879f9" },
  { name: "Pink", color: "#f472b6" },
  { name: "Rose", color: "#fb7185" },
];

// Highlight colors: Muted, Pastel, Transparent-ish
const HIGHLIGHT_COLORS = [
  { name: "None", color: "transparent" },
  { name: "Yellow", color: "#facc15" },
  { name: "Green", color: "#4ade80" },
  { name: "Blue", color: "#60a5fa" },
  { name: "Purple", color: "#c084fc" },
  { name: "Red", color: "#fb7185" },
  { name: "Gray", color: "#52525b" },
];

export const ColorSelector = ({ editor }: ColorSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Refs for custom color inputs
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const highlightColorInputRef = useRef<HTMLInputElement>(null);

  const activeColor = editor.getAttributes("textStyle").color;
  const activeHighlight = editor.getAttributes("highlight").color;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    // Don't close immediately for custom picker workflow, but for presets we could
  };

  const setHighlight = (color: string) => {
    if (color === "transparent") {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={twMerge(
          "p-2 rounded-md transition-colors text-gray-400 hover:bg-white/10 hover:text-white",
          isOpen && "bg-white/10 text-white",
          activeColor && activeColor !== "#e4e4e7" && "text-yellow-400",
        )}
        title="Colors"
      >
        <Palette size={18} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[260px] p-3 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          {/* Text Color Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Baseline size={12} /> Text Color
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setTextColor(c.color)}
                  title={c.name}
                  className={twMerge(
                    "group relative flex items-center justify-center h-8 w-8 rounded hover:bg-white/10 transition-colors border border-transparent",
                    activeColor === c.color && "bg-white/10 border-white/20",
                  )}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: c.color }}
                  />
                  {activeColor === c.color && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-black rounded-full shadow-sm" />
                    </div>
                  )}
                </button>
              ))}

              {/* Custom Text Color Trigger */}
              <button
                onClick={() => textColorInputRef.current?.click()}
                title="Custom Color"
                className="group relative flex items-center justify-center h-8 w-8 rounded hover:bg-white/10 transition-colors border border-white/5 hover:border-white/20"
              >
                <Plus
                  size={14}
                  className="text-gray-400 group-hover:text-white"
                />
                <input
                  ref={textColorInputRef}
                  type="color"
                  className="absolute opacity-0 pointer-events-none"
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </button>
            </div>
          </div>

          <div className="h-px bg-white/10 w-full" />

          {/* Highlight Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <HighlighterIcon size={12} /> Highlight
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setHighlight(c.color)}
                  title={c.name}
                  className={twMerge(
                    "group relative flex items-center justify-center h-8 w-8 rounded hover:bg-white/10 transition-colors border border-transparent",
                    activeHighlight === c.color &&
                      "bg-white/10 border-white/20",
                  )}
                >
                  {c.name === "None" ? (
                    <div className="w-full h-full flex items-center justify-center opacity-70">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transform rotate-45"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded border border-white/20 shadow-sm opacity-90"
                      style={{ backgroundColor: c.color }}
                    />
                  )}
                  {(activeHighlight === c.color ||
                    (c.name === "None" && !activeHighlight)) && (
                    <div className="absolute -top-1 -right-1 bg-white text-black rounded-full p-0.5 shadow-sm">
                      <Check size={8} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}

              {/* Custom Highlight Trigger */}
              <button
                onClick={() => highlightColorInputRef.current?.click()}
                title="Custom Highlight"
                className="group relative flex items-center justify-center h-8 w-8 rounded hover:bg-white/10 transition-colors border border-white/5 hover:border-white/20"
              >
                <Plus
                  size={14}
                  className="text-gray-400 group-hover:text-white"
                />
                <input
                  ref={highlightColorInputRef}
                  type="color"
                  className="absolute opacity-0 pointer-events-none"
                  onChange={(e) => setHighlight(e.target.value)}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
