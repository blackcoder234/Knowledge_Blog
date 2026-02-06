import { Editor } from "@tiptap/react";
import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Quote,
  Undo,
  Redo,
  Minus,
  Code,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  CheckSquare,
  Maximize2,
  Minimize2,
  Search,
  ChevronDown,
  Type,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Indent,
  Outdent,
  FileCode,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sigma,
  Youtube,
  Save,
  Loader2,
  X,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { ColorSelector } from "./ColorSelector";

interface ToolbarProps {
  editor: Editor | null;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  onSave?: () => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  onExitZenMode?: () => void;
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  disabled,
  title,
  className,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={twMerge(
      "p-2 rounded-lg transition-all text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-sm active:scale-95",
      isActive && "bg-yellow-400 text-black shadow-glow font-semibold",
      className,
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-white/10 mx-2 self-center" />;

const ListStyleDropdown = ({
  editor,
  type,
}: {
  editor: Editor;
  type: "bullet" | "ordered";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const setListStyle = (style: string) => {
    if (type === "bullet") {
      editor
        .chain()
        .focus()
        .toggleBulletList()
        .updateAttributes("bulletList", { class: style })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .toggleOrderedList()
        .updateAttributes("orderedList", { class: style })
        .run();
    }
    setIsOpen(false);
  };

  return (
    <div
      className="relative flex items-center bg-transparent rounded-lg hover:bg-white/5 transition-colors pr-1 group"
      ref={dropdownRef}
    >
      <button
        onClick={() => {
          if (type === "bullet") {
            editor.chain().focus().toggleBulletList().run();
          } else {
            editor.chain().focus().toggleOrderedList().run();
          }
          setIsOpen(false); // Close dropdown if open when toggling main button
        }}
        className={twMerge(
          "p-2 rounded-l-lg text-gray-400 hover:text-white",
          (type === "bullet"
            ? editor.isActive("bulletList")
            : editor.isActive("orderedList")) && "text-yellow-400",
        )}
        title={type === "bullet" ? "Bullet List" : "Ordered List"}
      >
        {type === "bullet" ? <List size={20} /> : <ListOrdered size={20} />}
      </button>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 h-full rounded-r-lg text-gray-500 hover:text-white border-l border-white/5"
      >
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px] flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100 p-1">
          <div className="text-[10px] text-gray-500 uppercase px-2 py-1 font-bold">
            {type === "bullet" ? "Bullet Styles" : "Number Styles"}
          </div>

          {type === "bullet" ? (
            <>
              <button
                onClick={() => setListStyle("list-disc")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-current rounded-full" />
                </div>{" "}
                Disc
              </button>
              <button
                onClick={() => setListStyle("list-circle")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <div className="w-4 h-4 flex items-center justify-center border border-current rounded-full w-1.5 h-1.5" />{" "}
                Circle
              </button>
              <button
                onClick={() => setListStyle("list-square")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-current" />
                </div>{" "}
                Square
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => setListStyle("list-arrow")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center text-yellow-500">➢</span> Arrow
              </button>
              <button
                onClick={() => setListStyle("list-diamond")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center text-yellow-500 text-xs">
                  ❖
                </span>{" "}
                Diamond
              </button>
              <button
                onClick={() => setListStyle("list-star")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center text-yellow-500 text-xs">
                  ★
                </span>{" "}
                Star
              </button>
              <button
                onClick={() => setListStyle("list-triangle")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center text-yellow-500">‣</span>{" "}
                Triangle
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setListStyle("list-decimal")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center font-bold">1</span> 1, 2, 3...
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => setListStyle("list-alpha")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center font-bold">a</span> a, b, c...
              </button>
              <button
                onClick={() => setListStyle("list-alpha-upper")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center font-bold">A</span> A, B, C...
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => setListStyle("list-roman")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center font-serif">i</span> i, ii,
                iii...
              </button>
              <button
                onClick={() => setListStyle("list-roman-upper")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center font-serif">I</span> I, II,
                III...
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => setListStyle("list-bengali-number")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center font-bold">১</span> ১, ২, ৩...
              </button>
              <button
                onClick={() => setListStyle("list-bengali-alpha")}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-white/10 rounded text-gray-300"
              >
                <span className="w-4 text-center font-bold">ক</span> ক, খ, গ...
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CalloutDropdown = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const setCallout = (type: "info" | "warning" | "danger" | "success") => {
    // Ensure we are in a blockquote first
    if (!editor.isActive("blockquote")) {
      editor.chain().focus().setBlockquote().run();
    }

    // Apply the specific callout class (replaces existing class attribute in standard usage)
    editor
      .chain()
      .focus()
      .updateAttributes("blockquote", { class: `callout-${type}` })
      .run();

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarButton
        onClick={() => setIsOpen(!isOpen)}
        title="Callouts"
        isActive={
          isOpen || editor.isActive("blockquote", { class: /callout-/ })
        }
      >
        <div className="flex items-center gap-1">
          <AlertCircle size={18} />
          <ChevronDown size={10} className="opacity-50" />
        </div>
      </ToolbarButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px] flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100 p-1">
          <button
            onClick={() => setCallout("info")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Info size={16} /> Info
          </button>
          <button
            onClick={() => setCallout("success")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-green-400 hover:text-green-300 transition-colors"
          >
            <CheckCircle2 size={16} /> Success
          </button>
          <button
            onClick={() => setCallout("warning")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <AlertTriangle size={16} /> Warning
          </button>
          <button
            onClick={() => setCallout("danger")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
          >
            <XCircle size={16} /> Danger
          </button>
        </div>
      )}
    </div>
  );
};

const CaseTransformDropdown = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const transformText = (type: "upper" | "lower" | "capitalize") => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);

    let newText = text;
    if (type === "upper") newText = text.toUpperCase();
    if (type === "lower") newText = text.toLowerCase();
    if (type === "capitalize") {
      newText = text.replace(/\b\w/g, (char) => char.toUpperCase());
    }

    editor.chain().focus().insertContentAt({ from, to }, newText).run();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarButton
        onClick={() => setIsOpen(!isOpen)}
        title="Text Case"
        isActive={isOpen}
      >
        <div className="flex items-center">
          <span className="text-xs font-serif font-bold px-0.5">Aa</span>
        </div>
      </ToolbarButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px] flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100 p-1">
          <button
            onClick={() => transformText("upper")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <span className="uppercase font-semibold tracking-wider">
              Uppercase
            </span>
          </button>
          <button
            onClick={() => transformText("lower")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <span className="lowercase font-medium">lowercase</span>
          </button>
          <button
            onClick={() => transformText("capitalize")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <span className="capitalize font-medium">Capitalize</span>
          </button>
        </div>
      )}
    </div>
  );
};

const QuoteStyleDropdown = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const setQuoteInfo = (style: "minimal" | "filled" | "paper") => {
    if (!editor.isActive("blockquote")) {
      editor.chain().focus().toggleBlockquote().run();
    }
    let className = "";
    if (style === "filled") className = "quote-filled";
    if (style === "paper") className = "quote-paper";

    editor
      .chain()
      .focus()
      .updateAttributes("blockquote", { class: className })
      .run();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <ToolbarButton
        onClick={() => setIsOpen(!isOpen)}
        title="Quote Style"
        isActive={
          isOpen ||
          (editor.isActive("blockquote") &&
            !editor.isActive("blockquote", { class: /callout-/ }))
        }
      >
        <div className="flex items-center gap-1">
          <Quote size={20} />
          <ChevronDown size={10} className="opacity-50" />
        </div>
      </ToolbarButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px] flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100 p-1">
          <button
            onClick={() => setQuoteInfo("minimal")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <span className="font-serif italic font-bold text-gray-400">
              “ ”
            </span>{" "}
            Minimal
          </button>
          <button
            onClick={() => setQuoteInfo("filled")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <div className="w-4 h-4 bg-white/20 rounded-sm" /> Filled
          </button>
          <button
            onClick={() => setQuoteInfo("paper")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-yellow-200 hover:text-white transition-colors"
          >
            <div className="w-4 h-4 bg-[#fdf6e3] rounded-sm border border-yellow-600" />{" "}
            Paper
          </button>
        </div>
      )}
    </div>
  );
};

const HeadingDropdown = ({ editor }: { editor: Editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const getCurrentHeading = () => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor.isActive("heading", { level: 4 })) return "Heading 4";
    if (editor.isActive("heading", { level: 5 })) return "Heading 5";
    if (editor.isActive("heading", { level: 6 })) return "Heading 6";
    return "Paragraph";
  };

  const setHeading = (level: number) => {
    editor
      .chain()
      .focus()
      .toggleHeading({ level: level as any })
      .run();
    setIsOpen(false);
  };

  const setParagraph = () => {
    editor.chain().focus().setParagraph().run();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-40 justify-between border border-transparent hover:border-white/10"
      >
        <div className="flex flex-col items-start gap-0.5 overflow-hidden">
          <span className="text-sm font-medium truncate">
            {getCurrentHeading()}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={twMerge(
            "transition-transform duration-200 opacity-50",
            isOpen && "rotate-180 opacity-100",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[200px] flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100 p-1">
          <button
            onClick={setParagraph}
            className={twMerge(
              "flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors",
              editor.isActive("paragraph") &&
                "bg-yellow-400/10 text-yellow-500",
            )}
          >
            <Type size={18} className="opacity-70" />
            <span className="font-medium">Paragraph</span>
          </button>

          <div className="h-px bg-white/10 my-1 mx-2" />

          {[1, 2, 3, 4, 5, 6].map((level) => (
            <button
              key={level}
              onClick={() => setHeading(level)}
              className={twMerge(
                "flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors",
                editor.isActive("heading", { level }) &&
                  "bg-yellow-400/10 text-yellow-500",
              )}
            >
              <span
                className={twMerge(
                  "font-serif font-bold border border-white/10 bg-white/5 rounded px-1.5 min-w-[28px] text-center",
                  level === 1 && "text-lg",
                  level === 2 && "text-base",
                  level >= 3 && "text-sm",
                  editor.isActive("heading", { level }) &&
                    "border-yellow-500/30 bg-yellow-500/10",
                )}
              >
                H{level}
              </span>
              <span>Heading {level}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Toolbar = ({
  editor,
  isFocusMode,
  toggleFocusMode,
  onSave,
  saveStatus,
  onExitZenMode,
  onImageUpload,
}: ToolbarProps & { onImageUpload?: (file: File) => Promise<string> }) => {
  if (!editor) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (onImageUpload) {
        // Fire and forget, parent Editor handles optimistic UI
        onImageUpload(file);
      } else {
        const url = URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
    // Reset value so same file can be selected again
    if (event.target.value) {
      event.target.value = "";
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const handleTrigger = () => {
      triggerImageUpload();
    };
    window.addEventListener("trigger-image-upload", handleTrigger);
    return () =>
      window.removeEventListener("trigger-image-upload", handleTrigger);
  }, []);

  const setLink = () => {
    window.dispatchEvent(new Event("open-link-modal"));
  };

  const addYoutubeVideo = () => {
    window.dispatchEvent(new Event("open-youtube-modal"));
  };

  return (
    <div
      className={twMerge(
        "border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-50 flex flex-col shadow-2xl transition-all duration-300",
        isFocusMode ? "opacity-20 hover:opacity-100" : "opacity-100",
      )}
    >
      {/* Primary Toolbar Row */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 border-b border-white/5">
        {/* History */}
        <div className="flex gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo size={20} />
          </ToolbarButton>
        </div>

        <Divider />

        {/* Structure */}
        <HeadingDropdown editor={editor} />

        <Divider />

        {/* Colors */}
        <ColorSelector editor={editor} />

        <Divider />

        {/* Lists */}
        <div className="flex gap-0.5">
          <ListStyleDropdown editor={editor} type="bullet" />
          <ListStyleDropdown editor={editor} type="ordered" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive("taskList")}
            title="Task List"
          >
            <CheckSquare size={20} />
          </ToolbarButton>

          <div className="w-px h-5 bg-white/10 mx-0.5 self-center" />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().sinkListItem("listItem").run()
            }
            disabled={!editor.can().sinkListItem("listItem")}
            title="Indent (Nest List)"
          >
            <Indent size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().liftListItem("listItem").run()
            }
            disabled={!editor.can().liftListItem("listItem")}
            title="Outdent"
          >
            <Outdent size={20} />
          </ToolbarButton>
        </div>

        <Divider />

        {/* Code, Quote, Callout Group (Moved Before Insert) */}
        <div className="flex gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <FileCode size={20} />
          </ToolbarButton>
          <QuoteStyleDropdown editor={editor} />
          <CalloutDropdown editor={editor} />
        </div>

        <Divider />

        {/* Insert Group */}
        <div className="flex gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().setMathEquation().run()}
            isActive={editor.isActive("mathEquation")}
            title="Insert Equation"
          >
            <Sigma size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive("link")}
            title="Link"
          >
            <LinkIcon size={20} />
          </ToolbarButton>
          <ToolbarButton onClick={triggerImageUpload} title="Image">
            <ImageIcon size={20} />
          </ToolbarButton>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <ToolbarButton
            onClick={addYoutubeVideo}
            isActive={editor.isActive("youtube")}
            title="YouTube Video"
          >
            <Youtube size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            title="Table"
          >
            <TableIcon size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider"
          >
            <Minus size={20} />
          </ToolbarButton>
        </div>

        <div className="flex-1" />

        {/* View Controls */}
        <div className="flex gap-0.5">
          <ToolbarButton
            onClick={() => onSave?.()}
            title="Save Document"
            className={twMerge(
              "relative transition-all duration-500",
              saveStatus === "unsaved" &&
                "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
              saveStatus === "saved" &&
                "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
              saveStatus === "saving" && "bg-blue-500/10 text-blue-400",
            )}
          >
            <div className="relative flex items-center justify-center">
              <Save
                size={20}
                strokeWidth={saveStatus === "saved" ? 2.5 : 2}
                className={twMerge(
                  "transition-all duration-500",
                  saveStatus === "saving" && "opacity-20 scale-75",
                )}
              />
              {saveStatus === "saving" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                </div>
              )}
              {/* Change Indicator Dot */}
              {saveStatus === "unsaved" && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}
            </div>
          </ToolbarButton>
          <div className="w-px h-6 bg-white/10 mx-1 self-center" />
          <ToolbarButton
            onClick={() => window.dispatchEvent(new Event("toggle-search"))}
            title="Search & Replace"
          >
            <Search size={20} />
          </ToolbarButton>
          <ToolbarButton
            onClick={toggleFocusMode}
            isActive={isFocusMode}
            title="Focus Mode"
          >
            {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </ToolbarButton>

          {onExitZenMode && (
            <>
              <div className="w-px h-6 bg-white/10 mx-1 self-center" />
              <ToolbarButton
                onClick={onExitZenMode}
                title="Exit Zen Mode"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <X size={20} />
              </ToolbarButton>
            </>
          )}
        </div>
      </div>

      {/* Secondary Toolbar Row (Formatting) */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-black/40 border-b border-black/50 shadow-inner">
        {/* Formatting Group */}
        <div className="flex gap-0.5 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <Underline size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </ToolbarButton>
          {/* Case Dropdown */}
          <CaseTransformDropdown editor={editor} />
        </div>

        <div className="w-px h-5 bg-white/10 mx-1.5" />

        {/* Math / Script Group */}
        <div className="flex gap-0.5 mr-3">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive("subscript")}
            title="Subscript"
          >
            <Subscript size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive("superscript")}
            title="Superscript"
          >
            <Superscript size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="Inline Code"
          >
            <Code size={18} />
          </ToolbarButton>
        </div>

        <div className="w-px h-5 bg-white/10 mx-1.5" />

        {/* Alignment */}
        <div className="flex gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            isActive={editor.isActive({ textAlign: "left" })}
            title="Align Left"
          >
            <AlignLeft size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            isActive={editor.isActive({ textAlign: "center" })}
            title="Align Center"
          >
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            isActive={editor.isActive({ textAlign: "right" })}
            title="Align Right"
          >
            <AlignRight size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            isActive={editor.isActive({ textAlign: "justify" })}
            title="Justify"
          >
            <AlignJustify size={18} />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
};
