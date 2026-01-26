"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Image as ImageIcon,
  CheckCircle,
  Type,
  Sigma,
  Search,
  Command,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

interface EditorGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditorGuide = ({ isOpen, onClose }: EditorGuideProps) => {
  const [activeTab, setActiveTab] = useState("math");

  const tabs = [
    { id: "math", label: "Math & Science", icon: Sigma },
    { id: "writing", label: "Writing & Blocks", icon: Type },
    { id: "seo", label: "SEO & Stats", icon: Search },
    { id: "visuals", label: "Visuals", icon: ImageIcon },
    { id: "shortcuts", label: "Shortcuts", icon: Command },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop - optimized */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-[#18181b] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold">Author Guide</h2>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      KnowledgeLog
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                        activeTab === tab.id
                          ? "bg-cyan-900/20 text-cyan-400 border border-cyan-500/20"
                          : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 border-t border-white/5">
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  <X size={16} /> Close Guide
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-[#09090b] relative">
              <div className="p-8 max-w-3xl mx-auto space-y-8">
                {activeTab === "math" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Mathematical Notation
                      </h3>
                      <p className="text-zinc-400">
                        We use purely standard LaTeX syntax. You can type inline
                        math using <code className="text-cyan-400">$...$</code>{" "}
                        or display math using{" "}
                        <code className="text-cyan-400">$$...$$</code>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <CheatSheetSection title="Basics & Algebra">
                        <LatexRow label="Fractions" code="\frac{a}{b}" />
                        <LatexRow label="Exponents" code="x^2, e^{i\pi}" />
                        <LatexRow label="Roots" code="\sqrt{x}, \sqrt[n]{x}" />
                        <LatexRow
                          label="Relations"
                          code="=, \approx, \neq, \leq, \geq"
                        />
                      </CheatSheetSection>

                      <CheatSheetSection title="Calculus">
                        <LatexRow label="Integrals" code="\int_a^b x^2 dx" />
                        <LatexRow
                          label="Summation"
                          code="\sum_{n=1}^{\infty} 2^{-n}"
                        />
                        <LatexRow
                          label="Limits"
                          code="\lim_{x \to 0} \frac{\sin x}{x}"
                        />
                        <LatexRow
                          label="Derivatives"
                          code="\frac{d}{dx}, \partial x"
                        />
                      </CheatSheetSection>

                      <CheatSheetSection title="Set Theory & Logic">
                        <LatexRow
                          label="Sets"
                          code="\in, \subset, \cup, \cap"
                        />
                        <LatexRow
                          label="Logic"
                          code="\forall, \exists, \implies"
                        />
                        <LatexRow
                          label="Blackboard"
                          code="\mathbb{R}, \mathbb{N}, \mathbb{Z}"
                        />
                        <LatexRow label="Infinity" code="\infty, \emptyset" />
                      </CheatSheetSection>

                      <CheatSheetSection title="Matrices & Arrays">
                        <div className="text-xs text-zinc-500 mb-2">
                          Use standard matrix environments:
                        </div>
                        <code className="block bg-black/40 p-2 rounded text-indigo-300 text-xs font-mono whitespace-pre">
                          {`\\begin{pmatrix}
  1 & 0 \\\\
  0 & 1
\\end{pmatrix}`}
                        </code>
                      </CheatSheetSection>
                    </div>

                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                      <h4 className="flex items-center gap-2 text-yellow-500 font-bold mb-2 text-sm">
                        <HelpCircle size={16} /> Troubleshooting
                      </h4>
                      <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
                        <li>
                          Always close your brackets:{" "}
                          <code className="text-red-400 opacity-75">
                            \frac&#123;1&#125;2
                          </code>{" "}
                          (wrong) vs{" "}
                          <code className="text-green-400">
                            \frac&#123;1&#125;&#123;2&#125;
                          </code>{" "}
                          (right).
                        </li>
                        <li>
                          For multi-character subscripts, use curly braces:{" "}
                          <code className="text-green-400">
                            x_&#123;total&#125;
                          </code>
                          .
                        </li>
                        <li>
                          Spaces inside math mode are usually ignored; use{" "}
                          <code className="text-cyan-400">\,</code> or{" "}
                          <code className="text-cyan-400">\quad</code> for
                          spacing.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "writing" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Writing & Structures
                      </h3>
                      <p className="text-zinc-400">
                        Enhance your articles with rich media and semantic
                        blocks.
                      </p>
                    </div>

                    <div className="grid gap-6">
                      <div className="bg-[#18181b] p-6 rounded-xl border border-white/5">
                        <h4 className="flex items-center gap-2 text-white font-bold mb-4">
                          <Command size={18} className="text-cyan-400" /> The
                          Slash Menu
                        </h4>
                        <p className="text-sm text-zinc-400 mb-4">
                          Type{" "}
                          <kbd className="bg-white/10 px-2 py-1 rounded text-white font-mono">
                            /
                          </kbd>{" "}
                          at the start of any new line.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            "Heading 1",
                            "Bullet List",
                            "Quote",
                            "Callout",
                            "Math",
                            "Image",
                          ].map((item) => (
                            <div
                              key={item}
                              className="bg-black/40 px-3 py-2 rounded text-xs text-zinc-300 border border-white/5 text-center"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#18181b] p-6 rounded-xl border border-white/5">
                        <h4 className="flex items-center gap-2 text-white font-bold mb-4">
                          <CheckCircle size={18} className="text-green-500" />{" "}
                          Callout Blocks
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4 p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded text-sm text-blue-200">
                            <span>ℹ️</span>
                            <div>
                              <strong className="block text-blue-100 mb-1">
                                Info
                              </strong>
                              General definitions or notes.
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-3 bg-yellow-500/10 border-l-4 border-yellow-500 rounded text-sm text-yellow-200">
                            <span>⚠️</span>
                            <div>
                              <strong className="block text-yellow-100 mb-1">
                                Warning
                              </strong>
                              Critical cautions.
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-3 bg-purple-500/10 border-l-4 border-purple-500 rounded text-sm text-purple-200">
                            <span>💡</span>
                            <div>
                              <strong className="block text-purple-100 mb-1">
                                Tip
                              </strong>
                              Helpful hints.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-8">
                    <div className="flex gap-4 items-start">
                      <div className="p-3 bg-pink-500/10 rounded-xl text-pink-500">
                        <Search size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Search Engine Optimization
                        </h3>
                        <p className="text-zinc-400">
                          Optimize your content to rank higher.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <SeoCard
                        title="Meta Title"
                        desc="Keep titles under 60 chars."
                        status="Critical"
                      />
                      <SeoCard
                        title="Meta Description"
                        desc="Keep under 160 chars."
                        status="Critical"
                      />
                      <SeoCard
                        title="Featured Image"
                        desc="16:9 aspect ratio, at least 1200x630px."
                        status="Required"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "visuals" && (
                  <div className="space-y-8">
                    <div className="flex gap-4 items-start">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                        <ImageIcon size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          Visuals & Media
                        </h3>
                        <p className="text-zinc-400">Diagrams and images.</p>
                      </div>
                    </div>

                    <div className="bg-[#18181b] p-6 rounded-xl border border-white/5 space-y-4">
                      <h4 className="text-white font-bold flex items-center gap-2">
                        <code className="text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded text-xs">
                          /mermaid
                        </code>
                        Diagrams
                      </h4>
                      <p className="text-sm text-zinc-400">
                        Type <code className="text-cyan-400">/mermaid</code> to
                        insert charts.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "shortcuts" && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Keyboard Shortcuts
                      </h3>
                      <p className="text-zinc-400">Write faster.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ShortcutKey keys={["Cmd/Ctrl", "B"]} action="Bold" />
                      <ShortcutKey keys={["Cmd/Ctrl", "I"]} action="Italic" />
                      <ShortcutKey
                        keys={["Cmd/Ctrl", "U"]}
                        action="Underline"
                      />
                      <ShortcutKey
                        keys={["Cmd/Ctrl", "K"]}
                        action="Hyperlink"
                      />
                      <ShortcutKey keys={["Cmd/Ctrl", "Z"]} action="Undo" />
                      <ShortcutKey
                        keys={["Cmd/Ctrl", "Shift", "Z"]}
                        action="Redo"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper Components
const CheatSheetSection = ({ title, children }: any) => (
  <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
      {title}
    </h4>
    <div className="space-y-2">{children}</div>
  </div>
);

const LatexRow = ({ label, code }: any) => (
  <div className="flex justify-between items-center group">
    <span className="text-xs text-zinc-400">{label}</span>
    <code className="text-xs font-mono text-cyan-300 bg-black/50 px-1.5 py-0.5 rounded border border-white/5 group-hover:border-cyan-500/30 transition-colors cursor-text selection:bg-cyan-500/30">
      {code}
    </code>
  </div>
);

const SeoCard = ({ title, desc, status }: any) => (
  <div className="p-5 bg-[#18181b] border border-white/5 rounded-xl flex gap-4 items-start">
    <div
      className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
        status === "Critical"
          ? "bg-red-500/10 text-red-400"
          : status === "Required"
            ? "bg-yellow-500/10 text-yellow-400"
            : "bg-zinc-500/10 text-zinc-400"
      }`}
    >
      {status}
    </div>
    <div>
      <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
      <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const ShortcutKey = ({ keys, action }: any) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
    <span className="text-sm text-zinc-300">{action}</span>
    <div className="flex gap-1">
      {keys.map((k: string) => (
        <kbd
          key={k}
          className="bg-black/50 border-b-2 border-white/10 px-2 py-1 rounded text-[10px] text-zinc-400 font-mono min-w-[24px] text-center"
        >
          {k}
        </kbd>
      ))}
    </div>
  </div>
);
